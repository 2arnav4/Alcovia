import { Pressable, Text, View } from "react-native";

interface SwitchControlProps {
  enabled: boolean;
  offLabel?: string;
  onLabel?: string;
  onToggle: () => void;
  showLabel?: boolean;
}

export function SwitchControl({
  enabled,
  offLabel = "Offline",
  onLabel = "Online",
  onToggle,
  showLabel = true
}: SwitchControlProps) {
  return (
    <Pressable className="flex-row items-center gap-2" onPress={onToggle}>
      <View
        className={`h-7 w-14 rounded-full p-1 ${
          enabled ? "bg-mint" : "bg-white/35"
        }`}
      >
        <View
          className="h-5 w-5 rounded-full bg-white shadow-sm"
          style={{ marginLeft: enabled ? 28 : 0 }}
        />
      </View>
      {showLabel ? (
        <Text className={`text-xs font-bold ${enabled ? "text-white" : "text-white/80"}`}>
          {enabled ? onLabel : offLabel}
        </Text>
      ) : null}
    </Pressable>
  );
}
