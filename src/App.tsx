import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrokersProvider } from "@/contexts/BrokersContext";
import { EventsProvider } from "@/contexts/EventsContext";
import { TasksProvider } from "@/contexts/TasksContext";
import { SalesProvider } from "@/contexts/SalesContext";
import { ListingsProvider } from "@/contexts/ListingsContext";
import { MeetingsProvider } from "@/contexts/MeetingsContext";
import { ExpensesProvider } from "@/contexts/ExpensesContext";
import { ClientsProvider } from "@/contexts/ClientsContext";
import { GoalsProvider } from "@/contexts/GoalsContext";
import { PerformanceChallengesProvider } from "@/contexts/PerformanceChallengesContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProvider } from "@/contexts/AdminContext";
import { OWNER_EMAILS } from "@/config/adminConfig";
import Index from "./pages/Index";
import ManagerDashboard from "./pages/shared/Dashboard";
import BrokerDashboard from "./pages/broker/BrokerDashboard";
import Brokers from "./pages/manager/Brokers";
import BrokerDetails from "./pages/BrokerDetails";
import Tasks from "./pages/shared/Tasks";
import Agenda from "./pages/shared/Agenda";
import Goals from "./pages/shared/Goals";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { useAuth } from "@/contexts/AuthContext";
import AdminPanel from "./pages/admin/AdminPanel";

const queryClient = new QueryClient();

// Dashboard Wrapper - mostra dashboard baseado no role
const Dashboard = () => {
  const { user } = useAuth();
  
  if (user?.role === 'broker') {
    return <BrokerDashboard />;
  }
  
  return <ManagerDashboard />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <AdminProvider>
          <BrokersProvider>
          <EventsProvider>
            <TasksProvider>
              <SalesProvider>
                <ListingsProvider>
                  <MeetingsProvider>
                    <ExpensesProvider>
                      <ClientsProvider>
                        <GoalsProvider>
                          <PerformanceChallengesProvider>
                            <NotificationsProvider>
                            <TooltipProvider>
                              <Toaster />
                              <Sonner />
                              <BrowserRouter>
                          <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/" element={
                              <ProtectedRoute>
                                <Index />
                              </ProtectedRoute>
                            } />
                            <Route path="/dashboard" element={
                              <ProtectedRoute>
                                <Dashboard />
                              </ProtectedRoute>
                            } />
                            <Route path="/brokers" element={
                              <ProtectedRoute>
                                <Brokers />
                              </ProtectedRoute>
                            } />
                            <Route path="/broker/:brokerId" element={
                              <ProtectedRoute>
                                <BrokerDetails />
                              </ProtectedRoute>
                            } />
                            <Route path="/tasks" element={
                              <ProtectedRoute>
                                <Tasks />
                              </ProtectedRoute>
                            } />
              <Route path="/agenda" element={
                <ProtectedRoute>
                  <Agenda />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute
                  allowedRoles={['admin']}
                  allowedEmails={OWNER_EMAILS.length > 0 ? OWNER_EMAILS : undefined}
                >
                  <AdminPanel />
                </ProtectedRoute>
              } />
              <Route path="/goals" element={
                <ProtectedRoute>
                  <Goals />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
                          </Routes>
                        </BrowserRouter>
                      </TooltipProvider>
                    </NotificationsProvider>
                  </PerformanceChallengesProvider>
                </GoalsProvider>
                </ClientsProvider>
              </ExpensesProvider>
            </MeetingsProvider>
          </ListingsProvider>
        </SalesProvider>
      </TasksProvider>
    </EventsProvider>
  </BrokersProvider>
</AdminProvider>
</AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
