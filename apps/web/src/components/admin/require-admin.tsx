import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminSession } from '@/hooks/use-admin-auth';

export function RequireAdmin({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data, isLoading, isError } = useAdminSession();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Checking your session…
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
