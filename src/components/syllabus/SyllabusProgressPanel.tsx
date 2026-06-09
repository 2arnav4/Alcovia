import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { createTaskStatusChangedOperation } from "@/features/sync/operationTemplates";
import { AppDispatch, RootState } from "@/store";
import { updateTaskStatus } from "@/store/slices/syllabusSlice";
import { enqueueOperation } from "@/store/slices/syncSlice";
import { TaskStatus } from "@/types";
import { getChapterProgress, getSubjectProgress } from "@/utils/progress";

const STATUS_OPTIONS: Array<{ label: string; value: TaskStatus }> = [
  { label: "Not started", value: "not_started" },
  { label: "In progress", value: "in_progress" },
  { label: "Done", value: "done" }
];

export function SyllabusProgressPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedDeviceId, studentId } = useSelector((state: RootState) => state.app);
  const nextLocalSequence = useSelector(
    (state: RootState) => state.sync.pendingOperations.length + 1
  );
  const subjects = useSelector((state: RootState) => state.syllabus.subjects);

  function changeTaskStatus(taskId: string, status: TaskStatus) {
    dispatch(updateTaskStatus({ taskId, status }));
    dispatch(
      enqueueOperation(
        createTaskStatusChangedOperation({
          deviceId: selectedDeviceId,
          localSequence: nextLocalSequence,
          status,
          studentId,
          taskId
        })
      )
    );
  }

  return (
    <View className="gap-4">
      <Card action={`${subjects.length} subjects`} title="Learning Path">
        <Text className="text-sm leading-5 text-muted">
          Update task progress anytime. Changes stay on this device first and sync later.
        </Text>
      </Card>

      {subjects.map((subject, subjectIndex) => {
        const subjectProgress = getSubjectProgress(subject);
        const subjectColors = ["bg-violetSoft", "bg-mint", "bg-lemon"];

        return (
          <Card key={subject.id}>
            <View className="gap-4">
              <View className="flex-row items-center gap-3">
                <View
                  className={`h-14 w-14 items-center justify-center rounded-3xl ${
                    subjectColors[subjectIndex % subjectColors.length]
                  }`}
                >
                  <Ionicons color="#4b2fc9" name="book" size={26} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-bold text-ink">{subject.title}</Text>
                    <Text className="font-bold text-violetDeep">{subjectProgress}%</Text>
                  </View>
                  <View className="mt-2">
                    <ProgressBar value={subjectProgress} />
                  </View>
                </View>
              </View>

              {subject.chapters.map((chapter) => {
                const chapterProgress = getChapterProgress(chapter);

                return (
                  <View key={chapter.id} className="rounded-3xl bg-[#faf9ff] p-3">
                    <View className="mb-3 flex-row items-center justify-between">
                      <Text className="font-bold text-ink">{chapter.title}</Text>
                      <Text className="text-sm font-bold text-muted">{chapterProgress}%</Text>
                    </View>
                    <ProgressBar value={chapterProgress} colorClassName="bg-mintDark" />

                    <View className="mt-3 gap-2">
                      {chapter.tasks.map((task) => (
                        <View key={task.id} className="rounded-2xl bg-white p-3">
                          <Text className="font-semibold text-ink">{task.title}</Text>
                          <View className="mt-3 flex-row gap-2">
                            {STATUS_OPTIONS.map((option) => (
                              <Pressable
                                key={option.value}
                                className={`flex-1 rounded-2xl px-2 py-2 ${
                                  task.status === option.value ? "bg-violet" : "bg-violetSoft"
                                }`}
                                onPress={() => changeTaskStatus(task.id, option.value)}
                              >
                                <Text
                                  className={`text-center text-[11px] font-bold ${
                                    task.status === option.value ? "text-white" : "text-violetDeep"
                                  }`}
                                >
                                  {option.label}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        );
      })}
    </View>
  );
}
