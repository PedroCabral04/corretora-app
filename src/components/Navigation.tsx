import { Button } from "@/components/ui/button";
import { Users, CheckSquare, Home, LogOut, Calendar as CalendarIcon, Shield } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const roleLabels = {
  admin: { label: 'Admin', variant: 'destructive' as const },
  manager: { label: 'Gerente', variant: 'default' as const },
  broker: { label: 'Corretor', variant: 'secondary' as const },
  viewer: { label: 'Visualizador', variant: 'outline' as const },
};

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermission();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="flex items-center mr-2">
              <Home className="h-6 w-6 text-primary" />
              <h1 className="ml-2 text-xl font-bold text-foreground hidden sm:block">CorretoraApp</h1>
            </div>

            {/* Desktop Links */}
            <div className="hidden sm:flex items-center space-x-4">
              <Button
                variant={isActive("/") ? "default" : "ghost"}
                onClick={() => navigate("/")}
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Corretores</span>
              </Button>

              <Button
                variant={isActive("/tasks") ? "default" : "ghost"}
                onClick={() => navigate("/tasks")}
                className="flex items-center space-x-2"
              >
                <CheckSquare className="h-4 w-4" />
                <span>Tarefas</span>
              </Button>

              <Button
                variant={isActive("/agenda") ? "default" : "ghost"}
                onClick={() => navigate("/agenda")}
                className="flex items-center space-x-2"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Agenda</span>
              </Button>

              {hasPermission('manage_users') && (
                <Button
                  variant={isActive("/users") ? "default" : "ghost"}
                  onClick={() => navigate("/users")}
                  className="flex items-center space-x-2"
                >
                  <Shield className="h-4 w-4" />
                  <span>Usuários</span>
                </Button>
              )}
            </div>

            {/* Mobile menu (hamburger) */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-44" align="end" forceMount>
                  <DropdownMenuItem onClick={() => navigate('/')}>Corretores</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/tasks')}>Tarefas</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/agenda')}>Agenda</DropdownMenuItem>
                  {hasPermission('manage_users') && (
                    <DropdownMenuItem onClick={() => navigate('/users')}>Usuários</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right-side actions: show Register/Login when no user, otherwise avatar menu */}
            <div className="flex items-center space-x-2">
              {!user ? (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')}>Entrar</Button>
                  <Button onClick={() => navigate('/register')}>Registrar</Button>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user ? getUserInitials(user.name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                        {user?.role && (
                          <Badge variant={roleLabels[user.role].variant} className="text-xs w-fit mt-1">
                            <Shield className="w-3 h-3 mr-1" />
                            {roleLabels[user.role].label}
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};