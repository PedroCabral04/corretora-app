import { Button } from "@/components/ui/button";
import { Users, CheckSquare, Home } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Home className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">CorretoraApp</h1>
          </div>
          
          <div className="flex space-x-4">
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
          </div>
        </div>
      </div>
    </nav>
  );
};