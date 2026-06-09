import { PropsWithChildren } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { OperationList } from "@/components/sync/OperationList";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { AppDispatch, RootState } from "@/store";
import { resetFocusState } from "@/store/slices/focusSlice";
import { setIsOnline, setSelectedDeviceId } from "@/store/slices/appSlice";
import { resetNotificationState } from "@/store/slices/notificationSlice";
import { resetSyllabusState } from "@/store/slices/syllabusSlice";
import { resetSyncState, setSyncStatus } from "@/store/slices/syncSlice";
import { runSyncNow } from "@/store/thunks/syncThunks";
import { clearDeviceState } from "@/services/storage";
import { DeviceId } from "@/types";

const DEVICES: DeviceId[] = ["phone", "laptop"];

export function DeviceSyncPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const app = useSelector((state: RootState) => state.app);
  const focus = useSelector((state: RootState) => state.focus);
  const subjects = useSelector((state: RootState) => state.syllabus.subjects);
  const sync = useSelector((state: RootState) => state.sync);
  const isSyncing = sync.syncStatus === "syncing";

  function resetLocalState() {
    void clearDeviceState(app.selectedDeviceId);
    dispatch(resetFocusState());
    dispatch(resetSyllabusState());
    dispatch(resetSyncState());
    dispatch(resetNotificationState());
  }

  function toggleNetwork() {
    const nextOnlineState = !app.isOnline;
    dispatch(setIsOnline(nextOnlineState));
    dispatch(setSyncStatus(nextOnlineState ? "idle" : "offline"));
  }

  return (
    <View className="gap-4">
      <Card title="Sync Lab">
        <View className="flex-row items-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-3xl bg-violetSoft">
            <Ionicons color="#4b2fc9" name="swap-horizontal" size={28} />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-ink">Two-device practice mode</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">
              Switch between phone and laptop, go offline, make edits, and sync later.
            </Text>
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
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Text>
          </Pressable>
          <Pressable className="flex-1 rounded-2xl bg-coral px-4 py-4" onPress={resetLocalState}>
            <Text className="text-center font-bold text-orange-950">Reset Device</Text>
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
      </Card>

      <Section title="Pending changes">
        <OperationList operations={sync.pendingOperations} />
      </Section>

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

function formatSyncStatus(status: RootState["sync"]["syncStatus"]): string {
  const labels: Record<RootState["sync"]["syncStatus"], string> = {
    error: "Error",
    idle: "Ready",
    offline: "Offline",
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
