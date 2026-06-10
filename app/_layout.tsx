// @ts-ignore
import "../global.css";

import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { FocusSessionLifecycle } from "@/components/focus/FocusSessionLifecycle";
import { StatePersistenceGate } from "@/components/layout/StatePersistenceGate";
import { store } from "@/store";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <StatePersistenceGate>
        <FocusSessionLifecycle />
        <Stack screenOptions={{ headerShown: false }} />
      </StatePersistenceGate>
    </Provider>
  );
}
