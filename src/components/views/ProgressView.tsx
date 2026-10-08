import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Flame,
  Clock,
  Award,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Code2,
  BarChart3,
} from 'lucide-react';
import { api } from '../../api/client';
import { ProgressAnalytics } from '../../types';
import { StatCard } from '../common/StatCard';

export const ProgressView: React.FC = () => {
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const data = await api.getProgress();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        Calculating academic performance analytics...
      </div>
    );
  }

  const maxMinutes = Math.max(...analytics.dailyStudyData.map((d) => d.minutes), 120);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-indigo-400" />
          Academic Analytics & Growth Dashboard
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Comprehensive breakdown of focus sessions, quiz accuracy, curriculum coverage, and weak subject diagnosis.
        </p>
      </div>

      {/* METRIC HIGHLIGHTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Study Logged"
          value={`${analytics.totalStudyMinutes} mins`}
          subtitle={`${Math.round(analytics.totalStudyMinutes / 60)} hours completed`}
          icon={<Clock className="h-5 w-5 text-indigo-400" />}
        />

        <StatCard
          title="Quiz Accuracy Rate"
          value={`${analytics.avgAccuracy}%`}
          subtitle={`Across ${analytics.totalQuizzes} attempts`}
          icon={<Award className="h-5 w-5 text-emerald-400" />}
          trend={{ value: 'Passing', isPositive: analytics.avgAccuracy >= 75 }}
        />

        <StatCard
          title="DSA Problem Mastery"
          value={`${analytics.dsaSolvedCount} / ${analytics.totalDsaProblems}`}
          subtitle={`${Math.round((analytics.dsaSolvedCount / analytics.totalDsaProblems) * 100)}% coverage`}
          icon={<Code2 className="h-5 w-5 text-cyan-400" />}
        />

        <StatCard
          title="Planner Completion"
          value={`${analytics.completedTasksCount} / ${analytics.totalTasksCount}`}
          subtitle={`${Math.round((analytics.completedTasksCount / analytics.totalTasksCount) * 100)}% tasks checked`}
          icon={<CheckCircle2 className="h-5 w-5 text-purple-400" />}
        />
      </div>

      {/* 2-COLUMN ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-DAY STUDY TIME HISTOGRAM (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">7-Day Study Time (Minutes)</h3>
            </div>
            <span className="text-xs text-slate-400">Target: 120m/day</span>
          </div>

          <div className="flex items-end justify-between h-48 pt-6 px-2">
            {analytics.dailyStudyData.map((d, idx) => {
              const heightPercent = Math.min(100, Math.round((d.minutes / maxMinutes) * 100));
              const isToday = idx === analytics.dailyStudyData.length - 1;
              return (
                <div key={idx} className="flex flex-col items-center flex-1 space-y-2">
                  <span className="text-[10px] font-mono font-semibold text-slate-400">
                    {d.minutes}m
                  </span>
                  <div className="w-8 sm:w-10 rounded-t-lg bg-slate-800 h-32 flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-md shadow-indigo-500/20'
                          : 'bg-indigo-600/60 hover:bg-indigo-500'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isToday ? 'text-indigo-400' : 'text-slate-400'
                    }`}
                  >
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* DSA CATEGORY DISTRIBUTION (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code2 className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">DSA Topic Progress</h3>
            </div>
            <span className="text-xs text-slate-400">Curriculum</span>
          </div>

          <div className="space-y-3 pt-1">
            {analytics.dsaProgressByCategory.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{cat.category}</span>
                  <span className="font-mono text-slate-400">
                    {cat.solved} / {cat.total} ({cat.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STRONG VS WEAK SUBJECTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Subjects */}
        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/60 p-5 space-y-3 backdrop-blur-md">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>Mastered & High-Scoring Subjects</span>
          </div>

          <div className="space-y-2.5">
            {analytics.strongSubjects.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5"
              >
                <div>
                  <p className="text-xs font-semibold text-white">{s.name}</p>
                  <p className="text-[10px] text-slate-400">Quiz Accuracy: {s.accuracy}%</p>
                </div>
                <span className="text-xs font-bold text-emerald-400">{s.progress}% Syllabus</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Subjects Diagnosed */}
        <div className="rounded-2xl border border-rose-500/20 bg-slate-900/60 p-5 space-y-3 backdrop-blur-md">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Requires Targeted Attention</span>
          </div>

          <div className="space-y-2.5">
            {analytics.weakSubjects.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-xl border border-rose-500/10 bg-rose-500/5"
              >
                <div>
                  <p className="text-xs font-semibold text-white">{s.name}</p>
                  <p className="text-[10px] text-slate-400">Quiz Accuracy: {s.accuracy}%</p>
                </div>
                <span className="text-xs font-bold text-rose-400">{s.progress}% Syllabus</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
