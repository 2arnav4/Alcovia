import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Card } from "@/components/ui/Card";
import {
  createFocusSessionCompletedOperation,
  createFocusSessionFailedOperation,
  createFocusSessionStartedOperation
} from "@/features/sync/operationTemplates";
import { AppDispatch, RootState } from "@/store";
import {
  completeDemoSession,
  failSessionPlaceholder,
  setSelectedDuration,
  startSessionPlaceholder
} from "@/store/slices/focusSlice";
import { enqueueOperation } from "@/store/slices/syncSlice";
import { FocusFailureReason, FocusSession } from "@/types";
import { createLocalId } from "@/utils/ids";

const DURATIONS = [25, 45, 60];

export function FocusSessionPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const selectedDeviceId = useSelector((state: RootState) => state.app.selectedDeviceId);
  const studentId = useSelector((state: RootState) => state.app.studentId);
  const nextLocalSequence = useSelector(
    (state: RootState) => state.sync.pendingOperations.length + 1
  );
  const { currentSession, focusSessions, selectedDuration } = useSelector(
    (state: RootState) => state.focus
  );

  function startSession() {
    const session: FocusSession = {
      sessionId: createLocalId("session", selectedDeviceId),
      deviceId: selectedDeviceId,
      targetMinutes: selectedDuration,
      status: "running",
      startedAtIso: new Date().toISOString()
    };

    dispatch(startSessionPlaceholder(session));
    dispatch(
      enqueueOperation(
        createFocusSessionStartedOperation({
          deviceId: selectedDeviceId,
          localSequence: nextLocalSequence,
          session,
          studentId
        })
      )
    );
  }

  function completeSession() {
    if (!currentSession) {
      return;
    }

    dispatch(completeDemoSession());
    dispatch(
      enqueueOperation(
        createFocusSessionCompletedOperation({
          deviceId: selectedDeviceId,
          localSequence: nextLocalSequence,
          sessionId: currentSession.sessionId,
          studentId,
          targetMinutes: currentSession.targetMinutes
        })
      )
    );
  }

  function failSession(reason: FocusFailureReason) {
    if (!currentSession) {
      return;
    }

    dispatch(failSessionPlaceholder(reason));
    dispatch(
      enqueueOperation(
        createFocusSessionFailedOperation({
          deviceId: selectedDeviceId,
          localSequence: nextLocalSequence,
          reason,
          sessionId: currentSession.sessionId,
          studentId
        })
      )
    );
  }

  return (
    <View className="gap-4">
      <LinearGradient
        colors={["#7357f5", "#4b2fc9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 20 }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-bold uppercase text-white/70">Deep work</Text>
            <Text className="mt-1 text-3xl font-bold text-white">
              {currentSession ? `${currentSession.targetMinutes}:00` : `${selectedDuration}:00`}
            </Text>
            <Text className="mt-1 text-sm font-semibold text-white/80">
              {currentSession ? "Session running" : "Choose a focus block"}
            </Text>
          </View>
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-white/20">
            <Ionicons color="#ffffff" name="timer" size={40} />
          </View>
        </View>
      </LinearGradient>

      <Card title="Session length">
        <View className="flex-row gap-2">
          {DURATIONS.map((duration) => (
            <Pressable
              key={duration}
              className={`flex-1 rounded-2xl px-3 py-4 ${
                selectedDuration === duration ? "bg-violet" : "bg-violetSoft"
              }`}
              onPress={() => dispatch(setSelectedDuration(duration))}
            >
              <Text
                className={`text-center text-base font-bold ${
                  selectedDuration === duration ? "text-white" : "text-ink"
                }`}
              >
                {duration} min
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card title="Controls">
        <View className="gap-3">
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-violetDeep px-4 py-4"
            onPress={startSession}
          >
            <Ionicons color="#ffffff" name="play" size={18} />
            <Text className="font-bold text-white">Start Session</Text>
          </Pressable>
          <View className="flex-row gap-3">
            <Pressable
              className="flex-1 rounded-2xl bg-coral px-4 py-4"
              onPress={() => failSession("give_up")}
            >
              <Text className="text-center font-bold text-orange-950">Give Up</Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-2xl bg-mint px-4 py-4"
              onPress={completeSession}
            >
              <Text className="text-center font-bold text-green-950">Complete</Text>
            </Pressable>
          </View>
        </View>
      </Card>

      <Card title="Activity">
        <View className="gap-3">
          <View className="rounded-2xl bg-[#faf9ff] p-3">
            <Text className="font-bold text-ink">Current session</Text>
            <Text className="mt-1 text-sm text-muted">
              {currentSession
                ? `${currentSession.targetMinutes} minute focus block in progress`
                : "No active focus block right now."}
            </Text>
          </View>
          {focusSessions.length === 0 ? (
            <View className="rounded-2xl bg-[#faf9ff] p-3">
              <Text className="font-bold text-ink">No attempts yet</Text>
              <Text className="mt-1 text-sm text-muted">Completed and abandoned sessions will appear here.</Text>
            </View>
          ) : (
            focusSessions.slice(0, 5).map((session) => (
              <View key={session.sessionId} className="flex-row items-center gap-3 rounded-2xl bg-[#faf9ff] p-3">
                <View
                  className={`h-9 w-9 items-center justify-center rounded-2xl ${
                    session.status === "success" ? "bg-mint" : "bg-coral"
                  }`}
                >
                  <Ionicons
                    color={session.status === "success" ? "#14965f" : "#9a3412"}
                    name={session.status === "success" ? "checkmark" : "close"}
                    size={18}
                  />
                </View>
                <View>
                  <Text className="font-bold capitalize text-ink">{session.status}</Text>
                  <Text className="text-sm text-muted">{session.targetMinutes} minute block</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </Card>
    </View>
  );
}
