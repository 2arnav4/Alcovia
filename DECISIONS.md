# Decisions

## Client Model

This repository starts with a deliberately simple offline-first app shape:

- One assignment student id: `student_1`
- Two device namespaces: `phone` and `laptop`
- A real navigation shell instead of one long debug page
- Redux Toolkit owns frontend state
- Each device namespace persists its own Redux slices locally
- Every offline-capable action creates a `SyncOperation` with a stable `operationId`
- Focus rewards are deduped by stable `sessionId`
- Notification delivery is deduped by stable `sessionId`
- Focus time is derived from `startedAtIso` and the target duration instead of decrementing stored counters
- Leaving the Focus route or backgrounding the app for more than five seconds records `app_switch`
- Successful focus sessions finish automatically when their target timestamp is reached

## Conflict Strategy

- Operation-based sync instead of blind wall-clock last-write-wins
- Backend applies each `operationId` once
- Task status conflicts use monotonic progress rank:
  - `not_started = 0`
  - `in_progress = 1`
  - `done = 2`
- Task delete conflicts use tombstones, with delete winning over edit
- Backend returns canonical merged state after sync
- Clients replace local canonical state with server state after successful sync

## Tradeoff

The client updates local state immediately for responsiveness and queues the same action as an operation. The backend applies each operation id once, returns canonical state, and the client replaces local canonical state after sync. This keeps offline actions fast while making the server the reconciliation point.
