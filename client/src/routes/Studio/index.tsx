import { RouteObject } from 'react-router-dom';
import StudioRoute from './StudioRoute';
import StudioDashboard from '~/components/Studio/StudioDashboard';
import LDAIChatPage from '~/components/Studio/applications/LDAI/pages/LDAIChatPage';
import LDAIAdminPage from '~/components/Studio/applications/LDAI/pages/LDAIAdminPage';
import StoryFinderPage from '~/components/Studio/applications/StoryFinder/pages/StoryFinderPage';
import StoryCollectionPage from '~/components/Studio/applications/StoryFinder/pages/StoryCollectionPage';
import CandidateProfilePage from '~/components/Studio/applications/StoryFinder/pages/CandidateProfilePage';
import GeneratedStoryPage from '~/components/Studio/applications/StoryFinder/pages/GeneratedStoryPage';
import StoryEditor from '~/components/Studio/applications/StoryFinder/pages/StoryEditor';

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
      element: <LDAIChatPage />,
    },
    {
      path: 'ldai/admin',
      element: <LDAIAdminPage />,
    },
    {
      path: 'storyfinder',
      element: <StoryFinderPage />,
    },
    {
      path: 'storyfinder/:id',
      element: <StoryCollectionPage />,
    },
    {
      path: 'storyfinder/:id/candidate/:cid',
      element: <CandidateProfilePage />,
    },
    {
      path: 'storyfinder/:id/candidate/:cid/story',
      element: <GeneratedStoryPage />,
    },
    {
      path: 'storyfinder/:id/candidate/:cid/story/edit',
      element: <StoryEditor />,
    },
  ],
};

export default studioRoutes;
