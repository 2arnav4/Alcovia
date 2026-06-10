import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Card } from "@/components/ui/Card";
import {
  createFocusSessionFailedOperation,
  createFocusSessionStartedOperation
} from "@/features/sync/operationTemplates";
import {
  FOCUS_AWAY_GRACE_MS,
  formatTimer,
  getRemainingSeconds,
  getSessionProgress
} from "@/features/focus/sessionTiming";
import { AppDispatch, RootState } from "@/store";
import { failSession, setSelectedDuration, startSession } from "@/store/slices/focusSlice";
import { enqueueOperation } from "@/store/slices/syncSlice";
import { FocusSession } from "@/types";
import { createLocalId } from "@/utils/ids";

const DURATIONS = [25, 45, 60, 90, 120];

export function FocusSessionPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const selectedDeviceId = useSelector((state: RootState) => state.app.selectedDeviceId);
  const studentId = useSelector((state: RootState) => state.app.studentId);
  const pendingOperationCount = useSelector(
    (state: RootState) => state.sync.pendingOperations.length
  );
  const { currentSession, focusSessions, selectedDuration } = useSelector(
    (state: RootState) => state.focus
  );
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!currentSession) {
      setNow(Date.now());
      return;
    }

    const intervalId = setInterval(() => setNow(Date.now()), 250); //
    return () => clearInterval(intervalId);
  }, [currentSession]);

  const remainingSeconds = currentSession
    ? getRemainingSeconds(currentSession, now)
    : selectedDuration * 60;
  const progress = currentSession ? getSessionProgress(currentSession, now) : 0;

  function beginSession() {
    if (currentSession) {
      return;
    }

    const session: FocusSession = {
      sessionId: createLocalId("session", selectedDeviceId),
      deviceId: selectedDeviceId,
      targetMinutes: selectedDuration,
      status: "running",
      startedAtIso: new Date().toISOString()
    };

    dispatch(startSession(session));
    dispatch(
      enqueueOperation(
        createFocusSessionStartedOperation({       // Here we enqueue the start of the operation which when the user comes online will sync

          deviceId: selectedDeviceId,
          localSequence: pendingOperationCount + 1,
          session,
          studentId
        })
      )
    );
  }

  function giveUp() {
    if (!currentSession) {
      return;
    }

    const failedAtIso = new Date().toISOString();
    dispatch(failSession({ failedAtIso, reason: "give_up" }));
    dispatch(
      enqueueOperation(                         // Here we enqueue the failed operation which when the user comes online will sync
        createFocusSessionFailedOperation({
          deviceId: selectedDeviceId,
          failedAtIso,
          localSequence: pendingOperationCount + 1,
          reason: "give_up",
          sessionId: currentSession.sessionId,
          startedAtIso: currentSession.startedAtIso,
          studentId,
          targetMinutes: currentSession.targetMinutes
        })
      )
    );
  }

  return (
    <View className="gap-4">
      <LinearGradient
        colors={currentSession ? ["#7357f5", "#4b2fc9"] : ["#5f4bd8", "#4030aa"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 20 }}
      >
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text className="text-sm font-bold uppercase text-white/70">
              {currentSession ? "Focus in progress" : "Ready to focus"}
            </Text>
            <Text className="mt-1 text-5xl font-bold text-white">
              {formatTimer(remainingSeconds)}
            </Text>
            <Text className="mt-2 text-sm font-semibold leading-5 text-white/80">
              {currentSession
                ? "Success is recorded automatically when the timer reaches zero."
                : "Choose a duration and start when you are ready."}
            </Text>
          </View>
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-white/20">
            <Ionicons
              color="#ffffff"
              name={currentSession ? "hourglass" : "timer-outline"}
              size={38}
            />
          </View>
        </View>

        <View className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
          <View
            className="h-2 rounded-full bg-white"
            style={{ width: `${Math.max(2, progress * 100)}%` }}
          />
        </View>
        <View className="mt-2 flex-row justify-between">
          <Text className="text-xs font-semibold text-white/70">
            {currentSession ? `${Math.round(progress * 100)}% complete` : "Not started"}
          </Text>
          <Text className="text-xs font-semibold text-white/70">
            {currentSession?.targetMinutes ?? selectedDuration} minute target
          </Text>
        </View>
      </LinearGradient>

      <Card title="Session length">
        <View className="flex-row flex-wrap gap-2">
          {DURATIONS.map((duration) => {
            const selected = selectedDuration === duration;
            return (
              <Pressable
                key={duration}
                className={`min-w-[30%] flex-1 rounded-2xl px-3 py-3 ${
                  selected ? "bg-violet" : "bg-violetSoft"
                } ${currentSession ? "opacity-60" : "opacity-100"}`}
                disabled={Boolean(currentSession)}
                onPress={() => dispatch(setSelectedDuration(duration))}
              >
                <Text
                  className={`text-center text-sm font-bold ${
                    selected ? "text-white" : "text-ink"
                  }`}
                >
                  {duration} min
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card title={currentSession ? "Stay focused" : "Start a session"}>
        {currentSession ? (
          <View className="gap-3">
            <View className="flex-row items-start gap-3 rounded-2xl bg-violetSoft p-4">
              <Ionicons color="#4b2fc9" name="information-circle" size={22} />
              <Text className="flex-1 text-sm leading-5 text-ink">
                Keep this session open. Leaving or backgrounding the app for more than {FOCUS_AWAY_GRACE_MS / 1_000} seconds records an abandoned attempt.
              </Text>
            </View>
            <Pressable className="rounded-2xl bg-coral px-4 py-4" onPress={giveUp}>
              <Text className="text-center font-bold text-orange-950">Give Up Session</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-violetDeep px-4 py-4"
            onPress={beginSession}
          >
            <Ionicons color="#ffffff" name="play" size={18} />
            <Text className="font-bold text-white">Start {selectedDuration} Minute Session</Text>
          </Pressable>
        )}
      </Card>

      <Card title="Recent attempts">
        <View className="gap-3">
          {focusSessions.length === 0 ? (
            <View className="rounded-2xl bg-[#faf9ff] p-4">
              <Text className="font-bold text-ink">No attempts yet</Text>
              <Text className="mt-1 text-sm text-muted">
                Successful and abandoned sessions will appear here.
              </Text>
            </View>
          ) : (
            focusSessions.slice(0, 5).map((session) => {
              const successful = session.status === "success";
              return (
                <View
                  key={session.sessionId}
                  className="flex-row items-center gap-3 rounded-2xl bg-[#faf9ff] p-3"
                >
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-2xl ${
                      successful ? "bg-mint" : "bg-coral"
                    }`}
                  >
                    <Ionicons
                      color={successful ? "#14965f" : "#9a3412"}
                      name={successful ? "checkmark" : "close"}
                      size={18}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-ink">
                      {successful ? "Focus completed" : "Session abandoned"}
                    </Text>
                    <Text className="mt-1 text-sm text-muted">
                      {session.targetMinutes} minutes
                      {session.failureReason
                        ? ` · ${session.failureReason === "give_up" ? "gave up" : "left the app"}`
                        : ""}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </Card>
    </View>
  );
}
