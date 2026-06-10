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

Import `n8n-workflow.json` into n8n, activate it, and run n8n with the notification sink URL available:

```bash
ALCOVIA_NOTIFICATION_SINK_URL=http://host.docker.internal:4000/api/notifications/sink npx n8n
```

When n8n runs directly on the host instead of Docker, use `http://localhost:4000/api/notifications/sink` for `ALCOVIA_NOTIFICATION_SINK_URL`.

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

- Import and activate `n8n-workflow.json` in the n8n instance used for the demo
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

## Core Files

- `src/components/focus/FocusSessionLifecycle.tsx`
- `src/features/focus/sessionTiming.ts`
- `src/features/sync/operationTemplates.ts`
- `src/features/sync/conflictResolution.ts`
- `src/features/sync/syncClient.ts`
- `server/src/services/automationService.ts`
- `n8n-workflow.json`
