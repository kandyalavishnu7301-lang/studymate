import {
  User,
  StudentProfile,
  DashboardData,
  Subject,
  StudyTask,
  StudySession,
  Note,
  Quiz,
  QuizAttempt,
  DSAProblem,
  DSASubmission,
  AIConversation,
  AIMessage,
  ProgressAnalytics,
} from '../types';

const TOKEN_KEY = 'studymate_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `HTTP error ${response.status}`) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  return data as T;
}

export const api = {
  // Health
  checkHealth: () => request<{ status: string; geminiConfigured: boolean; model: string }>('/api/health'),

  // Auth
  register: (payload: any) =>
    request<{ token: string; user: User; profile: StudentProfile; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: User; profile: StudentProfile; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  googleLogin: (credential: string) =>
    request<{ token: string; user: User; profile: StudentProfile; message: string }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),
    
  demoLogin: () =>
    request<{ token: string; user: User; profile: StudentProfile; message: string }>('/api/auth/demo', {
      method: 'POST',
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Profile & Onboarding
  getProfile: () => request<{ user: User; profile: StudentProfile | null }>('/api/profile'),
  updateProfile: (data: Partial<StudentProfile> & { name?: string }) =>
    request<{ user: User; profile: StudentProfile }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  saveOnboarding: (data: { subjects: string[]; primaryGoal: string; dailyStudyTargetMinutes: number }) =>
    request<{ success: boolean; profile: StudentProfile }>('/api/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Dashboard
  getDashboard: () => request<DashboardData>('/api/dashboard'),

  // Subjects
  getSubjects: () => request<Subject[]>('/api/subjects'),
  createSubject: (subj: Partial<Subject>) =>
    request<Subject>('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(subj),
    }),
  updateSubject: (id: string, subj: Partial<Subject>) =>
    request<Subject>(`/api/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subj),
    }),
  deleteSubject: (id: string) =>
    request<{ success: boolean }>(`/api/subjects/${id}`, {
      method: 'DELETE',
    }),  exploreSubject: (subject: string) =>
    request<{
      subject: string;
      overview: string;
      topics: {
        name: string;
        description: string;
        difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
        searchQuery: string;
        videos: {
          videoId: string;
          title: string;
          description: string;
          channelTitle: string;
          thumbnail: string;
          url: string;
        }[];
      }[];
    }>('/api/subjects/explore', {
      method: 'POST',
      body: JSON.stringify({ subject }),
    }),

  getTasks: () => request<StudyTask[]>('/api/tasks'),
  createTask: (task: Partial<StudyTask>) =>
    request<StudyTask>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),
  updateTask: (id: string, task: Partial<StudyTask>) =>
    request<StudyTask>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    }),
  deleteTask: (id: string) =>
    request<{ success: boolean }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    }),
  generateAIStudyPlan: () =>
    request<{ scheduleSummary: string; tasks: StudyTask[] }>('/api/study-plan/generate', {
      method: 'POST',
    }),

  // Notes
  getNotes: () => request<Note[]>('/api/notes'),
  createNote: (note: Partial<Note>) =>
    request<Note>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    }),
  updateNote: (id: string, note: Partial<Note>) =>
    request<Note>(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(note),
    }),
  deleteNote: (id: string) =>
    request<{ success: boolean }>(`/api/notes/${id}`, {
      method: 'DELETE',
    }),
  explainNote: (id: string, action: 'simplify' | 'summarize' | 'exam_tips') =>
    request<{ explanation: string }>(`/api/notes/${id}/explain`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
  analyzeNotesUpload: async (file: File) => {
    const token = getStoredToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/notes/analyze-upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data as {
      filename: string;
      analysis: string;
      extractedCharacters: number;
      truncated: boolean;
    };
  },

  // AI Tutor & Conversations
  getConversations: () => request<AIConversation[]>('/api/conversations'),
  getConversation: (id: string) => request<AIConversation>(`/api/conversations/${id}`),
  createConversation: (title: string) =>
    request<AIConversation>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  deleteConversation: (id: string) =>
    request<{ success: boolean }>(`/api/conversations/${id}`, {
      method: 'DELETE',
    }),
  sendMessage: (payload: { conversationId?: string; message: string; markAllocation?: number }) =>
    request<{ conversationId: string; message: AIMessage; usedGemini: boolean; model?: string }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  liveDemoChat: (payload: { message: string; history?: { role: 'user' | 'assistant'; content: string }[]; markAllocation?: number }) =>
    request<{ reply: string; usedGemini: boolean; model?: string }>('/api/ai/live-demo', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Quizzes
  getQuizzes: () => request<Quiz[]>('/api/quizzes'),
  getQuiz: (id: string) => request<Quiz>(`/api/quizzes/${id}`),
  generateQuiz: (payload: { subject: string; topic: string; difficulty: string; count: number }) =>
    request<Quiz>('/api/quiz/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submitQuiz: (payload: { quizId: string; answers: { questionId: string; selectedOptionIndex: number }[]; timeSpentSeconds: number }) =>
    request<{ attempt: QuizAttempt; quiz: Quiz; message: string }>('/api/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getQuizAttempts: () => request<QuizAttempt[]>('/api/quiz/attempts'),

  // DSA Practice
  getDSAProblems: () => request<DSAProblem[]>('/api/dsa/problems'),
  getDSAProblem: (id: string) => request<DSAProblem>(`/api/dsa/problems/${id}`),
  submitDSASolution: (payload: { problemId: string; code: string; language: string }) =>
    request<{ submission: DSASubmission; message: string }>('/api/dsa/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getDSASubmissions: () => request<DSASubmission[]>('/api/dsa/submissions'),

  // Study Sessions
  getStudySessions: () => request<StudySession[]>('/api/study-session'),
  saveStudySession: (payload: Partial<StudySession>) =>
    request<StudySession>('/api/study-session', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Analytics & Insights
  getProgress: () => request<ProgressAnalytics>('/api/progress'),
  getInsights: () => request<{ type: 'alert' | 'success' | 'tip'; title: string; message: string }[]>('/api/ai/insights'),

  youtubeSearch: (query: string) =>
    request<{
      query: string;
      videos: {
        videoId: string;
        title: string;
        description: string;
        channelTitle: string;
        thumbnail: string;
        url: string;
      }[];
    }>(`/api/youtube/search?q=${encodeURIComponent(query)}`),

};
