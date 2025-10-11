import { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

type AppRole = 'admin' | 'manager' | 'broker' | 'viewer';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  fallback?: ReactNode;
  showAlert?: boolean;
}

export const RoleGuard = ({ 
  children, 
  allowedRoles = [], 
  fallback,
  showAlert = false 
}: RoleGuardProps) => {
  const { hasAnyRole } = usePermission();

  if (!hasAnyRole(allowedRoles)) {
    if (showAlert) {
      return (
        <Alert variant="destructive" className="my-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar este conteúdo.
          </AlertDescription>
        </Alert>
      );
    }
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};
