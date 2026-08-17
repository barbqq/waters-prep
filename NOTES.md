# Design notes & trade-offs

## Architecture

Three layers, deliberately kept separate so that lifecycle rules have exactly one home:

| Layer     | File                         | Responsibility                                                                                                                     |
| --------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Transport | `src/core/api/api.client.ts` | HTTP only: build URL, send, parse body, log, verify expected status. Knows nothing about devices.                                  |
| Gateway   | `src/api/device.gateway.ts`  | Raw device endpoints (`/objects`, `/objects/{id}`). No state, no business rules.                                                   |
| Actions   | `src/api/device.actions.ts`  | Typed lifecycle operations (`provisionDevice`, `updateFirmware`, `decommissionDevice`), owns the state machine and the guard rail. |

`get/post/put/delete` on the transport layer are `protected`, so tests physically cannot
bypass the lifecycle rules with a raw HTTP call — the only entry points are the typed
methods on `DeviceActions`.

Assertions live in `src/assertions/device.assertions.ts` rather than inline in the spec, so
the test body reads as the lifecycle scenario from the task, one line per step.

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

**Client throws on unexpected status.** The transport layer takes the expected status code
and raises if it differs, embedding the recent request/response log in the message. This
keeps the happy path free of status assertions. Where a status code _is_ the thing under
test — the 404 after decommissioning — `getStatus()` returns the raw code instead and the
expectation lives in the assertions layer, where it belongs.

**Body parsing is defensive about content type.** The response body is read as text and
parsed as JSON opportunistically. The target is a free public service; on a 429/503 it can
return an HTML error page from a proxy, and `response.json()` would then throw a bare
`SyntaxError`, destroying both the status information and the log trail.

**Inheritance vs composition.** `DeviceGateway extends BaseApiClient` (it _is_ an API
client for one resource), while `DeviceActions` takes a gateway as a constructor argument
(it _uses_ one). The same rule is applied on the UI side: page objects extend `BasePage`
because they are pages, while behaviour that merely consumes them is composed in.

**Cleanup.** The collection is a shared public dataset, so the fixture calls
`deviceActions.cleanup()` in teardown, deleting any device the client created that never
reached `decommissioned`. Without it a failure between provision and decommission would
leak an object into a dataset other people are using. Errors during cleanup are swallowed —
teardown must not turn a reported failure into a different, misleading one.

**One test, not six.** The lifecycle steps share the generated device id and are strictly
ordered, so they are one test. Granularity in the report comes from the `@step` decorator on
the action methods instead, which yields a step per business operation.

## Reading the report

The HTML report shows a **failed step inside the passing lifecycle test**:
`Decommissioning device <id>`. This is expected. That is the deliberate invalid-transition
attempt — the action method is `@step`-decorated, and Playwright marks a step as failed
whenever its callback throws, regardless of the caller catching it. The test asserts that
this call is rejected, so the throw is the desired outcome.

## With more time

- A `flows/` layer for multi-step business scenarios, keeping specs to intent only.
- Attach request/response bodies to the Playwright report via `testInfo.attach()` on every
  call, instead of only surfacing them inside error messages.
- Property-based coverage of the transition table (every disallowed pair rejects) rather
  than the single invalid transition the task asks for.
