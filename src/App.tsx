import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { MusicProvider, useMusic } from './contexts/MusicContext';
import RangvaasaLoader from './components/RangvaasaLoader';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Experience from './components/Experience';
import ArtAdda from './components/ArtAdda';
import EventDetails from './components/EventDetails';
import PassGenerator from './components/PassGenerator';
import StallRegistration from './components/StallRegistration';
import Footer from './components/Footer';
import { AdminPortal } from './components/admin/AdminPortal';
import MusicPlayer from './components/MusicPlayer';
import './App.css';

interface MainWebsiteProps {
  onOpenAdmin: () => void;
}

const MainWebsite: React.FC<MainWebsiteProps> = ({ onOpenAdmin }) => {
  const { notifyReveal } = useMusic();

  return (
    <>
      {/* Loader with landing page reveal callback */}
      <RangvaasaLoader onComplete={notifyReveal} />
      <CustomCursor />
      <Navbar />
      <main id="main-content">
        <Hero />
        <Experience />
        <ArtAdda />
        <EventDetails />
        <PassGenerator />
        <StallRegistration />
      </main>
      <Footer onOpenAdmin={onOpenAdmin} />
      {/* Floating Music Player with ON/OFF and Volume Controls */}
      <MusicPlayer />
    </>
  );
};

const App: React.FC = () => {
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    return (
      window.location.pathname.startsWith('/admin') ||
      window.location.hash === '#admin'
    );
  });

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setIsAdminView(
        window.location.pathname.startsWith('/admin') ||
        window.location.hash === '#admin'
      );
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenAdmin = () => {
    window.history.pushState(null, '', '/admin');
    setIsAdminView(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitAdmin = () => {
    window.history.pushState(null, '', '/');
    setIsAdminView(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ThemeProvider>
      <MusicProvider>
        <div className="app">
          {isAdminView ? (
            <AdminPortal onExit={handleExitAdmin} />
          ) : (
            <MainWebsite onOpenAdmin={handleOpenAdmin} />
          )}
        </div>
      </MusicProvider>
    </ThemeProvider>
  );
};

export default App;
