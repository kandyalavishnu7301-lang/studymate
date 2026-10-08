import React, { useEffect, useState } from 'react';
import { Menu, Timer, BotMessageSquare, Sparkles, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NavTab } from './Sidebar';
import { api } from '../../api/client';

interface TopBarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  onOpenSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ currentTab, setCurrentTab, onOpenSidebar }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [health, setHealth] = useState<{ status: string; geminiConfigured: boolean; model: string } | null>(null);

  useEffect(() => {
    api.checkHealth().then(setHealth).catch(() => {});
  }, []);

  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Academic Command Center', subtitle: 'Real-time overview of your progress and tasks' },
    tutor: { title: 'StudyMate AI Tutor', subtitle: 'Patient pedagogical assistance powered by Gemini 3.8 Flash' },
    planner: { title: 'Intelligent Study Planner', subtitle: 'Optimized daily & weekly schedules tailored to exam dates' },
    subjects: { title: 'Enrolled Subjects & Syllabus', subtitle: 'Manage coursework, topics, and exam countdowns' },
    notes: { title: 'Academic Notes & AI Synthesis', subtitle: 'Organized markdown notes with AI simplification' },
    quizzes: { title: 'Quiz Mastery & Diagnostics', subtitle: 'Self-assessment with instant grading and weak-area identification' },
    dsa: { title: 'Data Structures & Algorithms Practice', subtitle: 'Coding interview prep with live test cases and complexity analysis' },
    progress: { title: 'Academic Analytics & Growth', subtitle: 'Data-driven insights into your study habits and accuracy' },
    sessions: { title: 'Deep Focus & Pomodoro Timer', subtitle: 'Interval-based focus sessions with automated progress logging' },
    profile: { title: 'Student Academic Profile', subtitle: 'Degree, career aspirations, target GPA, and preferences' },
    settings: { title: 'Application Settings', subtitle: 'AI tutor customization, theme, and account preferences' },
  };

  const activeInfo = titles[currentTab] || { title: 'StudyMate', subtitle: 'Your Academic Companion' };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
            {activeInfo.title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-400 leading-tight">
            {activeInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Gemini Status Chip */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
          <span>Gemini 3.8 Flash Active</span>
        </div>

        {/* Quick Ask AI button if not on AI tab */}
        {currentTab !== 'tutor' && (
          <button
            onClick={() => setCurrentTab('tutor')}
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-600 transition-all cursor-pointer"
          >
            <BotMessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ask AI Tutor</span>
            <span className="sm:hidden">Ask AI</span>
          </button>
        )}

        {/* Quick Focus Timer button if not on sessions tab */}
        {currentTab !== 'sessions' && (
          <button
            onClick={() => setCurrentTab('sessions')}
            title="Start Focus Timer"
            className="flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Timer className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Focus Timer</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User avatar / profile button */}
        <button
          onClick={() => setCurrentTab('profile')}
          className="flex items-center space-x-2 rounded-xl border border-slate-800 bg-slate-900 p-1.5 pr-2.5 hover:border-slate-700 hover:bg-slate-800 transition-all text-left"
        >
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <span className="hidden sm:inline text-xs font-medium text-slate-300">
            {user?.name?.split(' ')[0] || 'Student'}
          </span>
        </button>
      </div>
    </header>
  );
};
