import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { ActiveTab } from './types/database';

import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { OfflineBanner } from './components/common/OfflineBanner';
import { Toast } from './components/common/Toast';
import { SkeletonLoader } from './components/common/SkeletonLoader';

import { AuthPage } from './components/auth/AuthPage';
import { HomeDashboard } from './components/dashboard/HomeDashboard';
import { ProfileView } from './components/profile/ProfileView';
import { CoursesView } from './components/courses/CoursesView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { ScheduleView } from './components/schedule/ScheduleView';
import { TasksView } from './components/tasks/TasksView';
import { ExamsView } from './components/exams/ExamsView';
import { ScholarshipView } from './components/scholarship/ScholarshipView';
import { AuthModal } from './components/auth/AuthModal';
import { NotificationsModal } from './components/notifications/NotificationsModal';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isLoadingData } = useData();

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [authModalState, setAuthModalState] = useState<{ isOpen: boolean; mode: 'login' | 'signup' | 'forgot' }>({
    isOpen: false,
    mode: 'login',
  });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#0F3040] text-slate-100 antialiased selection:bg-[#A56F63] selection:text-white">
      
      {/* 1. Top Offline Warning Banner */}
      <OfflineBanner />

      {/* 2. Top Navigation Header */}
      <Header
        onOpenAuth={(mode) => setAuthModalState({ isOpen: true, mode })}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* 3. Main Content: When Not Authenticated -> Show AuthPage Only */}
      {!isAuthenticated ? (
        <main className="flex-1 flex flex-col justify-center">
          <AuthPage />
        </main>
      ) : (
        /* When Authenticated -> Full Student Portal Experience */
        <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
          
          {/* Main Views Area */}
          <main className="flex-1 min-w-0">
            {isAuthLoading || isLoadingData ? (
              <div className="space-y-6 animate-fade-in">
                <SkeletonLoader type="stat" count={4} />
                <SkeletonLoader type="card" count={2} />
              </div>
            ) : (
              <>
                {activeTab === 'home' && (
                  <HomeDashboard
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onOpenAddCourse={() => setActiveTab('courses')}
                    onOpenAddTask={() => setActiveTab('tasks')}
                  />
                )}

                {activeTab === 'profile' && <ProfileView />}

                {activeTab === 'courses' && <CoursesView />}

                {activeTab === 'attendance' && <AttendanceView />}

                {activeTab === 'schedule' && <ScheduleView />}

                {activeTab === 'tasks' && <TasksView />}

                {activeTab === 'exams' && <ExamsView />}

                {activeTab === 'scholarships' && <ScholarshipView />}
              </>
            )}
          </main>

          {/* Right Sidebar (جهة اليمين RTL) */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      )}

      {/* 4. Mandatory Global Fixed Footer */}
      <Footer />

      {/* 5. Global Modals & Notifications */}
      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        onClose={() => setAuthModalState(prev => ({ ...prev, isOpen: false }))}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* 6. Server Error & Retry Toast */}
      <Toast />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainLayout />
      </DataProvider>
    </AuthProvider>
  );
}
