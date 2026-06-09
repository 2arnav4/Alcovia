import { Text, View } from "react-native";

interface BadgeProps {
  label: string;
  tone?: "green" | "blue" | "clay" | "purple" | "light";
}

export function Badge({ label, tone = "blue" }: BadgeProps) {
  const toneClass = {
    blue: "bg-skySoft text-blue-900",
    clay: "bg-coral text-orange-950",
    green: "bg-mint text-green-950",
    light: "bg-white/20 text-white",
    purple: "bg-violetSoft text-violetDeep"
  }[tone];

  return (
    <View className={`rounded-full px-3 py-1.5 ${toneClass.split(" ")[0]}`}>
      <Text className={`text-xs font-semibold ${toneClass.split(" ")[1]}`}>{label}</Text>
    </View>
  );
}
