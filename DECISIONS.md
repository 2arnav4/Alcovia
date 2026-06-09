# Decisions

## Foundation Phase

This repository starts with a deliberately simple offline-first app shape:

- One assignment student id: `student_1`
- Two demonstrable device namespaces: `phone` and `laptop`
- A real navigation shell instead of one long debug page
- Redux Toolkit owns frontend state
- Each device namespace persists its own Redux slices locally
- Every future user action will become a `SyncOperation` with a stable `operationId`
- Focus rewards will be deduped by stable `sessionId`
- Notification delivery will be deduped by stable `sessionId` or event id

## Planned Conflict Strategy

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

For the foundation phase, local UI reducers still update the screen immediately, and the UI also queues placeholder operations. The next phase should make those operations the source of truth for sync/replay, but this keeps the app usable while leaving the hard logic isolated in template files.
