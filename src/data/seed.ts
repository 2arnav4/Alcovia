import { StudentState, Subject } from "@/types";
import { getFocusDate } from "@/features/focus/focusDate";

export const initialStudentState: StudentState = {
  studentId: "student_1",
  coins: 120,
  streak: 3,
  lastStreakDate: null,
  todayFocusMinutes: 40,
  todayFocusDate: getFocusDate()
};

export const seedSubjects: Subject[] = [
  {
    id: "math",
    title: "Mathematics",
    chapters: [
      {
        id: "math-algebra",
        title: "Algebra",
        tasks: [
          { id: "math-algebra-linear", title: "Linear equations", status: "done" },
          { id: "math-algebra-quadratic", title: "Quadratic basics", status: "in_progress" },
          { id: "math-algebra-word", title: "Word problems", status: "not_started" }
        ]
      },
      {
        id: "math-geometry",
        title: "Geometry",
        tasks: [
          { id: "math-geometry-triangles", title: "Triangle properties", status: "done" },
          { id: "math-geometry-circles", title: "Circles", status: "not_started" }
        ]
      }
    ]
  },
  {
    id: "science",
    title: "Science",
    chapters: [
      {
        id: "science-physics",
        title: "Physics",
        tasks: [
          { id: "science-physics-motion", title: "Motion graphs", status: "in_progress" },
          { id: "science-physics-force", title: "Force and laws", status: "not_started" }
        ]
      },
      {
        id: "science-chemistry",
        title: "Chemistry",
        tasks: [
          { id: "science-chemistry-atoms", title: "Atoms and molecules", status: "done" },
          { id: "science-chemistry-reactions", title: "Chemical reactions", status: "not_started" }
        ]
      }
    ]
  },
  {
    id: "english",
    title: "English",
    chapters: [
      {
        id: "english-writing",
        title: "Writing",
        tasks: [
          { id: "english-writing-essay", title: "Essay outline", status: "done" },
          { id: "english-writing-edit", title: "Revise draft", status: "in_progress" }
        ]
      }
    ]
  }
];
