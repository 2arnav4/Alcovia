import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { useSelector } from "react-redux";
import { StudentSummaryCard } from "@/components/dashboard/StudentSummaryCard";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RootState } from "@/store";
import { getSubjectProgress } from "@/utils/progress";

export function Dashboard() {
  const focus = useSelector((state: RootState) => state.focus);
  const subjects = useSelector((state: RootState) => state.syllabus.subjects);
  const pendingOperations = useSelector((state: RootState) => state.sync.pendingOperations.length);
  const nextSubject = subjects[0];
  const nextProgress = nextSubject ? getSubjectProgress(nextSubject) : 0;
  const secondSubject = subjects[1];
  const secondProgress = secondSubject ? getSubjectProgress(secondSubject) : 0;

  return (
    <View className="gap-4">
      <LinearGradient
        colors={["#ffffff", "#eee9ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 24, padding: 16 }}
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-sm font-bold uppercase text-violetDeep">This week's mission</Text>
            <Text className="mt-2 text-2xl font-bold text-ink">Finish Algebra and protect your streak</Text>
            <Text className="mt-2 text-sm leading-5 text-muted">
              Complete focus blocks and syllabus tasks even when the network drops.
            </Text>
          </View>
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-violet">
            <Ionicons color="#ffffff" name="school" size={38} />
          </View>
        </View>
        <View className="mt-4 flex-row gap-3">
          <Link href="/focus" asChild>
            <Text className="flex-1 rounded-2xl bg-violetDeep px-4 py-3 text-center font-bold text-white">
              Start Focus
            </Text>
          </Link>
          <Link href="/syllabus" asChild>
            <Text className="flex-1 rounded-2xl bg-white px-4 py-3 text-center font-bold text-violetDeep">
              View Tasks
            </Text>
          </Link>
        </View>
      </LinearGradient>

      <StudentSummaryCard />

      <View className="grid-cols-1 gap-4 lg:grid lg:grid-cols-2">
        <Card action="Open" title="Focus Plan">
          <View className="gap-4">
            <View className="flex-row items-center gap-3">
              <View className="h-16 w-16 items-center justify-center rounded-3xl bg-lemon">
                <Ionicons color="#4b2fc9" name="alarm" size={28} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-muted">Today</Text>
                <Text className="text-3xl font-bold text-ink">{focus.todayFocusMinutes} min</Text>
              </View>
            </View>
            <View className="rounded-2xl bg-violetSoft p-3">
              <Text className="text-sm font-semibold text-violetDeep">Suggested block</Text>
              <Text className="mt-1 text-base font-bold text-ink">25 minutes · Algebra revision</Text>
            </View>
            <Link href="/focus" asChild>
              <Text className="rounded-2xl bg-violet px-4 py-3 text-center font-bold text-white">
                Open Focus
              </Text>
            </Link>
          </View>
        </Card>

        <Card action="Details" title="Syllabus Map">
          {nextSubject ? (
            <View className="gap-4">
              <SubjectRow title={nextSubject.title} value={nextProgress} />
              {secondSubject ? <SubjectRow title={secondSubject.title} value={secondProgress} /> : null}
              <Link href="/syllabus" asChild>
                <Text className="rounded-2xl bg-mint px-4 py-3 text-center font-bold text-green-950">
                  Open Syllabus
                </Text>
              </Link>
            </View>
          ) : null}
        </Card>
      </View>

      <Card action="Sync Lab" title="Offline Status">
        <View className="gap-3">
          <StatusRow
            icon="cloud-offline"
            label="Offline changes waiting"
            value={`${pendingOperations} operations`}
          />
          <StatusRow icon="git-merge" label="Merge policy" value="Progress rank, delete tombstones" />
          <StatusRow icon="flash" label="Reward alert" value="Ready after focus success" />
        </View>
        <Link href="/sync" asChild>
          <Text className="mt-4 rounded-2xl bg-coral px-4 py-3 text-center font-bold text-orange-950">
            Open Sync Lab
          </Text>
        </Link>
      </Card>
    </View>
  );
}

function SubjectRow({ title, value }: { title: string; value: number }) {
  return (
    <View className="rounded-2xl bg-[#faf9ff] p-3">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="font-bold text-ink">{title}</Text>
        <Text className="font-bold text-violetDeep">{value}%</Text>
      </View>
      <ProgressBar value={value} />
    </View>
  );
}

function StatusRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-[#faf9ff] p-3">
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-violetSoft">
        <Ionicons color="#4b2fc9" name={icon} size={19} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-ink">{label}</Text>
        <Text className="text-xs font-semibold text-muted">{value}</Text>
      </View>
    </View>
  );
}
