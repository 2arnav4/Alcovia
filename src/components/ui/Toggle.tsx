import { Text, View } from "react-native";
import { SwitchControl } from "@/components/ui/SwitchControl";

interface ToggleProps {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  enabledLabel?: string;
  disabledLabel?: string;
}

export function Toggle({
  disabledLabel = "Off",
  enabled,
  enabledLabel = "On",
  label,
  onToggle
}: ToggleProps) {
  return (
    <View
      className="flex-row items-center justify-between rounded-2xl bg-violetSoft p-3"
    >
      <View>
        <Text className="font-semibold text-ink">{label}</Text>
        <Text className="text-sm text-muted">{enabled ? enabledLabel : disabledLabel}</Text>
      </View>
      <SwitchControl enabled={enabled} onToggle={onToggle} showLabel={false} />
    </View>
  );
}
