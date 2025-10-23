import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

type AppRole = 'admin' | 'manager' | 'broker' | 'viewer';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  allowedEmails?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles, allowedEmails }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasAnyRole } = usePermission();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (allowedEmails && (!user?.email || !allowedEmails.some(email => email.toLowerCase() === user.email.toLowerCase()))) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};