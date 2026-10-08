import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Briefcase,
  Code,
  Clock,
  Target,
  Mail,
  Building,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ProfileView: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [college, setCollege] = useState(profile?.college || '');
  const [course, setCourse] = useState(profile?.course || 'B.Tech / B.E.');
  const [branch, setBranch] = useState(profile?.branch || 'Computer Science');
  const [yearOfStudy, setYearOfStudy] = useState(profile?.yearOfStudy || '3rd Year');
  const [graduationYear, setGraduationYear] = useState(profile?.graduationYear || '2026');
  const [targetCgpa, setTargetCgpa] = useState(profile?.targetCgpa || '9.0 / 4.0');
  const [targetCareer, setTargetCareer] = useState(profile?.targetCareer || 'Software Engineer');
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferredLanguage || 'Python');
  const [dailyStudyTargetMinutes, setDailyStudyTargetMinutes] = useState(profile?.dailyStudyTargetMinutes || 120);
  const [primaryGoal, setPrimaryGoal] = useState(profile?.primaryGoal || 'Prepare for placements & exams');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      await updateProfile({
        name,
        college,
        course,
        branch,
        yearOfStudy,
        graduationYear,
        targetCgpa,
        targetCareer,
        preferredLanguage,
        dailyStudyTargetMinutes,
        primaryGoal,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      {/* HEADER */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <User className="h-6 w-6 text-indigo-400" />
          Student Academic Profile & Aspirations
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          These details train StudyMate's tutoring persona, exam answering expectations, and daily study allocations.
        </p>
      </div>

      {savedSuccess && (
        <div className="flex items-center space-x-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          <span>Profile updated successfully! AI Tutor parameters recalibrated.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-md">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Personal & University Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-9 pr-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email (Registered ID)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full rounded-xl border border-slate-800/60 bg-slate-950/40 py-2.5 pl-9 pr-3 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">College / University</label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. Stanford University / Tech Campus"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-9 pr-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Course / Degree</label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. B.Tech / B.S."
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Branch / Major</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Computer Science and Engineering"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Year of Study</label>
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="1st Year">1st Year (Freshman)</option>
                <option value="2nd Year">2nd Year (Sophomore)</option>
                <option value="3rd Year">3rd Year (Junior)</option>
                <option value="4th Year">4th Year (Senior)</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Graduation Year</label>
              <input
                type="text"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                placeholder="2026"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target CGPA / GPA</label>
              <input
                type="text"
                value={targetCgpa}
                onChange={(e) => setTargetCgpa(e.target.value)}
                placeholder="9.0 / 4.0"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Academic & Career Aspirations */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-md">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Career Targets & Learning Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Career / Role</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={targetCareer}
                  onChange={(e) => setTargetCareer(e.target.value)}
                  placeholder="e.g. Distributed Systems Engineer"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-9 pr-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Primary Academic Goal</label>
              <div className="relative">
                <Target className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  placeholder="e.g. Prepare for placements & campus exams"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-9 pr-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Preferred Code Language</label>
              <div className="relative">
                <Code className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-9 pr-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Python">Python</option>
                  <option value="C++">C++</option>
                  <option value="Java">Java</option>
                  <option value="JavaScript">JavaScript</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Daily Study Target</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <select
                  value={dailyStudyTargetMinutes}
                  onChange={(e) => setDailyStudyTargetMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-9 pr-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour (60 min)</option>
                  <option value={90}>1.5 hours (90 min)</option>
                  <option value={120}>2 hours (120 min) - Recommended</option>
                  <option value={180}>3 hours (180 min)</option>
                  <option value={240}>4 hours (240 min)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-600 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving Profile...' : 'Save Academic Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
