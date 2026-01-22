
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import MainLayout from './layout/MainLayout';
import Login from './pages/Login';
import ErrorBoundary from './components/common/ErrorBoundary';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#E8A631] border-t-transparent animate-spin"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};


// Lazy Load Pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const Directory = React.lazy(() => import('./pages/Directory'));
const RateCard = React.lazy(() => import('./pages/RateCard'));
const Projects = React.lazy(() => import('./pages/Projects'));
const Billing = React.lazy(() => import('./pages/Billing'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Help = React.lazy(() => import('./pages/Help'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));

const Home = () => <Dashboard />;

import { ColorThemeProvider } from './context/ColorThemeContext';
import SWUpdatePrompt from './components/common/SWUpdatePrompt';

// Loading Component
const LoadingSpinner = () => (
    <div className="h-full w-full flex items-center justify-center p-10">
        <div className="w-8 h-8 rounded-full border-2 border-[#E8A631] border-t-transparent animate-spin"></div>
    </div>
);

import { SyncProvider } from './context/SyncContext';

const App = () => {
  return (
    <ThemeProvider>
      <ColorThemeProvider>
        <ToastProvider>
          <ErrorBoundary>
          <Router>
            <AuthProvider>
                <SyncProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/*" element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <SWUpdatePrompt />
                                    <React.Suspense fallback={<LoadingSpinner />}>
                                        <Routes>
                                            <Route path="/" element={<Home />} />
                                            <Route path="/calendar" element={<Calendar />} />
                                            <Route path="/directory" element={<Directory />} />
                                            <Route path="/rate-card" element={<RateCard />} />
                                            <Route path="/projects" element={<Projects />} />
                                            <Route path="/billing" element={<Billing />} />
                                            <Route path="/reports" element={<Reports />} />
                                            <Route path="/settings" element={<Settings />} />
                                            <Route path="/help" element={<Help />} />
                                            <Route path="/notifications" element={<NotificationsPage />} />
                                            <Route path="*" element={<Navigate to="/" replace />} />
                                        </Routes>
                                    </React.Suspense>
                                </MainLayout>
                            </ProtectedRoute>
                        } />
                    </Routes>
                </SyncProvider>
            </AuthProvider>
          </Router>
          </ErrorBoundary>
        </ToastProvider>
      </ColorThemeProvider>
    </ThemeProvider>
  );
};

export default App;
