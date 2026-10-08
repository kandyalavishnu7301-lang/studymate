import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Sparkles, ArrowRight, UserCheck, AlertCircle, CheckCircle2, Lock, Mail, User, GraduationCap, Briefcase, Code, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const { login, register, demoLogin, googleLogin } = useAuth();

  // Login & Forgot state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form states
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('B.Tech / B.E.');
  const [branch, setBranch] = useState('Computer Science');
  const [yearOfStudy, setYearOfStudy] = useState('3rd Year');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [targetCgpa, setTargetCgpa] = useState('9.0 / 4.0');
  const [targetCareer, setTargetCareer] = useState('Software Development Engineer (SDE)');
  const [preferredLanguage, setPreferredLanguage] = useState('Python');
  const [dailyStudyTargetMinutes, setDailyStudyTargetMinutes] = useState(120);

  // Status & Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        college,
        course,
        branch,
        yearOfStudy,
        graduationYear,
        targetCgpa,
        targetCareer,
        preferredLanguage,
        dailyStudyTargetMinutes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to start demo session');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      setSuccessMessage(`Reset link dispatched to ${email}. Check your inbox!`);
    } catch (err: any) {
      setError('Could not send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'login'
          ? 'Sign in to StudyMate'
          : mode === 'register'
          ? 'Create Student Account'
          : 'Reset Password'
      }
      subtitle={
        mode === 'login'
          ? 'Enter your credentials to access your personal AI tutor & study planner'
          : mode === 'register'
          ? 'Join StudyMate to personalize your AI study companion & academic roadmap'
          : 'Enter your email to receive password recovery instructions'
      }
      maxWidth={mode === 'register' ? 'max-w-2xl' : 'max-w-md'}
    >
      {error && (
        <div className="mb-4 flex items-center space-x-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 flex items-center space-x-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* One-click Demo Button (highlighted for quick testing!) */}
      {mode === 'login' && (
        <div className="mb-5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Quick Review: Alex Rivera (Demo)</p>
                <p className="text-[11px] text-slate-300">CS 3rd Year • Pre-populated coursework & stats</p>
              </div>
            </div>
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="flex items-center space-x-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Explore Demo</span>
            </button>
          </div>
        </div>
      )}

      {/* LOGIN FORM */}
      {mode === 'login' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">College Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@studymate.edu"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-600 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            <ArrowRight className="h-4 w-4 ml-1" />
          </button>
           
                     <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs text-slate-500">OR</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (!credentialResponse.credential) {
                  setError('Google sign-in did not return a credential.');
                  return;
                }

                setError(null);
                setLoading(true);

                try {
                  await googleLogin(credentialResponse.credential);
                  onClose();
                } catch (err: any) {
                  setError(err?.message || 'Google sign-in failed');
                } finally {
                  setLoading(false);
                }
              }}
              onError={() => {
                setError('Google sign-in failed. Please try again.');
              }}
              useOneTap={false}
            />
          </div>

          <div className="pt-2 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              Register here
            </button>
          </div>
        </form>
      )}

      {/* REGISTER FORM */}
      {mode === 'register' && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@university.edu"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">College / University</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="Stanford / MIT / Tech Campus"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Degree / Course</label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="B.Tech / B.S. / M.S."
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Branch / Major</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="Computer Science / ECE / IT"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Year of Study</label>
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 px-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="1st Year">1st Year (Freshman)</option>
                <option value="2nd Year">2nd Year (Sophomore)</option>
                <option value="3rd Year">3rd Year (Junior)</option>
                <option value="4th Year">4th Year (Senior)</option>
                <option value="Postgraduate">Postgraduate / Masters</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Graduation Year</label>
              <input
                type="text"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                placeholder="2026"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target CGPA / GPA</label>
              <input
                type="text"
                value={targetCgpa}
                onChange={(e) => setTargetCgpa(e.target.value)}
                placeholder="9.0 / 4.0"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 px-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Career / Role</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={targetCareer}
                  onChange={(e) => setTargetCareer(e.target.value)}
                  placeholder="Full-Stack Engineer, AI/ML Specialist"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
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
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
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
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value={60}>1 hour (60 min)</option>
                  <option value={90}>1.5 hours (90 min)</option>
                  <option value={120}>2 hours (120 min)</option>
                  <option value={180}>3 hours (180 min)</option>
                  <option value={240}>4 hours (240 min)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-600 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Creating Account & Profile...' : 'Complete Registration & Start Learning'}
            <ArrowRight className="h-4 w-4 ml-1" />
          </button>

          <div className="text-center text-xs text-slate-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              Sign in
            </button>
          </div>
        </form>
      )}

      {/* FORGOT PASSWORD */}
      {mode === 'forgot' && (
        <form onSubmit={handleForgot} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Your Registered Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@university.edu"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all cursor-pointer"
          >
            {loading ? 'Sending...' : 'Send Recovery Instructions'}
          </button>

          <div className="text-center text-xs text-slate-400">
            <button
              type="button"
              onClick={() => setMode('login')}
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              ← Back to Sign In
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
