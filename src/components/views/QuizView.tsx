import React, { useEffect, useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Award,
  AlertTriangle,
  ChevronRight,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../api/client';
import { Quiz, QuizAttempt, Subject } from '../../types';
import { Modal } from '../common/Modal';

export const QuizView: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Active playing quiz state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [lastAttemptResult, setLastAttemptResult] = useState<QuizAttempt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate AI Quiz modal state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [genSubject, setGenSubject] = useState('Data Structures and Algorithms');
  const [genTopic, setGenTopic] = useState('Binary Search Trees');
  const [genDifficulty, setGenDifficulty] = useState('Medium');
  const [genCount, setGenCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qList, aList, sList] = await Promise.all([
        api.getQuizzes(),
        api.getQuizAttempts(),
        api.getSubjects(),
      ]);
      setQuizzes(qList);
      setAttempts(aList);
      setSubjects(sList);
      if (sList.length > 0) {
        setGenSubject(sList[0].name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Timer tick during active quiz
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && activeQuiz && !lastAttemptResult) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, activeQuiz, lastAttemptResult]);

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setLastAttemptResult(null);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (lastAttemptResult) return; // quiz completed
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setIsSubmitting(true);
    setIsTimerRunning(false);

    const answersPayload = activeQuiz.questions.map((q) => ({
      questionId: q.id,
      selectedOptionIndex: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1,
    }));

    try {
      const res = await api.submitQuiz({
        quizId: activeQuiz.id,
        answers: answersPayload,
        timeSpentSeconds: timerSeconds,
      });
      setLastAttemptResult(res.attempt);
      setAttempts((prev) => [res.attempt, ...prev]);
    } catch (err) {
      console.error('Failed to submit quiz', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAIQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const newQuiz = await api.generateQuiz({
        subject: genSubject,
        topic: genTopic,
        difficulty: genDifficulty,
        count: genCount,
      });
      setQuizzes((prev) => [newQuiz, ...prev]);
      setIsGenerateModalOpen(false);
      handleStartQuiz(newQuiz);
    } catch (err) {
      console.error('Failed to generate quiz', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* ACTIVE QUIZ PLAYER VIEW */}
      {activeQuiz ? (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Quiz Top Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-slate-900/80">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                {activeQuiz.subjectName || 'Engineering Mastery'} • {activeQuiz.difficulty}
              </span>
              <h2 className="text-base font-bold text-white">{activeQuiz.title}</h2>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 font-mono text-slate-300">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>{formatTime(timerSeconds)}</span>
              </div>
              <button
                onClick={() => {
                  setActiveQuiz(null);
                  setLastAttemptResult(null);
                }}
                className="text-slate-400 hover:text-white px-2 py-1"
              >
                Exit Quiz
              </button>
            </div>
          </div>

          {/* RESULTS SUMMARY SCREEN (if finished) */}
          {lastAttemptResult ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6 shadow-xl">
              <div className="text-center space-y-2">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 mb-2">
                  <Award className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-white">Quiz Completed!</h3>
                <p className="text-xs text-slate-400">
                  You scored {lastAttemptResult.score} out of {lastAttemptResult.totalQuestions} questions ({lastAttemptResult.accuracy}%) in {formatTime(lastAttemptResult.timeSpentSeconds)}.
                </p>
              </div>

              {/* Weak topics diagnosed */}
              {lastAttemptResult.weakTopics.length > 0 && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                  <p className="text-xs font-semibold text-rose-300 flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="h-4 w-4" /> Diagnosed Weak Topics (Recommended for Revision):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {lastAttemptResult.weakTopics.map((topic, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-200 border border-rose-500/30"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Question breakdown review */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Answer Review</h4>
                {activeQuiz.questions.map((q, idx) => {
                  const userChoice = selectedAnswers[q.id];
                  const isCorrect = userChoice === q.correctOptionIndex;
                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border ${
                        isCorrect
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : 'border-rose-500/20 bg-rose-500/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs font-semibold text-white">
                          {idx + 1}. {q.question}
                        </p>
                        {isCorrect ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" /> Correct
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                            <XCircle className="h-4 w-4" /> Missed
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-xs mb-2">
                        {q.options.map((opt, optIdx) => {
                          const wasPicked = userChoice === optIdx;
                          const isTheAnswer = q.correctOptionIndex === optIdx;
                          return (
                            <div
                              key={optIdx}
                              className={`p-2 rounded-lg ${
                                isTheAnswer
                                  ? 'bg-emerald-500/20 text-emerald-200 font-semibold'
                                  : wasPicked
                                  ? 'bg-rose-500/20 text-rose-200 line-through'
                                  : 'text-slate-400'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}. {opt} {isTheAnswer ? '✓ (Correct)' : ''}
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                        <strong className="text-indigo-300">Explanation:</strong> {q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={() => handleStartQuiz(activeQuiz)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Retake Quiz</span>
                </button>
                <button
                  onClick={() => {
                    setActiveQuiz(null);
                    setLastAttemptResult(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  Return to Quizzes Catalog
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE QUESTION VIEW */
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
              {/* Question progress */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                </span>
                <span className="font-mono">
                  {Object.keys(selectedAnswers).length} / {activeQuiz.questions.length} answered
                </span>
              </div>

              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%`,
                  }}
                />
              </div>

              {/* The Question */}
              {(() => {
                const q = activeQuiz.questions[currentQuestionIndex];
                const selectedOption = selectedAnswers[q.id];

                return (
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-white leading-relaxed">
                      {q.question}
                    </h3>

                    <div className="space-y-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedOption === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-500/15 text-white font-semibold shadow-sm'
                                : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                            }`}
                          >
                            <span className="flex items-center space-x-3">
                              <span className="h-6 w-6 rounded-lg bg-slate-800 flex items-center justify-center font-mono text-xs text-slate-400">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Next / Prev / Submit navigation */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                      <button
                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        Previous
                      </button>

                      {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                        <button
                          onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                          className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500"
                        >
                          <span>Next</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmitQuiz}
                          disabled={isSubmitting}
                          className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
                        >
                          <span>{isSubmitting ? 'Scoring Answers...' : 'Submit Quiz & View Score'}</span>
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ) : (
        /* QUIZZES LIST & GENERATOR VIEW */
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-indigo-400" />
                Active Recall Quizzes & Diagnostics
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Generate tailored multiple-choice tests with Gemini AI to find and fix weak concepts before exams.
              </p>
            </div>

            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-600 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate AI Quiz with Gemini</span>
            </button>
          </div>

          {/* ATTEMPTS SUMMARY BANNER */}
          {attempts.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Recent Performance History
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <p className="text-xs text-slate-400">Total Quizzes Attempted</p>
                  <p className="text-xl font-bold text-white mt-0.5">{attempts.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <p className="text-xs text-slate-400">Average Scoring Accuracy</p>
                  <p className="text-xl font-bold text-emerald-400 mt-0.5">
                    {Math.round(attempts.reduce((acc, a) => acc + a.accuracy, 0) / attempts.length)}%
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <p className="text-xs text-slate-400">Identified Weak Areas</p>
                  <p className="text-xl font-bold text-amber-400 mt-0.5">
                    {Array.from(new Set(attempts.flatMap((a) => a.weakTopics))).length} Topics
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* QUIZZES CATALOG */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Quizzes</h3>
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading quizzes...</div>
            ) : quizzes.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
                <p className="text-sm font-semibold text-slate-300">No quizzes available</p>
                <p className="text-xs text-slate-500 mt-1">Generate your first AI quiz using the button above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                          {quiz.subjectName || 'Computer Science'}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            quiz.difficulty === 'Hard'
                              ? 'bg-rose-500/15 text-rose-400'
                              : quiz.difficulty === 'Medium'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-emerald-500/15 text-emerald-400'
                          }`}
                        >
                          {quiz.difficulty}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mb-1">{quiz.title}</h4>
                      <p className="text-xs text-slate-400 mb-4">{quiz.questions.length} High-Yield Questions</p>
                    </div>

                    <button
                      onClick={() => handleStartQuiz(quiz)}
                      className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-800 hover:bg-indigo-600 hover:text-white py-2 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Take Quiz</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* GENERATE AI QUIZ MODAL */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate AI Quiz with Gemini"
        subtitle="Specify subject and topic to craft custom university-level questions"
      >
        <form onSubmit={handleGenerateAIQuiz} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Subject</label>
            <input
              type="text"
              required
              value={genSubject}
              onChange={(e) => setGenSubject(e.target.value)}
              placeholder="e.g. Operating Systems"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Specific Topic *</label>
            <input
              type="text"
              required
              value={genTopic}
              onChange={(e) => setGenTopic(e.target.value)}
              placeholder="e.g. Deadlocks, Banker's Algorithm, Semaphore"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Difficulty</label>
              <select
                value={genDifficulty}
                onChange={(e) => setGenDifficulty(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="Easy">Easy (Conceptual)</option>
                <option value="Medium">Medium (Application & Tracing)</option>
                <option value="Hard">Hard (Edge Cases & Big-O)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Question Count</label>
              <select
                value={genCount}
                onChange={(e) => setGenCount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={8}>8 Questions</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isGenerating ? 'Gemini is Crafting Quiz...' : 'Generate & Launch Quiz'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
