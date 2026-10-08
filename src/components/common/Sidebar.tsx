import React from 'react';
import {
  LayoutDashboard,
  BotMessageSquare,
  CalendarDays,
  BookOpen,
  FileText,
  HelpCircle,
  Code2,
  TrendingUp,
  Timer,
  User,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'tutor'
  | 'planner'
  | 'subjects'
  | 'notes'
  | 'quizzes'
  | 'dsa'
  | 'progress'
  | 'sessions'
  | 'profile'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  streakCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpen,
  setIsOpen,
  streakCount = 0,
}) => {
  const { user, profile, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tutor', label: 'AI Tutor', icon: BotMessageSquare, highlight: true },
    { id: 'planner', label: 'Study Planner', icon: CalendarDays },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'quizzes', label: 'Quizzes', icon: HelpCircle },

    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'sessions', label: 'Study Sessions', icon: Timer },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelect = (tab: NavTab) => {
    setCurrentTab(tab);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 border-r border-slate-800 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Logo & Name */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleSelect('dashboard')}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-500/20 text-white font-bold text-lg">
                <Sparkles className="h-5 w-5 text-indigo-100" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  StudyMate
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    AI
                  </span>
                </span>
                <p className="text-[11px] text-slate-400 font-medium">Academic Companion</p>
              </div>
            </div>
          </div>

          {/* Student Streak Pill Banner */}
          <div className="px-4 pt-4 pb-2">
            <div
              onClick={() => handleSelect('progress')}
              className="group flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10 cursor-pointer hover:border-amber-500/40 transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Flame className="h-4 w-4 fill-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-200">
                    {streakCount > 0 ? `${streakCount} Day Streak` : 'Start Your Streak'}
                  </p>
                  <p className="text-[10px] text-slate-400">Target: {profile?.dailyStudyTargetMinutes || 120}m / day</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-3 space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Main Menu</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id as NavTab)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? 'text-white' : item.highlight ? 'text-indigo-400' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {('badge' in item) && item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                      }`}
                    >
                      {'badge' in item ? String(item.badge) : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile bottom bar & logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center space-x-3 cursor-pointer overflow-hidden"
              onClick={() => handleSelect('profile')}
            >
              <div className="h-9 w-9 flex-shrink-0 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {user?.name?.charAt(0) || 'S'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Student'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'student@university.edu'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
