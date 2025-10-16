import useLenis from '~/hooks/useLenis';
import LandingHeader from './Landing/LandingHeader';
import LandingHero from './Landing/LandingHero';
import LandingFeatures from './Landing/LandingFeatures';
import LandingFooter from './Landing/LandingFooter';

export default function StudioLanding() {
  useLenis();

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
