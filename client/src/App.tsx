import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import DomainReport from "@/pages/DomainReport";
import RedirectChecker from "@/pages/RedirectChecker";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/redirect-checker" component={RedirectChecker} />
      {/* Route for handling /google.com pattern */}
      <Route path="/:domain" component={DomainReport} />
      <Route component={NotFound} />
    </Switch>
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
