# Alcovia Offline Study

Offline-first EdTech prototype for the Alcovia Full Stack Engineering Intern assignment.

This pass builds the project structure, app shell, Redux state, per-device local persistence, operation templates, and Express backend skeleton. The full timer, sync merge engine, and n8n workflow are intentionally left as focused next-phase implementation work.

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

The Expo app runs at `http://localhost:8081` on web. The backend defaults to `http://localhost:4000`.

## Current Scope

- Single assignment account: `student_1`
- Real app navigation: Dashboard, Focus, Syllabus, Sync Lab, Notifications
- Sidebar on wider screens and bottom navigation on phone-sized screens
- Two demo devices: `phone` and `laptop`
- Per-device storage namespace: `alcovia:v1:<deviceId>:redux-state`
- Redux state persists separately for each selected device
- Dashboard with student details, study summary, syllabus snapshot, and sync readiness
- Local task status updates with derived chapter and subject progress
- Placeholder focus session handlers for start, give up, and complete demo session
- Placeholder SyncOperation records are queued for focus and syllabus actions
- Clean Sync Lab with device selector, online/offline toggle, sync button, reset, and readable pending operation list
- Express route skeletons for health, state, sync, and notifications

## Next Implementation Work

- Focus timer accuracy and app background failure handling
- Backend operation dedupe and merge logic
- Idempotent focus rewards by `sessionId`
- Idempotent notification trigger and exported `n8n-workflow.json`

## Template Files To Fill Next

- `src/features/focus/focusSessionTemplate.ts`
- `src/features/sync/operationTemplates.ts`
- `src/features/sync/conflictResolutionTemplate.ts`
- `src/features/sync/syncClientTemplate.ts`
- `src/features/automation/n8nNotificationTemplate.ts`
