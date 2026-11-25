import { useState, useCallback } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import OverviewBar from './components/OverviewBar.jsx';
import GamesSection from './components/GamesSection.jsx';
import BottomSection from './components/BottomSection.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const [osuPlaytimeSeconds, setOsuPlaytimeSeconds] = useState(null);

  const handleOsuPlaytime = useCallback((seconds) => {
    setOsuPlaytimeSeconds(seconds);
  }, []);

  return (
    <>
      <div className="cyber-decal cyber-decal--top-right" aria-hidden="true" />
      <Navbar />
      <main>
        <Hero />
        <OverviewBar osuPlaytimeSeconds={osuPlaytimeSeconds} />
        <GamesSection onOsuPlaytime={handleOsuPlaytime} />
        <BottomSection />
        <div id="socials" />
      </main>
      <Footer />
    </>
  );
}

