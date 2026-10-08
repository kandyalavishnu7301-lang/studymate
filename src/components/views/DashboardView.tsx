import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Flame,
  Clock,
  Target,
  BookOpen,
  AlertTriangle,
  Calendar,
  FileText,
  HelpCircle,
  Code2,
  ArrowRight,
  BotMessageSquare,
  Timer,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../api/client';
import { DashboardData } from '../../types';
import { StatCard } from '../common/StatCard';
import { NavTab } from '../common/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-xs text-slate-400">Loading your academic dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300">
          <p className="font-semibold">Unable to load dashboard data</p>
          <p className="mt-1">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-3 rounded-lg bg-rose-600 px-3 py-1.5 text-white font-medium hover:bg-rose-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, user, profile } = data;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* GREETING & QUICK LAUNCH BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{profile?.branch || 'Computer Science'} • {profile?.yearOfStudy || '3rd Year'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {data.greeting}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Target Career: <span className="text-white font-medium">{profile?.targetCareer || 'Software Engineer'}</span> | Goal: <span className="text-white font-medium">{profile?.primaryGoal || 'Placement Prep'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('tutor')}
              className="flex items-center space-x-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <BotMessageSquare className="h-4 w-4" />
              <span>Ask StudyMate AI</span>
            </button>

            <button
              onClick={() => onNavigate('sessions')}
              className="flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
            >
              <Timer className="h-4 w-4 text-amber-400" />
              <span>Start Focus Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* CORE STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Daily Study Streak"
          value={`${stats.streak} Days`}
          subtitle={`Target: ${profile?.dailyStudyTargetMinutes || 120}m / day`}
          icon={<Flame className="h-5 w-5 fill-amber-400 text-amber-400" />}
          trend={{ value: 'Active', isPositive: true }}
          onClick={() => onNavigate('progress')}
        />

        <StatCard
          title="Study Time Today"
          value={`${stats.todayMinutes} mins`}
          subtitle={`${Math.max(0, (profile?.dailyStudyTargetMinutes || 120) - stats.todayMinutes)}m left for goal`}
          icon={<Clock className="h-5 w-5 text-indigo-400" />}
          trend={{
            value: `${Math.round((stats.todayMinutes / (profile?.dailyStudyTargetMinutes || 120)) * 100)}%`,
            isPositive: stats.todayMinutes >= (profile?.dailyStudyTargetMinutes || 120),
          }}
          onClick={() => onNavigate('sessions')}
        />

        <StatCard
          title="Weekly Target Goal"
          value={`${stats.weeklyMinutes} / ${stats.weeklyTargetMinutes}m`}
          subtitle={`${stats.weeklyGoalProgress}% of weekly target`}
          icon={<Target className="h-5 w-5 text-cyan-400" />}
          trend={{
            value: `${stats.weeklyGoalProgress}%`,
            isPositive: stats.weeklyGoalProgress >= 50,
          }}
          onClick={() => onNavigate('planner')}
        />

        <StatCard
          title="DSA Problems Solved"
          value={`${stats.dsaSolvedCount} / ${stats.totalDsaProblems}`}
          subtitle={`${Math.round((stats.dsaSolvedCount / stats.totalDsaProblems) * 100)}% Curriculum Covered`}
          icon={<Code2 className="h-5 w-5 text-emerald-400" />}
          trend={{ value: 'LeetCode Style', isPositive: true }}
          onClick={() => onNavigate('dsa')}
        />
      </div>

      {/* 2-COLUMN MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: Today's Tasks & Subject Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* TODAY'S STUDY TASKS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Today's Study Plan & Tasks</h3>
              </div>
              <button
                onClick={() => onNavigate('planner')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>Full Timetable</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {data.todayTasks.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                <p>No study tasks scheduled for today.</p>
                <button
                  onClick={() => onNavigate('planner')}
                  className="mt-3 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white"
                >
                  Generate AI Study Plan
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      task.completed
                        ? 'border-slate-800/50 bg-slate-950/40 text-slate-500'
                        : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`h-5 w-5 rounded-md flex items-center justify-center border ${
                          task.completed
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : 'border-slate-700 text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                          {task.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {task.subjectName} • {task.topic} ({task.estimatedMinutes} mins)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-[10px]">
                      <span className="font-mono text-slate-400">{task.startTime} - {task.endTime}</span>
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${
                          task.priority === 'High'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SUBJECTS & SYLLABUS OVERVIEW */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Enrolled Subjects Progress</h3>
              </div>
              <button
                onClick={() => onNavigate('subjects')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>Manage Subjects</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {data.subjects.map((subj) => (
                <div
                  key={subj.id}
                  onClick={() => onNavigate('subjects')}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white truncate max-w-[170px]">{subj.name}</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {subj.code}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span>Syllabus Covered</span>
                    <span className="font-semibold text-indigo-400">{subj.progress}%</span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all"
                      style={{ width: `${subj.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2.5 text-[10px] text-slate-400">
                    <span>{subj.topics.length} Key Topics</span>
                    <span className="text-amber-400">Exam: {subj.examDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Recommendations, Upcoming Exams & Weak Areas */}
        <div className="space-y-6">
          {/* AI RECOMMENDATIONS CARD */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 to-slate-900/80 p-5 backdrop-blur-md">
            <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-indigo-500/20">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">StudyMate AI Insights</h3>
            </div>

            <div className="space-y-2.5">
              {data.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start space-x-2.5 text-xs text-indigo-200">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />
                  <p className="leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* UPCOMING EXAMS COUNTDOWN */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Exam Countdowns</h3>
              </div>
            </div>

            <div className="space-y-2.5">
              {data.upcomingExams.map((exam, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-950/70"
                >
                  <div>
                    <p className="text-xs font-semibold text-white">{exam.subjectName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{exam.examDate}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        exam.daysLeft <= 14
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {exam.daysLeft} days left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WEAK AREAS / DIAGNOSTICS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Diagnosed Weak Areas</h3>
              </div>
              <button
                onClick={() => onNavigate('quizzes')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                Take Quiz
              </button>
            </div>

            <div className="space-y-2">
              {data.weakAreas.map((w, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-rose-500/15 bg-rose-500/5 text-xs"
                >
                  <span className="text-slate-300 truncate max-w-[180px]">{w.topic}</span>
                  <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                    {w.count} missed
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
