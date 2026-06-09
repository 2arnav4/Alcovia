import { PropsWithChildren } from "react";
import { Text, View } from "react-native";

interface CardProps extends PropsWithChildren {
  title?: string;
  action?: string;
}

export function Card({ action, children, title }: CardProps) {
  return (
    <View className="rounded-3xl bg-white p-4 shadow-sm">
      {title ? (
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-ink">{title}</Text>
          {action ? <Text className="text-sm font-semibold text-violet">{action}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}
