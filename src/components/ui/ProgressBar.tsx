import { View } from "react-native";

interface ProgressBarProps {
  value: number;
  colorClassName?: string;
}

export function ProgressBar({ colorClassName = "bg-violet", value }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <View className="h-2.5 overflow-hidden rounded-full bg-slate-100">
      <View className={`h-full rounded-full ${colorClassName}`} style={{ width: `${clampedValue}%` }} />
    </View>
  );
}
