# Design notes & trade-offs

## Architecture

Layers are wired by composition, each one owning exactly one concern:

| Layer      | File                                  | Responsibility                                                                                                                       |
| ---------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Transport  | `src/core/api/api.client.ts`          | HTTP only: build URL, send, parse body, attach request/response to the report. Returns `{status, ok, body}` and never judges success. |
| Runner     | `src/core/api/api-action-runner.ts`   | Wraps a business operation in a reporter step and, when given an expected status, fails it with an `ApiActionError`.                  |
| Gateway    | `src/api/device.gateway.ts`           | Device endpoints (`/objects`, `/objects/{id}`) — URL and verb only. No state, no status codes, no rules.                              |
| Actions    | `src/api/device.actions.ts`           | Typed lifecycle operations (`provisionDevice`, `updateFirmware`, `decommissionDevice`), owns the state machine and the guard rail.    |
| Assertions | `src/assertions/device.assertions.ts` | Expectations about the payload — the device body, its firmware, and the refusal of an invalid transition.                             |
| Logging    | `src/core/logger/`                    | Report attachments (`PlaywrightLogger`), masked JSON formatting (`LogFormatter`), and prefixed reporter steps (`stepLogger`).         |

The fixture builds the chain (`ApiClient` → `DeviceGateway` + `ApiActionRunner` →
`DeviceActions`, all sharing one `PlaywrightLogger`) and injects only `DeviceActions` into
the test, so a spec has no way to reach the raw HTTP client and bypass the lifecycle rules.

API step reporting is centralised in the runner rather than a decorator on every action
method. That gives one place to extend with cross-cutting behaviour later, and lets step
titles be built from the actual arguments (`Update firmware of device <id> to v1.3.1`). The
UI side keeps the `@step` decorator, since page-object methods have no equivalent runner.

## Device lifecycle state machine

The target API has no state-machine validation of its own, so the client enforces it.
Before every state-changing operation, `DeviceActions` reads the device's **current state
from the server** and refuses the call if the transition is not allowed. The database is
the single source of truth: mirroring lifecycle state in memory would drift the moment
anything else touched the object, and the task explicitly frames the API as "the database".

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
- The rejection is attached to the report as `Rejected transition`, listing the current
  status, the attempted one and the transitions actually allowed from here — so a green run
  still shows _why_ the guard fired, not merely that it did.
- The test only ever operates on the id returned by its own `POST`; the pre-seeded demo
  objects (ids 1–13) are never referenced. A device that no longer exists fails earlier
  still, on the guard's own `GET` returning 404 rather than the expected 200.

The self-transition `active → active` is intentional. The task narrative lists
"firmware-updated" as a lifecycle stage, but the concrete steps only ever use the status
values `provisioned` and `active`, so a separate state would have been dead weight. Making
firmware update a one-shot operation instead would have been wrong in the other direction:
re-flashing a device in service is a normal thing to do.

Because the current status is read from the server, the `decommissioned` row of the table
is unreachable in practice — once the `DELETE` lands, the object is gone and a read returns
404. It is kept for completeness: `Record<DeviceStatus, DeviceStatus[]>` forces every state
to declare its transitions, so adding a status to the enum cannot compile until its row
exists.

## Reporting

`allure-playwright` is wired alongside the list and HTML reporters, with the three base URLs
published as `environmentInfo` so a report always says which environment produced it.

Every reporter step carries a domain prefix — `[API]`, `[UI]`, `[Assertion]`, `[Fixture]` —
produced by `stepLogger`, so a run reads as a narrative rather than a flat list:

```
[API] Provision device TX-100
[Assertion] Verify device <id> against submitted specs
[API] Check current state of device <id>
[Assertion] Client refuses an invalid lifecycle transition
[API] Update firmware of device <id> to v1.3.1
[Fixture] Clean up devices created by this test
```

Request and response bodies are attached to **every** call, not just failures, via
`test.info().attach()`. They pass through `LogFormatter`, which pretty-prints and
recursively masks `password` / `token` / `authorization` / `cookie`. The target API needs no
credentials, so nothing is masked in practice — but a logger that only learns to mask after
the first leak is a logger written too late.

## Trade-offs

**Payload shape.** The task's example payload is flat (`{model, sensor_type, firmware,
status}`), but `api.restful-api.dev` silently drops any top-level field other than `name`
and `data` — a flat POST comes back as `{"id": "...", "name": null, "data": null}`. The
gateway therefore wraps the hardware spec into `{name, data}`, and `name` is set to the
device model. Field names inside `data` are kept in the task's snake_case (`sensor_type`)
rather than normalised to camelCase, so the stored document matches the task verbatim.

**Where status codes are checked.** The transport layer never judges a response — it hands
back `{status, ok, body}`. Every action instead takes the status it expects as a parameter
defaulting to `200`, and the runner raises `ApiActionError` (carrying the response body)
when the actual status differs. The spec therefore states the expectation at the call site,
the way `supertest`'s `.expect(200)` or REST Assured's `.statusCode(200)` do: `getDevice(id)`
for the live device, `getDevice(id, NOT_FOUND)` for the decommissioned one. A default rather
than a bare optional matters — omitting the argument still validates `200`, so a silent 500
can never slip through unchecked, and the one interesting status in the scenario stands out
instead of drowning among repeated 200s. Negative flows need no escape hatch: they just name
a different status.

**The guard costs one extra request.** Reading the current state before each transition
means a `GET` that a memory-mirrored implementation would avoid. That is the price of the
database being the source of truth, and it buys a client that is correct for devices it did
not create and that cannot drift from reality.

**Composition, not inheritance.** `DeviceGateway` takes an `ApiClient` as a constructor
argument rather than extending it: a gateway _uses_ a transport, it is not one, and one
client instance can back several gateways. The UI side keeps inheritance where the
relationship really is "is-a" — page objects extend `BasePage` because they are pages.

**Body parsing is defensive about content type.** The response body is read as text and
parsed as JSON opportunistically. The target is a free public service; on a 429/503 it can
return an HTML error page from a proxy, and `response.json()` would then throw a bare
`SyntaxError`, destroying both the status information and the log trail.

**Cleanup.** The collection is a shared public dataset, so the fixture calls
`deviceActions.cleanup()` in teardown, deleting every device the client created that was not
already decommissioned. Without it a failure between provision and decommission would leak
an object into a dataset other people are using. Errors during cleanup are swallowed —
teardown must not turn a reported failure into a different, misleading one.

**One test, not six.** The lifecycle steps share the generated device id and are strictly
ordered, so they are one test. Granularity in the report comes from the runner, which emits
one step per business operation.

**The rejected transition leaves no failed step.** The guard's own state read is a normal
passing step; the refusal is thrown after it and outside any `performAction`, so the
deliberately invalid decommission attempt never opens a step that could be marked red. The
report shows a clean pass with the `Rejected transition` attachment as evidence.

## With more time

- A `flows/` layer for multi-step business scenarios, keeping specs to intent only.
- Property-based coverage of the transition table — assert that _every_ disallowed pair is
  rejected, rather than the single invalid transition the task asks for.
- Contract-level checks on the response shape (schema validation) in addition to the
  field-by-field comparisons the task specifies.
