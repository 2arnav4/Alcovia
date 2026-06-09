import { AppShell } from "@/components/layout/AppShell";
import { SyllabusProgressPanel } from "@/components/syllabus/SyllabusProgressPanel";

export default function SyllabusScreen() {
  return (
    <AppShell>
      <SyllabusProgressPanel />
    </AppShell>
  );
}
