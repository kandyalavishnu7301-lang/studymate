import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, BookOpen, Target, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';

const AVAILABLE_SUBJECTS = [
  'Data Structures and Algorithms',
  'Operating Systems',
  'Computer Networks',
  'Database Management Systems',
  'Machine Learning',
  'System Design',
  'Compiler Design',
  'Web Development & Architecture',
  'Discrete Mathematics',
  'Artificial Intelligence',
];

const GOAL_OPTIONS = [
  { id: 'Improve GPA/CGPA', label: 'Improve GPA / CGPA', desc: 'Syllabus mastery & exam scoring' },
  { id: 'Prepare for placements', label: 'Prepare for Placements', desc: 'DSA, technical interview questions' },
  { id: 'Prepare for exams', label: 'Prepare for Upcoming Exams', desc: 'High-yield revision & question banks' },
  { id: 'Learn DSA', label: 'Master Data Structures & Algorithms', desc: 'Problem solving & Big-O optimization' },
  { id: 'Learn programming', label: 'Learn Programming Languages', desc: 'Python, C++, Java core principles' },
  { id: 'Prepare for interviews', label: 'Prepare for Interviews', desc: 'Behavioral, system design, mock QA' },
  { id: 'Build projects', label: 'Build Full-Stack Projects', desc: 'Portfolio ready applications' },
  { id: 'General learning', label: 'General Learning & Curiosity', desc: 'Understand engineering foundations' },
];

export const OnboardingModal: React.FC = () => {
  const { showOnboarding, saveOnboarding, profile } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Selected state
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    'Data Structures and Algorithms',
    'Operating Systems',
    'Computer Networks',
  ]);
  const [primaryGoal, setPrimaryGoal] = useState<string>('Prepare for placements');
  const [dailyMinutes, setDailyMinutes] = useState<number>(profile?.dailyStudyTargetMinutes || 120);
  const [saving, setSaving] = useState<boolean>(false);

  if (!showOnboarding) return null;

  const toggleSubject = (name: string) => {
    if (selectedSubjects.includes(name)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter((s) => s !== name));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, name]);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await saveOnboarding({
        subjects: selectedSubjects,
        primaryGoal,
        dailyStudyTargetMinutes: dailyMinutes,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={showOnboarding}
      onClose={() => {}} // User must complete onboarding
      title="Personalize Your StudyMate AI"
      subtitle={`Step ${step} of 3 • Tailoring your tutor, syllabus schedule, and recommendations`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        {/* Progress bar */}
        <div className="flex items-center space-x-2">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-slate-800'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-800'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-indigo-600' : 'bg-slate-800'}`} />
        </div>

        {/* STEP 1: Subjects */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-semibold text-white">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <span>What subjects are you currently studying this semester?</span>
            </div>
            <p className="text-xs text-slate-400">
              Select all courses you are actively enrolled in. StudyMate will automatically generate topics, quizzes, and tasks for these subjects.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {AVAILABLE_SUBJECTS.map((subj) => {
                const isSelected = selectedSubjects.includes(subj);
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => toggleSubject(subj)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate pr-2">{subj}</span>
                    {isSelected && (
                      <div className="h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center space-x-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                <span>Continue to Goal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Primary Goal */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-semibold text-white">
              <Target className="h-4 w-4 text-indigo-400" />
              <span>What is your primary academic goal right now?</span>
            </div>
            <p className="text-xs text-slate-400">
              This guides how the AI Tutor formats explanations, exam questions, and daily schedule priority.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {GOAL_OPTIONS.map((goal) => {
                const isSelected = primaryGoal === goal.id;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setPrimaryGoal(goal.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white">{goal.label}</span>
                      {isSelected && (
                        <div className="h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{goal.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center space-x-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                <span>Continue to Study Time</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Daily Study Time */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-semibold text-white">
              <Clock className="h-4 w-4 text-indigo-400" />
              <span>How much time can you realistically study each day?</span>
            </div>
            <p className="text-xs text-slate-400">
              We'll balance this into bite-sized Pomodoro sessions so you stay productive without burnout.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { mins: 45, label: '45 mins', desc: 'Light Review' },
                { mins: 90, label: '1.5 hrs', desc: 'Steady Pace' },
                { mins: 120, label: '2 hrs', desc: 'Recommended' },
                { mins: 180, label: '3 hrs', desc: 'Intensive Prep' },
              ].map((opt) => {
                const isSelected = dailyMinutes === opt.mins;
                return (
                  <button
                    key={opt.mins}
                    type="button"
                    onClick={() => setDailyMinutes(opt.mins)}
                    className={`p-3.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/20 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <p className="text-sm font-bold text-white mb-0.5">{opt.label}</p>
                    <p className="text-[10px] text-indigo-300">{opt.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3.5 flex items-start space-x-3">
              <Sparkles className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-200 leading-relaxed">
                StudyMate is now personalized for your goal to <span className="font-semibold text-white">{primaryGoal}</span> with {dailyMinutes} minutes of daily structured study across {selectedSubjects.length} subjects!
              </p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-600 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{saving ? 'Configuring Dashboard...' : 'Launch My StudyMate Dashboard'}</span>
                <Sparkles className="h-3.5 w-3.5 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
