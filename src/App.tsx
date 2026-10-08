import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { TopBar } from './components/common/TopBar';
import { LandingView } from './components/views/LandingView';
import { AuthModal } from './components/views/AuthModal';
import { OnboardingModal } from './components/views/OnboardingModal';
import { DashboardView } from './components/views/DashboardView';
import { AITutorView } from './components/views/AITutorView';
import { StudyPlannerView } from './components/views/StudyPlannerView';
import { SubjectsView } from './components/views/SubjectsView';
import { NotesView } from './components/views/NotesView';
import { QuizView } from './components/views/QuizView';
import { DSAPracticeView } from './components/views/DSAPracticeView';
import { ProgressView } from './components/views/ProgressView';
import { StudyTimerView } from './components/views/StudyTimerView';
import { ProfileView } from './components/views/ProfileView';
import { SettingsView } from './components/views/SettingsView';

const AppContent: React.FC = () => {
  const { user, loading, profile } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    const savedTab = sessionStorage.getItem('studymate_current_tab');

    const validTabs: NavTab[] = [
      'dashboard',
      'tutor',
      'planner',
      'subjects',
      'notes',
      'quizzes',
      'dsa',
      'progress',
      'sessions',
      'profile',
      'settings',
    ];

    return savedTab && validTabs.includes(savedTab as NavTab)
      ? (savedTab as NavTab)
      : 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);

  const handleTabChange = (tab: NavTab) => {
    setCurrentTab(tab);
    sessionStorage.setItem('studymate_current_tab', tab);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-400">Initializing StudyMate AI...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Landing page with auth modals
  if (!user) {
    return (
      <>
        <LandingView onOpenAuth={(mode) => setAuthModalMode(mode)} />
        <AuthModal
          isOpen={authModalMode !== null}
          onClose={() => setAuthModalMode(null)}
          initialMode={authModalMode || 'login'}
        />
      </>
    );
  }

  // Logged in student app layout
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Onboarding Wizard (if first time) */}
      <OnboardingModal />

      {/* Persistent Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        streakCount={5}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <TopBar
          currentTab={currentTab}
          setCurrentTab={handleTabChange}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && <DashboardView onNavigate={handleTabChange} />}
          {currentTab === 'tutor' && <AITutorView />}
          {currentTab === 'planner' && <StudyPlannerView />}
          {currentTab === 'subjects' && <SubjectsView />}
          {currentTab === 'notes' && <NotesView />}
          {currentTab === 'quizzes' && <QuizView />}
          {currentTab === 'dsa' && <DSAPracticeView />}
          {currentTab === 'progress' && <ProgressView />}
          {currentTab === 'sessions' && <StudyTimerView />}
          {currentTab === 'profile' && <ProfileView />}
          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
