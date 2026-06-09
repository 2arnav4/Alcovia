import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SyncOperation } from "@/types";

interface OperationListProps {
  operations: SyncOperation[];
}

export function OperationList({ operations }: OperationListProps) {
  if (operations.length === 0) {
    return (
      <View className="rounded-3xl bg-[#faf9ff] p-4">
        <View className="mb-3 h-11 w-11 items-center justify-center rounded-2xl bg-violetSoft">
          <Ionicons color="#4b2fc9" name="checkmark-done" size={21} />
        </View>
        <Text className="font-bold text-ink">All caught up</Text>
        <Text className="mt-1 text-sm text-muted">
          Offline edits will appear here before they are sent to the backend.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-2">
      {operations.slice(0, 5).map((operation) => (
        <View key={operation.operationId} className="flex-row items-center gap-3 rounded-3xl bg-[#faf9ff] p-3">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-violetSoft">
            <Ionicons color="#4b2fc9" name="cloud-upload" size={19} />
          </View>
          <View className="flex-1">
            <Text className="font-bold capitalize text-ink">{operation.type.replaceAll("_", " ")}</Text>
            <Text className="mt-1 text-xs font-semibold text-muted">
              {operation.deviceId} · step {operation.localSequence}
            </Text>
          </View>
        </View>
      ))}
      {operations.length > 5 ? (
        <Text className="text-sm text-muted">{operations.length - 5} more queued operations</Text>
      ) : null}
    </View>
  );
}
