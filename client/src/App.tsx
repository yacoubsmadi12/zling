import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Pages
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import Learn from "@/pages/Learn";
import FlashcardsPage from "@/pages/FlashcardsPage";
import QuizCenter from "@/pages/QuizCenter";
import QuizRunner from "@/pages/QuizRunner";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected Routes */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/learn" component={Learn} />
      <ProtectedRoute path="/flashcards/:department" component={FlashcardsPage} />
      <ProtectedRoute path="/quiz" component={QuizCenter} />
      <ProtectedRoute path="/quiz/:mode" component={QuizRunner} />
      <ProtectedRoute path="/leaderboard" component={Leaderboard} />
      <ProtectedRoute path="/profile" component={Profile} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
