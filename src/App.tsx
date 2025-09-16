import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrokersProvider } from "@/contexts/BrokersContext";
import { EventsProvider } from "@/contexts/EventsContext";
import { TasksProvider } from "@/contexts/TasksContext";
import { SalesProvider } from "@/contexts/SalesContext";
import { ListingsProvider } from "@/contexts/ListingsContext";
import { MeetingsProvider } from "@/contexts/MeetingsContext";
import { ExpensesProvider } from "@/contexts/ExpensesContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import BrokerDetails from "./pages/BrokerDetails";
import Tasks from "./pages/Tasks";
import Agenda from "./pages/Agenda";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrokersProvider>
        <EventsProvider>
          <TasksProvider>
            <SalesProvider>
              <ListingsProvider>
                <MeetingsProvider>
                  <ExpensesProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      <BrowserRouter>
                        <Routes>
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route path="/forgot-password" element={<ForgotPassword />} />
                          <Route path="/" element={
                            <ProtectedRoute>
                              <Index />
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
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </BrowserRouter>
                    </TooltipProvider>
                  </ExpensesProvider>
                </MeetingsProvider>
              </ListingsProvider>
            </SalesProvider>
          </TasksProvider>
        </EventsProvider>
      </BrokersProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
