import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export function StudentSummaryCard() {
  const focus = useSelector((state: RootState) => state.focus);
  const pendingCount = useSelector((state: RootState) => state.sync.pendingOperations.length);

  const metrics: Array<{
    color: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: number | string;
  }> = [
    { color: "bg-lemon", icon: "star", label: "Coins", value: focus.coins },
    { color: "bg-violetSoft", icon: "flame", label: "Streak", value: `${focus.streak} days` },
    { color: "bg-mint", icon: "timer", label: "Focus", value: `${focus.todayFocusMinutes} min` },
    { color: "bg-skySoft", icon: "cloud-upload", label: "Queue", value: pendingCount }
  ];

  return (
    <View className="flex-row flex-wrap justify-between gap-y-3">
      {metrics.map((metric) => (
        <View
          key={metric.label}
          className="rounded-3xl bg-white p-3 shadow-sm"
          style={{ minHeight: 94, width: "48%" }}
        >
          <View className={`mb-2 h-8 w-8 items-center justify-center rounded-2xl ${metric.color}`}>
            <Ionicons color="#4b2fc9" name={metric.icon} size={18} />
          </View>
          <Text className="text-xs font-bold uppercase text-muted">{metric.label}</Text>
          <Text className="mt-1 text-xl font-bold text-ink">{metric.value}</Text>
        </View>
      ))}
    </View>
  );
}
