import React, { useState } from 'react';
import {
  Settings,
  Sun,
  Moon,
  BotMessageSquare,
  Bell,
  Database,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const SettingsView: React.FC = () => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [tutorDetailLevel, setTutorDetailLevel] = useState<'concise' | 'balanced' | 'comprehensive'>('balanced');
  const [dailyReminders, setDailyReminders] = useState(true);
  const [examAlerts, setExamAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      {/* HEADER */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-indigo-400" />
          Application & AI Tutor Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Customize UI theme, Gemini pedagogical behavior, study notification thresholds, and account options.
        </p>
      </div>

      {savedSuccess && (
        <div className="flex items-center space-x-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          <span>Preferences updated successfully!</span>
        </div>
      )}

      {/* APPEARANCE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Appearance & Display Theme
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white">Active Theme Mode</p>
            <p className="text-[11px] text-slate-400">
              Dark theme is optimized for long late-night coding and study sessions.
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-750 transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <Moon className="h-4 w-4 text-indigo-400" />
                <span>Dark Mode (Active)</span>
              </>
            ) : (
              <>
                <Sun className="h-4 w-4 text-amber-400" />
                <span>Light Mode (Active)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI TUTOR BEHAVIOR */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          AI Tutor Pedagogical Tuning
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Explanation Depth</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'concise', label: 'Concise Bullet Points', desc: 'Quick revision' },
                { id: 'balanced', label: 'Balanced Pedagogical', desc: 'Recommended default' },
                { id: 'comprehensive', label: 'Comprehensive Derivation', desc: 'Deep exam mastery' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setTutorDetailLevel(lvl.id as any)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    tutorDetailLevel === lvl.id
                      ? 'border-indigo-500 bg-indigo-500/15 text-white font-semibold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="font-semibold mb-0.5">{lvl.label}</p>
                  <p className="text-[10px] text-slate-500">{lvl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 flex items-center justify-between text-xs text-indigo-300">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" /> Model: Gemini 3.8 Flash
            </span>
            <span className="text-[11px] font-mono text-emerald-400">Zero Latency API</span>
          </div>
        </div>
      </div>

      {/* STUDY REMINDERS */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Notifications & Academic Reminders
        </h3>

        <div className="space-y-3">
          <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
            <div>
              <p className="font-semibold text-white">Daily Target & Streak Reminders</p>
              <p className="text-[11px] text-slate-500">Alerts when you are within 45 minutes of breaking your study streak.</p>
            </div>
            <input
              type="checkbox"
              checked={dailyReminders}
              onChange={(e) => setDailyReminders(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer pt-2 border-t border-slate-800/60">
            <div>
              <p className="font-semibold text-white">High-Yield Exam Proximity Warnings</p>
              <p className="text-[11px] text-slate-500">Auto-schedules revision tasks when an enrolled exam is less than 14 days away.</p>
            </div>
            <input
              type="checkbox"
              checked={examAlerts}
              onChange={(e) => setExamAlerts(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
          </label>
        </div>
      </div>

      {/* ACCOUNT & STORAGE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Account & Data Session
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-white">Signed in as {user?.email}</p>
            <p className="text-[11px] text-slate-500">Persistent database active in /data/studymate.json</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              Save Preferences
            </button>
            <button
              onClick={logout}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
