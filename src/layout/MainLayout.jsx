
import React from 'react';
import { useNavigate } from 'react-router-dom';
import StarField from '../components/common/StarField';
import NavBar from '../components/layout/NavBar';
import { useTheme } from '../context/ThemeContext';

const MainLayout = ({ children }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Global Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
        // Ignore if typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch(e.key.toUpperCase()) {
            case 'H': navigate('/'); break;
            case 'C': navigate('/campaigns'); break;
            case 'A': navigate('/calendar'); break;
            case 'D': navigate('/directory'); break;
            case 'T': navigate('/rate-card'); break;
            case 'R': navigate('/reports'); break;
            case 'S': navigate('/settings'); break;
            default: break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className={`flex flex-col h-screen w-full overflow-hidden ${theme.bg} text-white transition-colors duration-500 selection:bg-[#E8A631] selection:text-black`}>
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] ${theme.accentBg} rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-blob`}></div>
        <div className={`absolute top-[10%] right-[0%] w-[60vw] h-[60vw] ${theme.accentSecondary ? theme.accentSecondary : 'bg-purple-500'} rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-blob animation-delay-2000`}></div>
        <div className={`absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] ${theme.sidebarBg} rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-blob animation-delay-4000`}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <StarField />
      </div>

      <NavBar />

      <main className="flex-1 pt-20 p-6 overflow-y-auto relative z-10 w-full max-w-[1920px] mx-auto custom-scrollbar">
         {children}
      </main>
    </div>
  );
};

export default MainLayout;
