# Design notes & trade-offs

## Architecture

Layers are wired by composition, each one owning exactly one concern:

| Layer      | File                                  | Responsibility                                                                                                                     |
| ---------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Transport  | `src/core/api/api.client.ts`          | HTTP only: build URL, send, parse body, log. Returns `{status, ok, body}` and never decides what counts as success.                |
| Runner     | `src/core/api/api-action-runner.ts`   | Wraps a business operation in a reporter step and, when given an expected status, fails it with the recent request/response log.   |
| Gateway    | `src/api/device.gateway.ts`           | Device endpoints (`/objects`, `/objects/{id}`) — URL and verb only. No state, no status codes, no rules.                           |
| Actions    | `src/api/device.actions.ts`           | Typed lifecycle operations (`provisionDevice`, `updateFirmware`, `decommissionDevice`), owns the state machine and the guard rail. |
| Assertions | `src/assertions/device.assertions.ts` | Every expectation the spec makes, including status codes.                                                                          |

The fixture builds the chain (`ApiClient` → `DeviceGateway` + `ApiActionRunner` →
`DeviceActions`) and injects only `DeviceActions` into the test, so a spec has no way to
reach the raw HTTP client and bypass the lifecycle rules.

Step reporting is centralised in the runner rather than a `@step` decorator on every action
method. That gives one place to extend with cross-cutting behaviour later, and lets step
titles be built from the actual arguments (`Update firmware of device <id> to v1.3.1`).

## Device lifecycle state machine

The target API has no state-machine validation of its own, so the client enforces it.
`DeviceActions` keeps an in-memory map of the devices **it created itself** and rejects any
transition that is not allowed from the current state, _before_ any HTTP request is sent.

States: `provisioned` → `active` → `decommissioned`

| From             | Allowed to       | Operation                                                                    |
| ---------------- | ---------------- | ---------------------------------------------------------------------------- |
| `provisioned`    | `active`         | `updateFirmware()` — firmware update also brings the device into service     |
| `active`         | `active`         | `updateFirmware()` again — re-flashing a live device is legal and repeatable |
| `active`         | `decommissioned` | `decommissionDevice()`                                                       |
| `decommissioned` | —                | terminal state                                                               |

Guard rails encoded in the client:

- `decommissionDevice()` on a device that is still `provisioned` throws
  `InvalidTransitionError` and never issues the `DELETE`. This is the invalid transition
  exercised by the test.
- `updateFirmware()` / `decommissionDevice()` on an id the client did not provision throws
  as well (`from: 'unknown'`). This is what keeps the suite off the shared pre-seeded demo
  objects (ids 1–13) — the client simply refuses to operate on anything it did not create.

The self-transition `active → active` is intentional. The task narrative lists
"firmware-updated" as a lifecycle stage, but the concrete steps only ever use the status
values `provisioned` and `active`, so a separate state would have been dead weight. Making
firmware update a one-shot operation instead would have been wrong in the other direction:
re-flashing a device in service is a normal thing to do.

## Trade-offs

**Payload shape.** The task's example payload is flat (`{model, sensor_type, firmware,
status}`), but `api.restful-api.dev` silently drops any top-level field other than `name`
and `data` — a flat POST comes back as `{"id": "...", "name": null, "data": null}`. The
gateway therefore wraps the hardware spec into `{name, data}`, and `name` is set to the
device model. Field names inside `data` are kept in the task's snake_case (`sensor_type`)
rather than normalised to camelCase, so the stored document matches the task verbatim.

**Where status codes are checked.** The transport layer never judges a response — it hands
back `{status, ok, body}`. Every action instead takes the status it expects as a parameter
defaulting to `200`, and the runner raises `ApiActionError` (carrying the recent
request/response log) when the actual status differs. The spec therefore states the
expectation at the call site, the way `supertest`'s `.expect(200)` or REST Assured's
`.statusCode(200)` do: `getDevice(id)` for the live device, `getDevice(id, NOT_FOUND)` for
the decommissioned one. A default rather than a bare optional matters — omitting the
argument still validates `200`, so a silent 500 can never slip through unchecked, and the
one interesting status in the scenario stands out instead of drowning among repeated 200s.
Negative flows need no escape hatch: they just name a different status.

**Composition, not inheritance.** `DeviceGateway` takes an `ApiClient` as a constructor
argument rather than extending it: a gateway _uses_ a transport, it is not one, and one
client instance can back several gateways. The UI side keeps inheritance where the
relationship really is "is-a" — page objects extend `BasePage` because they are pages.

**Body parsing is defensive about content type.** The response body is read as text and
parsed as JSON opportunistically. The target is a free public service; on a 429/503 it can
return an HTML error page from a proxy, and `response.json()` would then throw a bare
`SyntaxError`, destroying both the status information and the log trail.

**Cleanup.** The collection is a shared public dataset, so the fixture calls
`deviceActions.cleanup()` in teardown, deleting any device the client created that never
reached `decommissioned`. Without it a failure between provision and decommission would
leak an object into a dataset other people are using. Errors during cleanup are swallowed —
teardown must not turn a reported failure into a different, misleading one.

**One test, not six.** The lifecycle steps share the generated device id and are strictly
ordered, so they are one test. Granularity in the report comes from the runner, which emits
one step per business operation.

**The rejected transition leaves no failed step.** The guard runs before
`performAction` is called, so the deliberately invalid decommission attempt never opens a
reporter step — the report stays clean rather than showing a red step inside a passing test.

## With more time

- A `flows/` layer for multi-step business scenarios, keeping specs to intent only.
- Attach request/response bodies to the Playwright report via `testInfo.attach()` on every
  call, instead of only surfacing them inside error messages.
- Property-based coverage of the transition table (every disallowed pair rejects) rather
  than the single invalid transition the task asks for.
