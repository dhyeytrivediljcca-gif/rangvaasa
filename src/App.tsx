import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
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
import './App.css';

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
      <div className="app">
        {isAdminView ? (
          <AdminPortal onExit={handleExitAdmin} />
        ) : (
          <>
            <RangvaasaLoader />
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
            <Footer onOpenAdmin={handleOpenAdmin} />
          </>
        )}
      </div>
    </ThemeProvider>
  );
};

export default App;
