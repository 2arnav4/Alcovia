import { PropsWithChildren, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { OperationList } from "@/components/sync/OperationList";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import {
  createTaskDeletedOperation,
  createTaskStatusChangedOperation
} from "@/features/sync/operationTemplates";
import { AppDispatch, RootState } from "@/store";
import { resetFocusState } from "@/store/slices/focusSlice";
import { setIsOnline, setSelectedDeviceId } from "@/store/slices/appSlice";
import { resetNotificationState } from "@/store/slices/notificationSlice";
import { deleteTask, resetSyllabusState, updateTaskStatus } from "@/store/slices/syllabusSlice";
import {
  enqueueOperation,
  resetSyncState,
  setLastSyncError,
  setSyncStatus
} from "@/store/slices/syncSlice";
import { runSyncNow } from "@/store/thunks/syncThunks";
import { cancelActiveSyncRequest, resetDemoServer } from "@/services/api";
import { clearAllDeviceStates } from "@/services/storage";
import { loadPersistedDeviceState } from "@/services/devicePersistence";
import { DeviceId } from "@/types";

const DEVICES: DeviceId[] = ["phone", "laptop", "tablet"];
const CONFLICT_TASK_ID = "math-algebra-word";

interface DeviceSnapshot {
  coins: number;
  focusMinutes: number;
  pendingOperations: number;
  streak: number;
}

export function DeviceSyncPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const app = useSelector((state: RootState) => state.app);
  const focus = useSelector((state: RootState) => state.focus);
  const subjects = useSelector((state: RootState) => state.syllabus.subjects);
  const sync = useSelector((state: RootState) => state.sync);
  const isSyncing = sync.syncStatus === "syncing";
  const [storedSnapshots, setStoredSnapshots] = useState<
    Partial<Record<DeviceId, DeviceSnapshot>>
  >({});
  const availableTasks = subjects
    .flatMap((subject) => subject.chapters)
    .flatMap((chapter) => chapter.tasks)
    .filter((task) => !task.deleted);
  const conflictTask =
    availableTasks.find((task) => task.id === CONFLICT_TASK_ID) ?? availableTasks[0];
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoadingSnapshots(true);

    Promise.all(
      DEVICES.filter((deviceId) => deviceId !== app.selectedDeviceId).map(async (deviceId) => {
        const savedState = await loadPersistedDeviceState(deviceId);
        return [
          deviceId,
          savedState
            ? {
                coins: savedState.focus.coins,
                focusMinutes: savedState.focus.todayFocusMinutes,
                pendingOperations: savedState.sync.pendingOperations.length,
                streak: savedState.focus.streak
              }
            : undefined
        ] as const;
      })
    ).then((entries) => {
      if (active) {
        setStoredSnapshots(Object.fromEntries(entries));
      }
    }).catch(() => {
      if (active) {
        setStoredSnapshots({});
      }
    }).finally(() => {
      if (active) {
        setIsLoadingSnapshots(false);
      }
    });

    return () => {
      active = false;
    };
  }, [app.selectedDeviceId, focus.coins, focus.streak, focus.todayFocusMinutes, sync.pendingOperations.length]);

  const currentSnapshot: DeviceSnapshot = {
    coins: focus.coins,
    focusMinutes: focus.todayFocusMinutes,
    pendingOperations: sync.pendingOperations.length,
    streak: focus.streak
  };

  async function resetDemoState() {
    setIsResetting(true);
    dispatch(setLastSyncError(null));

    try {
      await resetDemoServer();
      await clearAllDeviceStates();
      dispatch(resetFocusState());
      dispatch(resetSyllabusState());
      dispatch(resetSyncState());
      dispatch(resetNotificationState());
      setStoredSnapshots({});
    } catch {
      dispatch(setLastSyncError("Demo reset could not finish. No local data was cleared."));
    } finally {
      setIsResetting(false);
    }
  }

  function toggleNetwork() {
    const nextOnlineState = !app.isOnline;
    dispatch(setIsOnline(nextOnlineState));
    dispatch(setSyncStatus(nextOnlineState ? "idle" : "offline"));
    if (nextOnlineState) {
      void dispatch(runSyncNow());
    } else {
      cancelActiveSyncRequest();
    }
  }

  function queueConflictStatus(status: "in_progress" | "done") {
    if (!conflictTask) {
      return;
    }

    dispatch(updateTaskStatus({ taskId: conflictTask.id, status }));
    dispatch(
      enqueueOperation(
        createTaskStatusChangedOperation({
          deviceId: app.selectedDeviceId,
          localSequence: sync.pendingOperations.length + 1,
          status,
          studentId: app.studentId,
          taskId: conflictTask.id
        })
      )
    );
  }

  function queueConflictDelete() {
    if (!conflictTask) {
      return;
    }

    dispatch(deleteTask(conflictTask.id));
    dispatch(
      enqueueOperation(
        createTaskDeletedOperation({
          deviceId: app.selectedDeviceId,
          localSequence: sync.pendingOperations.length + 1,
          studentId: app.studentId,
          taskId: conflictTask.id
        })
      )
    );
  }

  function replayLastOperation() {
    const lastOperation = sync.pendingOperations.at(-1);
    if (lastOperation) {
      dispatch(enqueueOperation(lastOperation));
    }
  }

  return (
    <View className="gap-4">
      <Card title="Sync Lab">
        <View className="flex-row items-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-3xl bg-violetSoft">
            <Ionicons color="#4b2fc9" name="swap-horizontal" size={28} />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-ink">Device sync practice</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">
              Switch between phone and laptop, go offline, make edits, and sync later.
            </Text>
          </View>
        </View>
      </Card>

      <Card title="Conflict Demo">
        <View className="gap-3">
          <Text className="text-sm leading-5 text-muted">
            Use the task shown below on both devices while offline. Done beats In progress, delete
            beats an edit, and replaying the same operation is ignored by Express.
          </Text>
          <View className="rounded-2xl bg-[#faf9ff] p-3">
            <Text className="text-xs font-bold uppercase text-muted">
              {conflictTask?.title ?? "No active task"}
            </Text>
            <Text className="mt-1 font-bold capitalize text-ink">
              {conflictTask ? conflictTask.status.replaceAll("_", " ") : "Unavailable"}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            <DemoButton
              disabled={!conflictTask}
              label="Set In Progress"
              onPress={() => queueConflictStatus("in_progress")}
            />
            <DemoButton
              disabled={!conflictTask}
              label="Set Done"
              onPress={() => queueConflictStatus("done")}
            />
            <DemoButton
              disabled={!conflictTask}
              label="Delete Task"
              onPress={queueConflictDelete}
              tone="danger"
            />
            <DemoButton
              disabled={sync.pendingOperations.length === 0}
              label="Replay Last"
              onPress={replayLastOperation}
            />
          </View>
        </View>
      </Card>

      <Card title="Device Controls">
        <View className="gap-4">
          <View>
            <Text className="mb-2 text-sm font-bold text-ink">Choose device</Text>
            <View className="flex-row gap-2">
              {DEVICES.map((deviceId) => (
                <Pressable
                  key={deviceId}
                  className={`flex-1 rounded-2xl px-4 py-4 ${
                    app.selectedDeviceId === deviceId ? "bg-violet" : "bg-violetSoft"
                  }`}
                  onPress={() => dispatch(setSelectedDeviceId(deviceId))}
                >
                  <Text
                    className={`text-center font-bold ${
                      app.selectedDeviceId === deviceId ? "text-white" : "text-violetDeep"
                    }`}
                  >
                    {deviceId}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Toggle
            enabled={app.isOnline}
            enabledLabel="This device will try to sync."
            disabledLabel="This device stores changes locally."
            label="Network"
            onToggle={toggleNetwork}
          />

          <View className="flex-row flex-wrap gap-2">
            <Pressable
              className={`flex-1 rounded-2xl px-4 py-4 ${
                isSyncing ? "bg-lavender" : "bg-violetDeep"
              }`}
              disabled={isSyncing}
              onPress={() => void dispatch(runSyncNow())}
            >
              <Text className="text-center font-bold text-white">
                {isSyncing
                  ? "Syncing..."
                  : sync.syncStatus === "retry_needed"
                    ? "Retry Sync"
                    : "Sync Now"}
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 rounded-2xl px-4 py-4 ${
                isResetting ? "bg-lavender" : "bg-coral"
              }`}
              disabled={isResetting || isSyncing}
              onPress={() => void resetDemoState()}
            >
              <Text className="text-center font-bold text-orange-950">
                {isResetting ? "Resetting..." : "Reset Demo"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Card>

      <Card title="Current State">
        <View className="grid-cols-1 gap-3 md:grid md:grid-cols-3">
          <Summary label="Current device" value={app.selectedDeviceId} />
          <Summary label="Sync status" value={formatSyncStatus(sync.syncStatus)} />
          <Summary label="Server version" value={sync.lastKnownServerVersion.toString()} />
        </View>
        {sync.lastSyncError ? (
          <View className="mt-3 flex-row items-start gap-3 rounded-2xl bg-[#fff3e8] p-3">
            <Ionicons color="#b45309" name="cloud-offline-outline" size={20} />
            <Text className="flex-1 text-sm leading-5 text-orange-950">
              {sync.lastSyncError} Queued: {sync.pendingOperations.length}.
            </Text>
          </View>
        ) : null}
      </Card>

      <Card title="Both Devices">
        <View className="gap-3 md:flex-row">
          {DEVICES.map((deviceId) => (
            <DeviceStateSummary
              key={deviceId}
              deviceId={deviceId}
              selected={deviceId === app.selectedDeviceId}
              snapshot={
                deviceId === app.selectedDeviceId ? currentSnapshot : storedSnapshots[deviceId]
              }
              loading={deviceId !== app.selectedDeviceId && isLoadingSnapshots}
            />
          ))}
        </View>
      </Card>

      <Section title="Pending changes">
        <OperationList operations={sync.pendingOperations} />
      </Section>

      {sync.conflicts.length > 0 ? (
        <Section title="Resolved conflicts">
          <View className="gap-3">
            {sync.conflicts.map((conflict) => (
              <View key={conflict.conflictId} className="rounded-2xl bg-[#fff8e8] p-3">
                <Text className="font-bold text-ink">{conflict.message}</Text>
                <Text className="mt-1 text-sm leading-5 text-muted">
                  Resolution: {conflict.resolution}
                </Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      <Section title="This device">
        <View className="grid-cols-1 gap-3 md:grid md:grid-cols-3">
          <Summary label="Coins" value={focus.coins.toString()} />
          <Summary label="Focus streak" value={`${focus.streak} days`} />
          <Summary label="Subjects" value={subjects.length.toString()} />
        </View>
      </Section>

      <Section title="Server result">
        {sync.serverStatePreview ? (
          <View className="grid-cols-1 gap-3 md:grid md:grid-cols-2">
            <Summary
              label="Server version"
              value={String(sync.serverStatePreview.serverVersion ?? sync.lastKnownServerVersion)}
            />
            <Summary
              label="Notifications"
              value={String(sync.serverStatePreview.notifications ?? 0)}
            />
            <Summary
              label="Automation status"
              value={String(sync.serverStatePreview.automationStatus ?? "No event yet")}
            />
            <Summary
              label="Automation attempts"
              value={String(sync.serverStatePreview.automationAttempts ?? 0)}
            />
          </View>
        ) : (
          <Text className="text-sm leading-5 text-muted">
            Sync once to show the merged server result for this device.
          </Text>
        )}
      </Section>
    </View>
  );
}

function DeviceStateSummary({
  deviceId,
  loading,
  selected,
  snapshot
}: {
  deviceId: DeviceId;
  loading: boolean;
  selected: boolean;
  snapshot?: DeviceSnapshot;
}) {
  return (
    <View className={`flex-1 rounded-2xl p-4 ${selected ? "bg-violetSoft" : "bg-[#faf9ff]"}`}>
      <View className="flex-row items-center justify-between">
        <Text className="font-bold capitalize text-ink">{deviceId}</Text>
        <Text className="text-xs font-bold uppercase text-violetDeep">
          {selected ? "Selected" : "Stored"}
        </Text>
      </View>
      {loading ? (
        <Text className="mt-3 text-sm text-muted">Loading saved state...</Text>
      ) : snapshot ? (
        <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-2">
          <Text className="text-sm text-muted">Coins {snapshot.coins}</Text>
          <Text className="text-sm text-muted">Streak {snapshot.streak}</Text>
          <Text className="text-sm text-muted">Today {snapshot.focusMinutes} min</Text>
          <Text className="text-sm text-muted">Queued {snapshot.pendingOperations}</Text>
        </View>
      ) : (
        <Text className="mt-3 text-sm text-muted">No saved state yet</Text>
      )}
    </View>
  );
}

function DemoButton({
  disabled = false,
  label,
  onPress,
  tone = "normal"
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  tone?: "danger" | "normal";
}) {
  return (
    <Pressable
      className={`min-w-[46%] flex-1 rounded-2xl px-3 py-3 ${
        disabled ? "bg-lavender" : tone === "danger" ? "bg-coral" : "bg-violetSoft"
      }`}
      disabled={disabled}
      onPress={onPress}
    >
      <Text
        className={`text-center text-sm font-bold ${
          tone === "danger" ? "text-orange-950" : "text-violetDeep"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function formatSyncStatus(status: RootState["sync"]["syncStatus"]): string {
  const labels: Record<RootState["sync"]["syncStatus"], string> = {
    idle: "Ready",
    offline: "Offline",
    retry_needed: "Retry needed",
    synced: "Synced",
    syncing: "Syncing"
  };

  return labels[status];
}

function Section({ children, title }: PropsWithChildren<{ title: string }>) {
  return (
    <View className="rounded-3xl bg-white p-4 shadow-sm">
      <Text className="mb-3 text-lg font-bold text-ink">{title}</Text>
      {children}
    </View>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-3xl bg-[#faf9ff] p-4">
      <Text className="text-xs font-bold uppercase text-muted">{label}</Text>
      <Text className="mt-2 text-lg font-bold capitalize text-ink">{value}</Text>
    </View>
  );
}
