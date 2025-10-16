import LandingHeader from '../components/Landing/LandingHeader';
import LandingHero from '../components/Landing/LandingHero';
import LandingFeatures from '../components/Landing/LandingFeatures';
import LandingFooter from '../components/Landing/LandingFooter';

export default function Landing() {
  return (
    <div className="font-sans text-gray-800">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingFeatures />
      </main>
      <LandingFooter />
    </div>
  );
}
