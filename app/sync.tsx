import { AppShell } from "@/components/layout/AppShell";
import { DeviceSyncPanel } from "@/components/sync/DeviceSyncPanel";

export default function SyncScreen() {
  return (
    <AppShell>
      <DeviceSyncPanel />
    </AppShell>
  );
}
