import React, { useState } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  BotMessageSquare,
  CalendarDays,
  Code2,
  TrendingUp,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Terminal,
  HelpCircle,
  Clock,
  Target,
  Zap,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Send,
  Loader2,
  RotateCcw,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

interface LandingViewProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onOpenAuth }) => {
  const { demoLogin } = useAuth();
  const [activePreview, setActivePreview] = useState<'tutor' | 'planner' | 'dsa' | 'progress'>('tutor');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Live interactive AI Tutor preview state
  const [liveQuery, setLiveQuery] = useState('');
  const [liveMessages, setLiveMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; model?: string }>>([
    {
      role: 'assistant',
      content:
        '👋 **Hello! I am your live StudyMate AI Tutor.**\n\nI answer your exact questions in real-time just like ChatGPT—with clear intuition, algorithms, college exam formatting, and step-by-step solutions.\n\nTry asking me any question below, or click one of the suggested academic topics!',
      model: 'gemini-3.8-flash',
    },
  ]);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [liveMarkFormat, setLiveMarkFormat] = useState<number | undefined>(undefined);

  const sampleQuestions = [
    'Explain how QuickSort works with Time Complexity',
    'Difference between TCP and UDP for a 4-mark exam',
    'How does React Virtual DOM reconciliation work?',
    'Explain Newton second law with engineering examples',
  ];

  const handleSendLiveDemo = async (queryToSend?: string) => {
    const text = (queryToSend || liveQuery).trim();
    if (!text || isLiveLoading) return;

    const newHistory = [...liveMessages, { role: 'user' as const, content: text }];
    setLiveMessages(newHistory);
    setLiveQuery('');
    setIsLiveLoading(true);

    try {
      const res = await api.liveDemoChat({
        message: text,
        history: newHistory.map((m) => ({ role: m.role, content: m.content })),
        markAllocation: liveMarkFormat,
      });

      setLiveMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          model: res.model,
        },
      ]);
    } catch (err: any) {
      setLiveMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Note: The live AI service is currently experiencing high load. Please try re-sending or sign in to access dedicated student servers.`,
        },
      ]);
    } finally {
      setIsLiveLoading(false);
    }
  };

  const faqs = [
    {
      q: 'How is StudyMate different from ChatGPT or generic AI assistants?',
      a: 'Generic AI often dumps raw code or answers that encourage mindless copying. StudyMate acts as a patient university professor: it diagnoses your weak concepts, explains the underlying mental models first, adapts mark allocations for 2/4/8/16 mark university exams, and asks checking questions before giving practice problems.',
    },
    {
      q: 'Can I practice coding and prepare for technical placement interviews?',
      a: 'Yes! StudyMate includes a dedicated DSA Practice suite with curated problems spanning Arrays, Trees, Graphs, and Dynamic Programming. You get multi-language support (Python, Java, C++, JS), hint progressions, and runtime/space complexity breakdowns.',
    },
    {
      q: 'How does the AI Study Planner work?',
      a: 'StudyMate analyzes your enrolled subjects, pending exam countdowns, daily available study hours, and quiz weak spots. It then generates realistic, non-burnout study blocks with Pomodoro-friendly focus intervals.',
    },
    {
      q: 'Does it support university mark-based exam answering?',
      a: 'Absolutely. In the AI Tutor, select 2, 4, 8, 16, or 20 marks. StudyMate formats the answer to match exact professor scoring criteria—from quick definitions to full architectural derivations and comparison matrices.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* PUBLIC NAVBAR */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-500/30 text-white font-bold text-lg">
              <Sparkles className="h-5 w-5 text-indigo-100" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                StudyMate
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  AI
                </span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#preview" className="hover:text-white transition-colors">Interactive Previews</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => demoLogin()}
              className="hidden sm:flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>Demo Login</span>
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-600 transition-all cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 h-96 w-[700px] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="pointer-events-none absolute top-40 right-10 h-72 w-72 rounded-full bg-purple-600/10 blur-[100px]" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center space-x-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 mb-6 text-xs font-medium text-indigo-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Built for College & Engineering Students • Powered by Gemini AI</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
            Study smarter. Learn faster. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
              Achieve more.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed mb-8">
            StudyMate is your personal AI-powered study companion that helps you understand complex concepts, plan your studies, practice coding, and track your academic progress.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-600 transition-all cursor-pointer"
            >
              <span>Start Learning</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => demoLogin()}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl border border-slate-800 bg-slate-900/90 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <UserCheck className="h-4 w-4 text-indigo-400" />
              <span>Explore StudyMate (One-Click Demo)</span>
            </button>
          </div>

          {/* Quick Metrics ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-4 border-t border-slate-800/60 text-left">
            <div>
              <p className="text-2xl font-bold text-white">5x</p>
              <p className="text-xs text-slate-400">Faster concept retention</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-xs text-slate-400">Personalized to your syllabus</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">2–20 Mark</p>
              <p className="text-xs text-slate-400">Exam-tailored answer generator</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">Curated DSA</p>
              <p className="text-xs text-slate-400">LeetCode-style coding prep</p>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE PREVIEW TABS */}
      <section id="preview" className="relative py-16 bg-slate-950/60 border-y border-slate-850">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
              Experience the Full Ecosystem
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Click through the live preview cards below to see how StudyMate integrates tutoring, scheduling, and coding practice.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {[
                { id: 'tutor', label: 'AI Tutor Preview', icon: BotMessageSquare },
                { id: 'planner', label: 'Study Planner Preview', icon: CalendarDays },
                { id: 'dsa', label: 'DSA Practice Preview', icon: Code2 },
                { id: 'progress', label: 'Progress Analytics Preview', icon: TrendingUp },
              ].map((t) => {
                const Icon = t.icon;
                const active = activePreview === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActivePreview(t.id as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PREVIEW CONTAINER */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-4 sm:p-6 backdrop-blur-xl">
            {activePreview === 'tutor' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center gap-2 text-indigo-400 font-semibold">
                      <BotMessageSquare className="h-4 w-4" /> Live Interactive AI Tutor
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      <Cpu className="h-3 w-3" /> Live Model
                    </span>
                  </div>

                  {/* Marks selector */}
                  <div className="flex items-center space-x-1.5 text-[11px]">
                    <span className="text-slate-400">Exam Mode:</span>
                    {[
                      { label: 'Freeform', val: undefined },
                      { label: '4M', val: 4 },
                      { label: '8M', val: 8 },
                    ].map((m) => (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => setLiveMarkFormat(m.val)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                          liveMarkFormat === m.val
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Message Thread */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {liveMessages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            isUser ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400 border border-slate-700'
                          }`}
                        >
                          {isUser ? 'U' : <BotMessageSquare className="h-4 w-4" />}
                        </div>
                        <div
                          className={`rounded-xl p-3.5 text-xs leading-relaxed max-w-[88%] ${
                            isUser
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-950/80 border border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="markdown-body prose prose-invert prose-xs max-w-none text-slate-200">
                            <Markdown>{msg.content}</Markdown>
                          </div>
                          {!isUser && msg.model && (
                            <div className="mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                              <span>Model: {msg.model}</span>
                              <span className="text-emerald-400 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Dynamic Response
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {isLiveLoading && (
                    <div className="flex items-center gap-2.5 text-xs text-slate-400 p-2">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                      <span>Thinking and synthesizing your customized answer...</span>
                    </div>
                  )}
                </div>

                {/* Sample Prompt Chips */}
                <div className="pt-2 border-t border-slate-800/60">
                  <p className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-400" /> Click to test real queries:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {sampleQuestions.map((sq, i) => (
                      <button
                        key={i}
                        disabled={isLiveLoading}
                        onClick={() => handleSendLiveDemo(sq)}
                        className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-left truncate max-w-xs"
                      >
                        {sq}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input box */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendLiveDemo();
                  }}
                  className="flex items-center gap-2 pt-1"
                >
                  <input
                    type="text"
                    value={liveQuery}
                    onChange={(e) => setLiveQuery(e.target.value)}
                    placeholder="Ask any question (e.g., Explain Virtual Memory, solve Two Sum, or define CAP theorem)..."
                    disabled={isLiveLoading}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!liveQuery.trim() || isLiveLoading}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {isLiveLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    <span>Ask AI</span>
                  </button>
                </form>

                {/* Quick login / launch banner */}
                <div className="mt-2 text-center pt-2">
                  <p className="text-[11px] text-slate-400">
                    Want to save your chats, compile DSA code, and generate weekly study schedules?{' '}
                    <button
                      onClick={demoLogin}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold underline ml-1 cursor-pointer"
                    >
                      Launch Full Dashboard (Demo)
                    </button>
                  </p>
                </div>
              </div>
            )}

            {activePreview === 'planner' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                  <span className="flex items-center gap-2 text-indigo-400 font-semibold">
                    <CalendarDays className="h-4 w-4" /> AI Generated Daily Study Plan
                  </span>
                  <span className="text-slate-400">Target: 2 hrs • 2 Subjects</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-400">18:00 – 18:45 (45 min)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">Priority: High</span>
                    </div>
                    <p className="text-xs font-bold text-white">Data Structures & Algorithms</p>
                    <p className="text-[11px] text-slate-300">Master Binary Search Variations & Rotated Array logic</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold text-cyan-400">19:00 – 19:45 (45 min)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Priority: High</span>
                    </div>
                    <p className="text-xs font-bold text-white">Operating Systems</p>
                    <p className="text-[11px] text-slate-300">CPU Scheduling Gantt Charts & Turnaround Time equations</p>
                  </div>
                </div>
              </div>
            )}

            {activePreview === 'dsa' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                  <span className="flex items-center gap-2 text-indigo-400 font-semibold">
                    <Code2 className="h-4 w-4" /> LeetCode Style Problem Runner: Two Sum
                  </span>
                  <span className="text-emerald-400 font-semibold">Accepted • 35ms Runtime</span>
                </div>
                <div className="rounded-xl bg-slate-950 p-3 font-mono text-xs text-indigo-200 border border-slate-800">
                  <p className="text-slate-500"># Time Complexity: O(N) | Space Complexity: O(N)</p>
                  <p><span className="text-indigo-400">def</span> <span className="text-amber-300">twoSum</span>(nums, target):</p>
                  <p className="pl-4">seen = &#123;&#125;</p>
                  <p className="pl-4"><span className="text-indigo-400">for</span> i, num <span className="text-indigo-400">in</span> enumerate(nums):</p>
                  <p className="pl-8">comp = target - num</p>
                  <p className="pl-8"><span className="text-indigo-400">if</span> comp <span className="text-indigo-400">in</span> seen: <span className="text-indigo-400">return</span> [seen[comp], i]</p>
                  <p className="pl-8">seen[num] = i</p>
                </div>
              </div>
            )}

            {activePreview === 'progress' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                  <span className="flex items-center gap-2 text-indigo-400 font-semibold">
                    <TrendingUp className="h-4 w-4" /> Academic Mastery Analytics
                  </span>
                  <span className="text-amber-400 font-bold">5-Day Study Streak Active 🔥</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-xl font-bold text-white">88%</p>
                    <p className="text-[10px] text-slate-400">DSA Quiz Accuracy</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-xl font-bold text-white">12.5 hrs</p>
                    <p className="text-[10px] text-slate-400">Logged This Week</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-xl font-bold text-white">4 / 4</p>
                    <p className="text-[10px] text-slate-400">Subjects on Track</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
              Engineered Specifically for College Academics
            </h2>
            <p className="text-sm text-slate-400">
              Stop juggling ten fragmented apps. StudyMate unites your syllabus, AI tutoring, exam prep, and coding practice into one cohesive workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <BotMessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Patient AI Tutor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Step-by-step concept explanations, checking questions, code complexity analysis, and 2 to 20 mark academic exam formatting.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <CalendarDays className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Intelligent Study Planner</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                AI creates realistic daily and weekly study timetables aligned with your upcoming exam countdowns and weak topics.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">DSA Practice Suite</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Curated problem catalog from Two Sum to DP Coin Change. Test case validation, hints, and Python, Java, C++, JS templates.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <div className="h-10 w-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-4">
                <HelpCircle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">AI Quiz Generator</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate high-yield MCQs for any enrolled subject or custom topic. Automatically flags weak areas for targeted revision.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Pomodoro Study Timer</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Focus in 25-minute intervals. Automatically records your completed study sessions to your personal database log.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <div className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Progress Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track study streaks, weekly goal completion, quiz accuracy trends, and subject confidence metrics across the semester.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-slate-950/70 border-t border-slate-850">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
              How StudyMate Accelerates Your Learning
            </h2>
            <p className="text-sm text-slate-400">
              Three simple steps to transform your college study habits into an unstoppable academic routine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="text-4xl font-extrabold text-indigo-500/30 mb-3">01</div>
              <h3 className="text-lg font-bold text-white mb-2">Set Up Your Academic Profile</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your university degree, enrolled subjects, exam dates, target CGPA, and available daily study hours.
              </p>
            </div>

            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="text-4xl font-extrabold text-indigo-500/30 mb-3">02</div>
              <h3 className="text-lg font-bold text-white mb-2">Active Study with AI Tutor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Follow your tailored timetable. Ask the AI Tutor to unpack tough theorems, write clean DSA solutions, and generate quizzes.
              </p>
            </div>

            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="text-4xl font-extrabold text-indigo-500/30 mb-3">03</div>
              <h3 className="text-lg font-bold text-white mb-2">Track Mastery & Ace Exams</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Watch your study streak grow. Eliminate weak topics identified by quiz analytics before walking into the exam hall.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-400">
              Everything you need to know about StudyMate's AI tutor and academic tools.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-white hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180 text-indigo-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-850 bg-slate-950 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="font-semibold text-white">StudyMate</span>
            <span>— Your Personal AI Study Companion</span>
          </div>

          <p>© 2026 StudyMate AI. Built for college & engineering students.</p>

          <div className="flex items-center space-x-4">
            <button onClick={() => onOpenAuth('login')} className="hover:text-white">
              Student Login
            </button>
            <button onClick={() => onOpenAuth('register')} className="hover:text-white">
              Register
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
