import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import RangvaasaLoader from './components/RangvaasaLoader';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Experience from './components/Experience';
import ArtAdda from './components/ArtAdda';
import EventDetails from './components/EventDetails';
import PassGenerator from './components/PassGenerator';
import Footer from './components/Footer';
import './App.css';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <div className="app">
        <RangvaasaLoader />
        <CustomCursor />
        <Navbar />
        <main id="main-content">
          <Hero />
          <Experience />
          <ArtAdda />
          <EventDetails />
          <PassGenerator />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default App;
