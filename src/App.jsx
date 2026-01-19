
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import MainLayout from './layout/MainLayout';
import Login from './pages/Login';

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


// Placeholder Pages (To be implemented)
import Dashboard from './pages/Dashboard';
const Home = () => <Dashboard />;
import Calendar from './pages/Calendar';
import Directory from './pages/Directory';
import RateCard from './pages/RateCard';
import Projects from './pages/Projects';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Help from './pages/Help';
import NotificationsPage from './pages/NotificationsPage';

import { ColorThemeProvider } from './context/ColorThemeContext';

import SWUpdatePrompt from './components/common/SWUpdatePrompt';

const App = () => {
  return (
    <ThemeProvider>
      <ColorThemeProvider>
        <ToastProvider>
          <Router>
            <AuthProvider>
              <DataProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/*" element={
                        <ProtectedRoute>
                            <MainLayout>
                                <SWUpdatePrompt />
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
                            </MainLayout>
                        </ProtectedRoute>
                    } />
                </Routes>
              </DataProvider>
            </AuthProvider>
          </Router>
        </ToastProvider>
      </ColorThemeProvider>
    </ThemeProvider>
  );
};

export default App;
