import { RouteObject } from 'react-router-dom';
import StudioRoute from './StudioRoute';
import StudioDashboard from '~/components/Studio/StudioDashboard';

// Temporarily disabled to fix build issues - will re-enable after optimization
// const LDAIChatPage = lazy(() => import('~/components/Studio/applications/LDAI/pages/LDAIChatPage'));
// const LDAIAdminPage = lazy(() => import('~/components/Studio/applications/LDAI/pages/LDAIAdminPage'));
// const StoryFinderPage = lazy(() => import('~/components/Studio/applications/StoryFinder/pages/StoryFinderPage'));
// const StoryCollectionPage = lazy(() => import('~/components/Studio/applications/StoryFinder/pages/StoryCollectionPage'));
// const CandidateProfilePage = lazy(() => import('~/components/Studio/applications/StoryFinder/pages/CandidateProfilePage'));
// const GeneratedStoryPage = lazy(() => import('~/components/Studio/applications/StoryFinder/pages/GeneratedStoryPage'));
// const StoryEditor = lazy(() => import('~/components/Studio/applications/StoryFinder/pages/StoryEditor'));

const ComingSoon = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">Coming Soon</h1>
      <p className="text-gray-600">This feature is currently being optimized.</p>
    </div>
  </div>
);

const studioRoutes: RouteObject = {
  path: 'studio',
  element: <StudioRoute />,
  children: [
    {
      index: true,
      element: <StudioDashboard />,
    },
    {
      path: 'ldai/chat',
      element: <ComingSoon />,
    },
    {
      path: 'ldai/admin',
      element: <ComingSoon />,
    },
    {
      path: 'storyfinder',
      element: <ComingSoon />,
    },
    {
      path: 'storyfinder/:id',
      element: <ComingSoon />,
    },
    {
      path: 'storyfinder/:id/candidate/:cid',
      element: <ComingSoon />,
    },
    {
      path: 'storyfinder/:id/candidate/:cid/story',
      element: <ComingSoon />,
    },
    {
      path: 'storyfinder/:id/candidate/:cid/story/edit',
      element: <ComingSoon />,
    },
  ],
};

export default studioRoutes;
