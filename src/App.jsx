
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import MainLayout from './layout/MainLayout';
import Login from './pages/Login';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null; // Or a loading spinner
  if (!isAuthenticated) return <Login />;
  return children;
};


// Placeholder Pages (To be implemented)
import Dashboard from './pages/Dashboard';
const Home = () => <Dashboard />;
import Calendar from './pages/Calendar';
import Directory from './pages/Directory';
import RateCard from './pages/RateCard';
import Campaigns from './pages/Campaigns';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotificationsPage from './pages/NotificationsPage';

import { ColorThemeProvider } from './context/ColorThemeContext';

const App = () => {
  return (
    <ThemeProvider>
      <DataProvider>
        <ColorThemeProvider>
          <ToastProvider>
          <Router>
            <AuthProvider>
              <ProtectedRoute>
                <MainLayout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/directory" element={<Directory />} />
                  <Route path="/rate-card" element={<RateCard />} />
                  <Route path="/campaigns" element={<Campaigns />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                </MainLayout>
              </ProtectedRoute>
            </AuthProvider>
          </Router>
        </ToastProvider>
        </ColorThemeProvider>
      </DataProvider>
    </ThemeProvider>
  );
};

export default App;
