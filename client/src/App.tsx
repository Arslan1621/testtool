import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import DomainReport from "@/pages/DomainReport";
import RedirectChecker from "@/pages/RedirectChecker";
import SecurityHeaderChecker from "@/pages/SecurityHeaderChecker";
import RobotsTxtTool from "@/pages/RobotsTxtTool";
import BrokenLinkChecker from "@/pages/BrokenLinkChecker";
import WhoisChecker from "@/pages/WhoisChecker";
import About from "@/pages/About";
import Blog from "@/pages/Blog";
import Contact from "@/pages/Contact";
import { SignInPage, SignUpPage } from "@/pages/Auth";
import { Navbar } from "@/components/Navbar";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/redirect-checker" component={RedirectChecker} />
      <Route path="/security-checker" component={SecurityHeaderChecker} />
      <Route path="/robots-txt" component={RobotsTxtTool} />
      <Route path="/broken-links" component={BrokenLinkChecker} />
      <Route path="/whois-checker" component={WhoisChecker} />
      <Route path="/about" component={About} />
      <Route path="/blog" component={Blog} />
      <Route path="/contact" component={Contact} />
      {/* Route for handling /google.com pattern */}
      <Route path="/:domain" component={DomainReport} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Navbar />
            <main>
              <Router />
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
