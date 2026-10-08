import React, { useEffect, useState } from 'react';
import {
  Code2,
  CheckCircle2,
  XCircle,
  Play,
  Lightbulb,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Layers,
  Search,
  BookOpen,
} from 'lucide-react';
import { api } from '../../api/client';
import { DSAProblem, DSASubmission } from '../../types';

export const DSAPracticeView: React.FC = () => {
  const [problems, setProblems] = useState<DSAProblem[]>([]);
  const [submissions, setSubmissions] = useState<DSASubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Active problem view
  const [selectedProblem, setSelectedProblem] = useState<DSAProblem | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'javascript' | 'cpp' | 'java'>('python');
  const [code, setCode] = useState('');
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<DSASubmission | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pList, sList] = await Promise.all([api.getDSAProblems(), api.getDSASubmissions()]);
      setProblems(pList);
      setSubmissions(sList);
      if (pList.length > 0 && !selectedProblem) {
        selectProblem(pList[0]);
      }
    } catch (err) {
      console.error('Failed to load DSA data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectProblem = (problem: DSAProblem) => {
    setSelectedProblem(problem);
    setShowHints(false);
    setShowSolution(false);
    setSubmissionResult(null);
    setCode(problem.starterCode[selectedLanguage] || problem.starterCode.python);
  };

  const handleLanguageChange = (lang: 'python' | 'javascript' | 'cpp' | 'java') => {
    setSelectedLanguage(lang);
    if (selectedProblem) {
      setCode(selectedProblem.starterCode[lang] || '');
    }
  };

  const handleSubmit = async () => {
    if (!selectedProblem) return;
    setIsSubmitting(true);
    setSubmissionResult(null);
    try {
      const res = await api.submitDSASolution({
        problemId: selectedProblem.id,
        code,
        language: selectedLanguage,
      });
      setSubmissionResult(res.submission);
      setSubmissions((prev) => [res.submission, ...prev]);

      // Update problem status locally
      if (res.submission.status === 'Accepted') {
        setProblems((prev) =>
          prev.map((p) => (p.id === selectedProblem.id ? { ...p, status: 'Solved' } : p))
        );
        setSelectedProblem((prev) => (prev ? { ...prev, status: 'Solved' } : null));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    'All',
    'Arrays',
    'Strings',
    'Two Pointers',
    'Stack',
    'Queue',
    'Hashing',
    'Binary Search',
    'Trees',
    'Graphs',
    'Dynamic Programming',
    'Greedy',
  ];

  const filteredProblems = problems.filter((p) => {
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesDiff = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDiff && matchesSearch;
  });

  const solvedCount = problems.filter((p) => p.status === 'Solved').length;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* HEADER & METRICS */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Code2 className="h-6 w-6 text-indigo-400" />
            DSA Interview Practice & Algorithm Lab
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Curated LeetCode-style problems with automated test runners and asymptotic complexity breakdowns.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-300">
            <span className="font-bold text-white text-sm">{solvedCount}</span> / {problems.length} Solved
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-300">
            Total Submissions: <span className="font-bold text-white">{submissions.length}</span>
          </div>
        </div>
      </div>

      {/* 2-PANE WORKSPACE: Left = Problem List / Statement, Right = Code Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: PROBLEM SELECTION & DETAILS (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* SEARCH & FILTERS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search problem title or category..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Problem selector drop/list */}
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 pt-1">
              {filteredProblems.map((p) => {
                const isSelected = selectedProblem?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => selectProblem(p)}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border border-indigo-500 bg-indigo-500/15 text-white font-medium'
                        : 'border border-slate-800/80 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      {p.status === 'Solved' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-slate-600 flex-shrink-0" />
                      )}
                      <span className="truncate">{p.title}</span>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="text-[10px] text-slate-400">{p.category}</span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          p.difficulty === 'Easy'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : p.difficulty === 'Medium'
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-rose-400 bg-rose-500/10'
                        }`}
                      >
                        {p.difficulty}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTIVE PROBLEM STATEMENT & CONSTRAINTS */}
          {selectedProblem && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {selectedProblem.category}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    selectedProblem.difficulty === 'Easy'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : selectedProblem.difficulty === 'Medium'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {selectedProblem.difficulty}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white tracking-tight">{selectedProblem.title}</h3>

              <div className="text-xs text-slate-300 leading-relaxed space-y-3 font-sans">
                <p>{selectedProblem.statement}</p>

                {/* Examples */}
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Examples
                  </p>
                  {selectedProblem.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] space-y-1"
                    >
                      <p>
                        <span className="text-slate-500">Input:</span>{' '}
                        <span className="text-slate-200">{ex.input}</span>
                      </p>
                      <p>
                        <span className="text-slate-500">Output:</span>{' '}
                        <span className="text-emerald-400">{ex.output}</span>
                      </p>
                      {ex.explanation && (
                        <p className="text-slate-400 text-[10px] font-sans italic">
                          Explanation: {ex.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Constraints
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-slate-400 font-mono space-y-0.5">
                    {selectedProblem.constraints.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>

                {/* Hints Toggle */}
                {selectedProblem.hints && selectedProblem.hints.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => setShowHints(!showHints)}
                      className="flex items-center space-x-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
                    >
                      <Lightbulb className="h-3.5 w-3.5" />
                      <span>{showHints ? 'Hide Hints' : 'Need a Hint?'}</span>
                    </button>
                    {showHints && (
                      <div className="mt-2 space-y-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                        {selectedProblem.hints.map((hint, idx) => (
                          <p key={idx}>💡 {hint}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Solution Breakdown Toggle */}
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => setShowSolution(!showSolution)}
                    className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{showSolution ? 'Hide Solution Logic' : 'View Optimal Approach'}</span>
                  </button>
                  {showSolution && (
                    <div className="mt-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-xs text-indigo-200 space-y-2">
                      <p>{selectedProblem.solutionExplanation}</p>
                      <div className="flex items-center space-x-4 pt-1 text-[11px] font-mono text-indigo-300">
                        <span>Time: {selectedProblem.timeComplexity}</span>
                        <span>Space: {selectedProblem.spaceComplexity}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CODE EDITOR & SUBMISSION RUNNER (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl backdrop-blur-md">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-400">Language:</span>
                {(['python', 'javascript', 'cpp', 'java'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                      selectedLanguage === lang
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang === 'python'
                      ? 'Python 3'
                      : lang === 'javascript'
                      ? 'JavaScript'
                      : lang === 'cpp'
                      ? 'C++'
                      : 'Java'}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>{isSubmitting ? 'Evaluating...' : 'Run & Submit'}</span>
              </button>
            </div>

            {/* Code Textarea / Editor */}
            <div className="p-4 bg-slate-950 font-mono text-xs">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={16}
                spellCheck={false}
                className="w-full bg-transparent font-mono text-xs text-indigo-100 placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Live Test Case Results Panel */}
            {submissionResult && (
              <div className="p-4 border-t border-slate-800 bg-slate-900/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {submissionResult.status === 'Accepted' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-400" />
                    )}
                    <span
                      className={`text-sm font-bold ${
                        submissionResult.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {submissionResult.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
                    <span>
                      Passed {submissionResult.passedTestCases}/{submissionResult.totalTestCases} Test Cases
                    </span>
                    <span>{submissionResult.executionTimeMs} ms</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-300">
                  {submissionResult.status === 'Accepted'
                    ? `🎉 Excellent work! All ${submissionResult.totalTestCases} test cases passed cleanly.`
                    : `⚠️ The solution produced an incorrect output on one of the hidden test cases.`}
                </div>
              </div>
            )}
          </div>

          {/* Test cases overview card */}
          {selectedProblem && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sample Test Suites</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {selectedProblem.testCases.map((tc, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60">
                    <span className="text-[10px] text-slate-500 uppercase font-sans">Case {idx + 1}</span>
                    <p className="truncate text-slate-300">Input: {tc.input}</p>
                    <p className="truncate text-emerald-400">Expected: {tc.expected}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
