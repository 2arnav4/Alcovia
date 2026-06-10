# Alcovia Offline Study

Offline-first EdTech app for the Alcovia Full Stack Engineering Intern assignment.

This build includes the Expo app, Redux state, per-device local persistence, operation queue, frontend sync flow, Express backend, and an importable n8n workflow.

## Run

```bash
npm install
npm run web
```

In another terminal:

```bash
npm --prefix server install
npm run server
```

Copy the server environment example before starting Express:

```bash
cp server/.env.example server/.env
```

For local app testing, create a root `.env`:

```bash
cp .env.example .env
```

Use `http://localhost:4000` for `EXPO_PUBLIC_API_BASE_URL` while the app and backend are on the same computer. A physical phone needs the computer LAN address or a public backend URL.

## n8n Cloud Setup

The n8n Cloud workflow cannot call `localhost` on this computer. Express must be available through a public HTTPS URL before the full automation can be tested. A deployed backend is preferred; a temporary tunnel is also enough for the demo.

1. Import `n8n-workflow.json` into n8n Cloud.
2. Publish the workflow and copy its production webhook URL.
3. Put the production webhook in `server/.env` as `N8N_WEBHOOK_URL`.
4. Put the public Express sink URL in `server/.env` as `NOTIFICATION_SINK_URL=https://YOUR-PUBLIC-BACKEND/api/notifications/sink`.
5. Put the same public backend base URL in the root `.env` as `EXPO_PUBLIC_API_BASE_URL=https://YOUR-PUBLIC-BACKEND`.
6. Restart Express and Expo after changing the environment files.

The backend adds `notificationSinkUrl` to the automation event. The imported workflow reads that value in its HTTP Request node, so it does not depend on n8n host environment variables.

The Expo app runs at `http://localhost:8081` on web. The backend defaults to `http://localhost:4000`.

## Current Scope

- Single assignment account: `student_1`
- Real app navigation: Dashboard, Focus, Syllabus, Sync Lab, Notifications
- Sidebar on wider screens and bottom navigation on phone-sized screens
- Two device profiles: `phone` and `laptop`
- Per-device storage namespace: `alcovia:v1:<deviceId>:redux-state`
- Redux state persists separately for each selected device
- Dashboard with student details, study summary, syllabus snapshot, and sync readiness
- Local task status updates with derived chapter and subject progress
- Timestamp-based focus countdown with automatic success at zero
- Give Up and five-second app-switch/background failure handling
- SyncOperation records are queued for focus and syllabus actions
- Clean Sync Lab with device selector, online/offline toggle, sync button, reset, and readable pending operation list
- Express APIs for health, state, sync, and notifications
- Express-to-n8n focus-success webhook with a stable event and session id
- n8n session-id deduplication after confirmed notification delivery
- Mock notification sink at `POST /api/notifications/sink`

## Manual Setup Left

- Deploy or tunnel Express so n8n Cloud can reach the mock notification sink
- Import, publish and test `n8n-workflow.json` in the n8n Cloud workspace used for the demo
- Record the two-device walkthrough if a video submission is needed

## Constraint Choices

- Frontend: TypeScript with React Native and Expo Router
- Backend: TypeScript with Express
- On-device storage: AsyncStorage
- Server storage: JSON files written atomically inside `server/data`
- Account model: one hardcoded `student_1` shared by both device profiles
- Web device separation: `phone` and `laptop` use different AsyncStorage namespaces
- Sync model: custom operation queue and merge logic; no off-the-shelf sync product
- Task conflict rule: the highest progress rank wins and deletion tombstones win over edits
- Replay protection: Express deduplicates `operationId`, rewards by `sessionId`, and automation events by stable `eventId`
- Notification delivery: genuine n8n workflow calling a mock Express sink
- Focus grace period: five seconds before an app switch/background event fails the session
- Server state, processed operation ids, rewarded session ids and automation deliveries survive an Express restart
- Concurrent sync requests share one automation flush, so one Express process does not post the same pending event to n8n twice at the same time
- Today's focus total is stored with a UTC date and resets when that date changes

## Conflict Rules

- Task status uses progress rank: `done` beats `in_progress`, which beats `not_started`.
- Delete uses a tombstone and wins against an edit.
- Duplicate operations are ignored by stable `operationId`.
- A focus success is rewarded once by stable `sessionId`.
- A success cannot be downgraded by a late running or failed operation.
- A completion arriving before its start waits in the operation log and is checked after the matching start arrives.

## Testing

The Sync Lab can demonstrate phone/laptop divergence, status conflict, delete/edit conflict and duplicate replay. API checks should also cover invalid payloads, early focus completion, duplicate rewards, restart persistence and duplicate sink delivery. The exact manual walkthrough is in `DECISIONS.md`.

## Left Out and Next Steps

The core coding is complete. The remaining submission work is to give Express a public HTTPS URL, import and publish the workflow in n8n Cloud, put the resulting URLs in the two environment files, and record the demo video.

If this prototype was taken further, the JSON files would be replaced with a database and unique constraints, the automation outbox would run in one worker, and the mock sink could be replaced with a real WhatsApp provider. Delta sync, three or more devices, random-order fuzz tests and two-way n8n actions are optional assignment extensions and are not included here.

## Core Files

- `src/components/focus/FocusSessionLifecycle.tsx`
- `src/features/focus/sessionTiming.ts`
- `src/features/sync/operationTemplates.ts`
- `src/features/sync/conflictResolution.ts`
- `src/features/sync/syncClient.ts`
- `server/src/services/automationService.ts`
- `n8n-workflow.json`
