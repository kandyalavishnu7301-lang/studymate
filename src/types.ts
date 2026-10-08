export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  college: string;
  course: string;
  branch: string;
  yearOfStudy: string;
  graduationYear: string;
  targetCgpa: string;
  targetCareer: string;
  preferredLanguage: string;
  dailyStudyTargetMinutes: number;
  primaryGoal: string;
  completedOnboarding: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  code: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  color: string;
  examDate: string;
  progress: number;
  topics: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StudyTask {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  topic: string;
  startTime: string;
  endTime: string;
  date: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  priority: 'Low' | 'Medium' | 'High';
  estimatedMinutes: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  subjectId?: string;
  subjectName?: string;
  durationMinutes: number;
  sessionType: 'pomodoro' | 'short_break' | 'long_break' | 'custom';
  notes?: string;
  completedAt: string;
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  subjectId?: string;
  subjectName?: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  topic: string;
}

export interface Quiz {
  id: string;
  userId: string;
  subjectId?: string;
  subjectName?: string;
  title: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  weakTopics: string[];
  answers: {
    questionId: string;
    selectedOptionIndex: number;
    isCorrect: boolean;
  }[];
  timeSpentSeconds: number;
  completedAt: string;
}

export interface DSAProblem {
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  statement: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  hints: string[];
  solutionExplanation: string;
  timeComplexity: string;
  spaceComplexity: string;
  starterCode: {
    python: string;
    javascript: string;
    cpp: string;
    java: string;
  };
  testCases: {
    input: string;
    expected: string;
  }[];
  status?: 'Todo' | 'Attempted' | 'Solved';
}

export interface DSASubmission {
  id: string;
  userId: string;
  problemId: string;
  problemTitle: string;
  code: string;
  language: string;
  status: 'Accepted' | 'Wrong Answer' | 'Runtime Error';
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number;
  submittedAt: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  markAllocation?: number;
  codeSnippet?: string;
  model?: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  title: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  greeting: string;
  user: User;
  profile: StudentProfile | null;
  stats: {
    streak: number;
    todayMinutes: number;
    weeklyMinutes: number;
    weeklyTargetMinutes: number;
    weeklyGoalProgress: number;
    targetCgpa: string;
    dsaSolvedCount: number;
    totalDsaProblems: number;
    quizzesTaken: number;
    notesCount: number;
  };
  todayTasks: StudyTask[];
  subjects: Subject[];
  weakAreas: { topic: string; count: number }[];
  upcomingExams: {
    subjectId: string;
    subjectName: string;
    examDate: string;
    daysLeft: number;
    difficulty: string;
  }[];
  recentNotes: Note[];
  recentQuizzes: QuizAttempt[];
  recommendations: string[];
}

export interface ProgressAnalytics {
  dailyStudyData: { date: string; day: string; minutes: number }[];
  avgAccuracy: number;
  totalQuizzes: number;
  totalStudyMinutes: number;
  dsaSolvedCount: number;
  totalDsaProblems: number;
  dsaProgressByCategory: {
    category: string;
    solved: number;
    total: number;
    percentage: number;
  }[];
  strongSubjects: { id: string; name: string; accuracy: number; progress: number }[];
  weakSubjects: { id: string; name: string; accuracy: number; progress: number }[];
  completedTasksCount: number;
  totalTasksCount: number;
}
