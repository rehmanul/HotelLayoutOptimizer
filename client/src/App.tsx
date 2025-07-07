import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout";
import NotFound from "@/pages/not-found";
import Analyzer from "@/pages/analyzer";
import Results from "@/pages/results";
import Visualization from "@/pages/visualization";
import AIOptimization from "@/pages/ai-optimization";
import Analytics from "@/pages/analytics";
import Collaboration from "@/pages/collaboration";
import Reports from "@/pages/reports";
import Admin from "@/pages/admin";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Analyzer} />
        <Route path="/analyzer" component={Analyzer} />
        <Route path="/results" component={Results} />
        <Route path="/visualization" component={Visualization} />
        <Route path="/ai-optimization" component={AIOptimization} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/collaboration" component={Collaboration} />
        <Route path="/reports" component={Reports} />
        <Route path="/admin" component={Admin} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
