# Alcovia Offline Study

Offline-first EdTech app for the Alcovia Full Stack Engineering Intern assignment.

This build includes the app shell, Redux state, per-device local persistence, operation queue, frontend sync flow, and Express backend sync API.

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

## Remaining Work

- Idempotent notification trigger and exported `n8n-workflow.json`
- Recorded two-device convergence walkthrough

## Core Files

- `src/components/focus/FocusSessionLifecycle.tsx`
- `src/features/focus/sessionTiming.ts`
- `src/features/sync/operationTemplates.ts`
- `src/features/sync/conflictResolution.ts`
- `src/features/sync/syncClient.ts`
