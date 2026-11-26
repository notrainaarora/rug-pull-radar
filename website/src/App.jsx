import { useRef } from 'react';
import About from './components/About';
import Explore from './components/Explore';
import Footer from './components/Footer';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Honesty from './components/Honesty';
import Nav from './components/Nav';
import PumpAlarm from './components/PumpAlarm';
import Results from './components/Results';
import Roadmap from './components/Roadmap';
import Stats from './components/Stats';
import Twist from './components/Twist';

export default function App() {
  const scanner = useRef(null);
  return (
    <div id="top" className="relative overflow-x-clip">
      <Nav />
      <main>
        <Hero ref={scanner} />
        <Stats />
        <Twist />
        <Explore onPick={(t) => scanner.current?.load(t)} />
        <PumpAlarm />
        <HowItWorks />
        <Results />
        <Honesty />
        <Roadmap />
        <About />
      </main>
      <Footer />
    </div>
  );
}
