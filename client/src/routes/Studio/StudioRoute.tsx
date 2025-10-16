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
        <Outlet />
      </StudioLayout>
    </BreadcrumbProvider>
  );
}
