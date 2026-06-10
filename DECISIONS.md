# Decisions

## Important Functionalities with Code

`sessionTiming.ts` inside features file contains the 5 sec rule code.

The focus file inside components contains the focus code where the timer is calculated using `Date.now()` instead of subtracting a single second every time so that there are no issues with time delay as browsers or devices may add delay when the app is in background for under 5 secs.

`FocusSessionPanel.tsx` contains the code for starting a session and giving up. When Give Up is clicked it now creates `failedAtIso`, stores the failure locally with `give_up`, and queues all the values which Express needs later. The missing values in this file were the reason for the TypeScript error.

`FocusSessionLifecycle.tsx` checks whether the student is still on the Focus page and whether the app is active. It completes the session when the calculated remaining time reaches zero. It fails the session with `app_switch` when the student stays away for five seconds.

`operationTemplates.ts` contains the code which makes the offline operations. TypeScript was already checking the required fields while writing the frontend code. Runtime checks are also added now for ids, dates, sequence number and the 25 to 120 minute range so a bad operation is not added to the queue.

`DeviceSyncPanel.tsx` loads the saved phone and laptop state using AsyncStorage. Loading AsyncStorage is async, so it now shows `Loading saved state...` instead of showing that no state exists before loading has finished.

The conflict demo preferred `math-algebra-word` because it gave one fixed task for the video. The problem was that the same task could already be deleted. It now checks that the task exists and is active. If it does not exist, it uses another active task. If no task exists, the conflict buttons stay disabled.

`api.ts` now stops a sync request after 10 seconds using `AbortController`. A sync timeout is listed as an optional extension in the assignment, not a core requirement, but this stops the UI from waiting forever if the network drops during a request. The operations stay stored locally and can be tried again.

The Express sync route now checks that every operation has the same `deviceId` as the device making that sync request. It also validates the payload required by each operation type. This was not written as a separate assignment rule, but it stops one device request from pretending to contain another device's local operation.

The operation queue and server validation do different jobs. The frontend validation prevents the app from creating a bad operation. The server validation is still required because HTTP request data cannot be trusted just because the frontend is written in TypeScript.

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

## Focus timer

- `sessionTiming.ts` inside features file contains the 5 sec rule code.
- The focus file inside components contains the focus code where the timer is calculated using `Date.now()` instead of subtracting a single second every time. We chose this because browsers or devices may add a delay when the app is in the background for under 5 seconds. When the app comes back, the timer is calculated again from the original start time, so the delay does not make the timer incorrect.
- The backend also checks the start time, completion time and target duration before giving coins or increasing the streak. This means an early completion message cannot receive a reward.
- Today's focus minutes are stored with `todayFocusDate`. The client resets the number when it loads on a new UTC date. Express also resets it before returning state or handling sync. A session completed on an older date still gets its coins and streak reward, but it is not added to today's total.

## Syllabus progress

- Chapter progress is completed tasks divided by the total active tasks in that chapter.
- For subject progress, we chose completed tasks across all chapters divided by all active tasks in the subject. We chose this because a chapter with one task should not have the same weight as a chapter with ten tasks.
- A fallback was to calculate every chapter percentage first and then take their average. That approach is simpler, but it can give a misleading subject percentage when chapters have different numbers of tasks.

## Why we did not use last write wins

- We did not use the device time to decide which edit is newer because phone and laptop clocks can be different.
- We use rules where the result stays the same even if operations reach Express in a different order.
- For task status, the higher progress wins. `done` beats `in_progress`, and `in_progress` beats `not_started`.
- For delete against edit, delete wins. We keep `deleted: true` as a tombstone so an old edit arriving later cannot bring the task back.
- For the same sync message coming twice, Express checks the stable `operationId` and applies it only once.
- A fallback could be a server-issued version for every task. That gives more editing options but it also needs more server round trips and is harder to use fully offline.

## Feature A - focus session decisions

- Starting, completing and failing a session are separate sync operations. They are stored on the device first, so all three actions work while offline.
- `sessionTiming.ts` inside features file contains the 5 sec rule code.
- The focus file inside components contains the focus code where the timer is calculated using `Date.now()` instead of subtracting a single second every time. This avoids timer delay when the browser or device pauses an interval for a short time.
- When the app becomes inactive, we store the time it became inactive. When it becomes active again, the difference is checked. More than five seconds fails the running session with `app_switch`.
- Give Up fails the session with `give_up`. A failed session is still kept in the history but gets no coins, streak or focus minutes.
- Express checks `startedAtIso`, `completedAtIso` and the target duration before accepting a successful completion. It also checks that the device, start time and target match the start operation already stored by Express. A client cannot send only a fake completion or finish a 25 minute session early and still get the reward.
- If completion reaches Express before start, the completion stays in the operation log. When the matching start arrives, Express checks the saved timestamps and applies the completion. This handles messages arriving out of order without trusting the completion alone.
- The stable `sessionId` is the reward key. Express keeps rewarded session ids on disk, so replaying a completion before or after a server restart does not add the reward again.
- A successful session cannot be changed back to running or failed by an older operation arriving later.
- If valid success and failure messages for one session arrive out of order, valid success is the final state because it proves the full target was reached. The reward still uses `sessionId`, so it is added once.
- A fallback for stricter timing on native devices would be to also use a monotonic native clock. For this assignment, persisted timestamps plus server validation are enough and work on web and Expo.

## Feature B - syllabus decisions

- Changing a task status updates Redux immediately and then queues a sync operation. The student sees the new chapter and subject progress without waiting for the internet.
- Task status conflicts use progress rank instead of device time. This makes phone Done plus laptop In progress become Done in both arrival orders.
- A deleted task stays in synced data as a tombstone but is hidden from the normal syllabus screen and left out of progress calculations.
- The Sync Lab has controls for In progress, Done, delete and replay on the same task. These are there so every conflict rule can be shown without manually changing stored data.
- The client replaces its syllabus with the merged server syllabus after sync. This is how phone and laptop end with the same result.

## Server storage and restart

- Express stores the merged state, processed operation ids, rewarded session ids, operation log and notification logs in `server/data/server-state.json`.
- Automation delivery attempts are stored separately in `server/data/automation-state.json`.
- Files are first written to a temporary file and then renamed. This avoids leaving half-written JSON if the process stops during a write.
- Each accepted operation is saved after it is applied. Restarting Express does not forget deduplication or rewards.
- A production fallback would be SQLite or Postgres with unique constraints on `operationId`, `sessionId` and `eventId`. JSON is enough here and keeps the assignment easy to run.

## Sync when connection returns

- The online/offline switch controls the app network mode used by the prototype.
- When a device is changed from offline to online, it starts sync automatically. The Sync Now button is still there for the dev panel and retry testing.
- Phone and laptop use separate AsyncStorage namespaces, so their offline queues and local state behave like two different devices even in one browser.

## n8n notification decision

- Express creates one automation event using `focus-success:<sessionId>` and keeps its delivery status on disk.
- Failed or unconfigured deliveries remain retryable. A later sync tries them again.
- Two sync requests can finish at almost the same time. Express now shares one active automation flush between those requests. This stops one Express process from posting the same pending event to n8n twice at the same time.
- n8n checks whether a session was already delivered, but it does not mark it delivered before the HTTP notification sink succeeds.
- After the sink succeeds, n8n stores the session id as delivered. The Express sink also deduplicates by `sessionId`, so a lost HTTP response and retry still creates one notification.
- The sink now rejects a request without `sessionId` or `message`. Without a session id it cannot apply the exactly-once rule.
- For n8n Cloud, localhost cannot be used for the notification sink. `NOTIFICATION_SINK_URL` contains the public Express sink URL. Express adds it to the event and the workflow reads `{{$json.notificationSinkUrl}}`.
- The Sync Lab shows the automation status and attempt count so the exactly-once behavior can be demonstrated.
- A production fallback would be a database outbox and a worker. The current persisted outbox follows the same basic idea without adding another service.
- If Express was deployed as more than one server process, the in-process flush lock would not be enough. The production fallback would use a database row lock or a queue worker. This assignment runs one Express process with JSON storage.

## Requirement check

### Feature A - focus sessions

- The student can choose 25, 45, 60, 90 or 120 minutes and start the timer.
- Start is saved locally and queued before any network request is needed.
- Reaching the target completes the session automatically.
- Give Up records `give_up` and leaving the Focus page or backgrounding for five seconds records `app_switch`.
- Success adds 50 coins, one streak step and the target minutes to today's total. Failure adds no reward.
- Successful and failed attempts are kept in the local history and later sent to Express.
- Express checks the saved start before accepting success and gives one reward for each stable `sessionId`.
- Status: built and tested.

### Feature B - syllabus progress

- The app has subjects, chapters and tasks with Not started, In progress and Done states.
- A status change updates Redux and progress immediately, even while the device is offline.
- Chapter progress is done active tasks divided by all active tasks in that chapter.
- Subject progress is done active tasks divided by all active tasks across its chapters.
- Phone Done and laptop In progress becomes Done. Delete against edit stays deleted.
- Status: built and tested.

### Feature C - n8n automation

- Express creates the automation event only after it accepts a valid successful session.
- The event uses the stable session id and is saved in the server automation outbox.
- Express retries failed delivery and remembers delivered events after restart.
- The exported n8n workflow sends the event to the mock Express notification sink.
- n8n marks a session delivered only after the sink succeeds. The sink also stores one notification per session id.
- The workflow is in `n8n-workflow.json`. It still has to be imported and activated in the n8n instance used for the demo.
- Status: application code and exported workflow built. Express webhook, concurrent flush, retry and sink behavior tested. Final import, publishing and execution in the user's n8n Cloud workspace is manual environment setup because it needs the user's Cloud account and public backend URL.

### Two devices and dev panel

- Phone and laptop have separate AsyncStorage keys, local state and operation queues.
- Both can be changed while offline and each device syncs its own queued operations later.
- The server returns one canonical state and every syncing client replaces its local canonical data with it.
- The Sync Lab can create status conflicts, deletion conflicts and exact duplicate operation replays.
- The Sync Lab shows phone and laptop coins, streak, today's minutes and queued operation count together.
- Automation status and attempt count are also visible after sync.
- Status: built and tested.

## Constraint check

- TypeScript is used in the Expo frontend and Express backend.
- The frontend is React Native with Expo Router.
- The backend is Express.
- AsyncStorage is used on device and JSON files are used on the server.
- The n8n workflow is genuine and exported as JSON.
- The notification target is the allowed mock HTTP sink instead of WhatsApp.
- There is no login. Both devices use the hardcoded `student_1` account.
- The UI stays functional and the assignment behavior is available through normal pages and the Sync Lab.
- No Firebase sync, Replicache, PowerSync, Yjs or another sync product is used. The operation queue, merge rules, tombstones and deduplication are written in this repository.
- Web device storage is separated using `alcovia:v1:phone:redux-state` and `alcovia:v1:laptop:redux-state`.
- Choices that were not fixed by the assignment, including five seconds, 50 coins, progress rank and JSON storage, are written in this file and the README.

## Testing done

- Frontend TypeScript check passed.
- Express TypeScript check passed.
- Invalid sync requests return 400.
- A valid 25 minute session rewards once.
- Early completion, completion without a stored start and mismatched timestamps do not reward.
- Completion arriving before start is applied after its matching start arrives.
- A successful session is not downgraded by an older running or failed message.
- Duplicate operations do not change rewards or server version twice.
- Reward and operation deduplication still work after restarting Express with the same JSON data.
- Done versus In progress gives Done in either arrival order.
- Delete versus edit keeps the tombstone.
- A failed automation delivery is retried and can later become delivered.
- Duplicate notification sink calls create one notification.
- Concurrent sync requests create one automation attempt for the same event.
- A session completed on an older UTC date is not added to today's focus total.
- The mobile Sync Lab was checked at a 390 by 844 viewport and the conflict controls worked without console errors.

## What is still outside the code

- Express needs a public HTTPS URL so n8n Cloud can call `/api/notifications/sink`. A deployed backend or a temporary tunnel can be used.
- `n8n-workflow.json` must be imported and published in the user's n8n Cloud workspace.
- The production webhook URL must be put in `server/.env` as `N8N_WEBHOOK_URL`.
- The public sink URL must be put in `server/.env` as `NOTIFICATION_SINK_URL`.
- The public backend base URL must be put in the root `.env` as `EXPO_PUBLIC_API_BASE_URL`.
- The five minute demo video still has to be recorded.

These are deployment and submission steps. No core Feature A, Feature B, sync conflict or Express API code is left unfinished after this pass.

## Optional extensions not built

- Two-way n8n actions back into the app
- Starting the automation from n8n instead of Express
- Three or more device profiles in the dev panel
- Delta sync instead of returning the full canonical state
- Automated fuzz testing with random operation order
- A real WhatsApp provider instead of the allowed mock HTTP sink

The assignment labels these as optional extensions, so they are not required for the core submission.
