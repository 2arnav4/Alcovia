import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useSelector } from "react-redux";
import { Card } from "@/components/ui/Card";
import { RootState } from "@/store";

export function NotificationsPanel() {
  const logs = useSelector((state: RootState) => state.notifications.notificationLogs);

  return (
    <View className="gap-4">
      <Card title="Alerts">
        <View className="flex-row items-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-3xl bg-lemon">
            <Ionicons color="#4b2fc9" name="notifications" size={27} />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-ink">Focus rewards will show here</Text>
            <Text className="mt-1 text-sm text-muted">Server-confirmed focus completions are listed after sync.</Text>
          </View>
        </View>
      </Card>

      <Card title="Notification log">
        <View className="gap-3">
          {logs.length === 0 ? (
            <View className="rounded-3xl bg-[#faf9ff] p-4">
              <Text className="text-sm font-bold text-ink">No alerts yet</Text>
              <Text className="mt-1 text-xs text-muted">Complete a focus session and sync to create the first alert.</Text>
            </View>
          ) : (
            logs.map((log) => (
              <View key={log.id} className="flex-row gap-3 rounded-3xl bg-[#faf9ff] p-3">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-violetSoft">
                  <Ionicons color="#4b2fc9" name="megaphone" size={18} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-ink">{log.message}</Text>
                  <Text className="mt-1 text-xs text-muted">{log.createdAtIso}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </Card>
    </View>
  );
}
