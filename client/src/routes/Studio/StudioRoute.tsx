import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthContext } from '~/hooks/AuthContext';
import StudioLayout from '~/components/Studio/Layout/Layout';
import { BreadcrumbProvider } from '~/components/Studio/Layout/BreadcrumbContext';

export default function StudioRoute() {
  const { isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <BreadcrumbProvider>
      <StudioLayout>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          <Outlet />
        </Suspense>
      </StudioLayout>
    </BreadcrumbProvider>
  );
}
