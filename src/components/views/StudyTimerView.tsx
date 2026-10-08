import React, { useEffect, useState, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Coffee,
  Brain,
  History,
} from 'lucide-react';
import { api } from '../../api/client';
import { StudySession, Subject } from '../../types';

export const StudyTimerView: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [sessionType, setSessionType] = useState<'pomodoro' | 'short_break' | 'long_break' | 'custom'>('pomodoro');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState<string>('');

  // Durations in minutes
  const defaultTimes = {
    pomodoro: 25,
    short_break: 5,
    long_break: 15,
    custom: 45,
  };

  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedCelebration, setCompletedCelebration] = useState(false);

  useEffect(() => {
    Promise.all([api.getSubjects(), api.getStudySessions()]).then(([sList, sessList]) => {
      setSubjects(sList);
      setRecentSessions(sessList);
      if (sList.length > 0) setSelectedSubjectId(sList[0].id);
    });
  }, []);

  // Timer countdown loop
  useEffect(() => {
    let interval: any;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && secondsRemaining === 0) {
      setIsRunning(false);
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining]);

  const handleModeChange = (type: 'pomodoro' | 'short_break' | 'long_break' | 'custom') => {
    setSessionType(type);
    setIsRunning(false);
    const mins = defaultTimes[type];
    setTotalSeconds(mins * 60);
    setSecondsRemaining(mins * 60);
    setCompletedCelebration(false);
  };

  const handleCustomDurationChange = (mins: number) => {
    setTotalSeconds(mins * 60);
    setSecondsRemaining(mins * 60);
    setIsRunning(false);
  };

  const handleSessionComplete = async () => {
    setCompletedCelebration(true);
    const selSubject = subjects.find((s) => s.id === selectedSubjectId);
    const durationMinutes = Math.round(totalSeconds / 60);

    try {
      const saved = await api.saveStudySession({
        subjectId: selectedSubjectId || undefined,
        subjectName: selSubject ? selSubject.name : undefined,
        durationMinutes,
        sessionType,
        notes: sessionNotes || undefined,
      });
      setRecentSessions((prev) => [saved, ...prev]);
    } catch (err) {
      console.error('Failed to log session', err);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsRemaining(totalSeconds);
    setCompletedCelebration(false);
  };

  const formatMinutes = Math.floor(secondsRemaining / 60);
  const formatSeconds = secondsRemaining % 60;
  const progressPercent = ((totalSeconds - secondsRemaining) / totalSeconds) * 100;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Timer className="h-6 w-6 text-amber-400" />
          Pomodoro & Deep Work Focus Lab
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Eliminate digital distractions with time-boxed focus sessions that automatically log to your study streak.
        </p>
      </div>

      {/* MAIN TIMER CARD */}
      <div className="relative rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 sm:p-10 backdrop-blur-xl shadow-2xl text-center overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-amber-500/10 blur-3xl" />

        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {[
            { id: 'pomodoro', label: '25m Focus', icon: Brain },
            { id: 'short_break', label: '5m Short Break', icon: Coffee },
            { id: 'long_break', label: '15m Long Break', icon: Coffee },
            { id: 'custom', label: 'Custom', icon: Timer },
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = sessionType === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id as any)}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Custom duration slider if custom is picked */}
        {sessionType === 'custom' && (
          <div className="max-w-xs mx-auto mb-6 space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Duration</span>
              <span className="font-bold text-amber-400">{Math.round(totalSeconds / 60)} minutes</span>
            </div>
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={Math.round(totalSeconds / 60)}
              onChange={(e) => handleCustomDurationChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        )}

        {/* Circular / Large Digital Display */}
        <div className="relative my-6 inline-flex flex-col items-center justify-center">
          <div className="text-6xl sm:text-8xl font-extrabold font-mono text-white tracking-tighter drop-shadow-md">
            {formatMinutes < 10 ? `0${formatMinutes}` : formatMinutes}:
            {formatSeconds < 10 ? `0${formatSeconds}` : formatSeconds}
          </div>

          <p className="text-xs uppercase tracking-widest text-slate-400 mt-2 font-semibold">
            {sessionType === 'pomodoro'
              ? 'Deep Focus Interval'
              : sessionType === 'short_break'
              ? 'Rest & Recharge'
              : sessionType === 'long_break'
              ? 'Long Recovery Break'
              : 'Custom Session'}
          </p>

          {/* Progress ring track */}
          <div className="w-64 sm:w-80 h-2 bg-slate-800 rounded-full mt-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Completed Celebration Banner */}
        {completedCelebration && (
          <div className="max-w-md mx-auto my-4 p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>Session complete! Duration logged to your personal study analytics.</span>
          </div>
        )}

        {/* CONTROLS */}
        <div className="flex items-center justify-center space-x-4 my-6">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center space-x-2 px-8 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg cursor-pointer ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-amber-500/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5 fill-white" />
                <span>{secondsRemaining < totalSeconds ? 'Resume' : 'Start Focus'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>

        {/* SUBJECT & SESSION NOTES TAGGING */}
        <div className="max-w-md mx-auto pt-6 border-t border-slate-800/80 text-left grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Associate Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="">General Focus</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Session Goal / Notes</label>
            <input
              type="text"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="e.g. Read Paging Ch. 4"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* RECENT SESSIONS LOG */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
        <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-800">
          <History className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Recent Logged Sessions</h3>
        </div>

        {recentSessions.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 italic text-center">No study sessions logged yet.</p>
        ) : (
          <div className="space-y-2">
            {recentSessions.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 text-xs"
              >
                <div>
                  <span className="font-semibold text-white">{s.subjectName || 'General Focus'}</span>
                  {s.notes && <p className="text-[11px] text-slate-400">{s.notes}</p>}
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-400 font-mono">{s.durationMinutes} mins</span>
                  <p className="text-[10px] text-slate-500">
                    {new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
