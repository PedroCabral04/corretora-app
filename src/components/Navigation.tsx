import { Button } from "@/components/ui/button";
import { Users, CheckSquare, Home, LogOut, Calendar as CalendarIcon, Shield, Menu, User2, Moon, Sun, Target } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { NotificationBell } from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const roleLabels = {
  admin: { label: 'Admin', variant: 'destructive' as const, color: 'bg-red-500' },
  manager: { label: 'Gerente', variant: 'default' as const, color: 'bg-blue-500' },
  broker: { label: 'Corretor', variant: 'secondary' as const, color: 'bg-purple-500' },
  viewer: { label: 'Visualizador', variant: 'outline' as const, color: 'bg-gray-500' },
};

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Claro</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Escuro</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Users className="mr-2 h-4 w-4" />
          <span>Sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/brokers", label: "Corretores", icon: Users },
    { path: "/tasks", label: "Tarefas", icon: CheckSquare },
    { path: "/agenda", label: "Agenda", icon: CalendarIcon },
    { path: "/goals", label: "Metas", icon: Target },
    ...(hasPermission('manage_users') ? [{ path: "/users", label: "Usuários", icon: Shield }] : []),
  ];

  return (
    <nav className="bg-card/95 backdrop-blur-md border-b border-border/40 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center space-x-2 group transition-all duration-200 hover:scale-105"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover:blur-lg transition-all"></div>
                <div className="relative bg-gradient-to-br from-primary to-accent p-2 rounded-lg shadow-md">
                  <Home className="h-5 w-5 text-white" />
                </div>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:block">
                CorretoraApp
              </h1>
            </button>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "relative flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
                      "hover:bg-accent/10 hover:scale-105",
                      active
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active && "animate-pulse")} />
                    <span className="text-sm">{item.label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Side - User Menu and Mobile Nav */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <NotificationBell />
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Mobile Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(isActive(item.path) && "bg-primary/10 text-primary")}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* User Section */}
            {!user ? (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')}
                  className="hidden sm:flex"
                >
                  Entrar
                </Button>
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                >
                  Registrar
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
                    <div className="relative">
                      <Avatar className="h-9 w-9 border-2 border-background ring-2 ring-primary/20 transition-all group-hover:ring-primary/40">
                        <AvatarFallback className={cn(
                          "text-white font-semibold text-sm",
                          user?.role ? roleLabels[user.role].color : "bg-primary"
                        )}>
                          {user ? getUserInitials(user.name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal pb-3">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-12 w-12 mt-0.5">
                        <AvatarFallback className={cn(
                          "text-white font-semibold",
                          user?.role ? roleLabels[user.role].color : "bg-primary"
                        )}>
                          {user ? getUserInitials(user.name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1.5 flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-none truncate">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user?.email}
                        </p>
                        {user?.role && (
                          <Badge 
                            variant={roleLabels[user.role].variant} 
                            className="text-xs w-fit mt-1"
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            {roleLabels[user.role].label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};