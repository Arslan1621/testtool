import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Shield, Zap, FileCode, Unplug, ChevronDown, Home, Users, BookOpen, Mail, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserButton, SignedIn, SignedOut } from "@clerk/clerk-react";

const tools = [
  { label: "Redirect Checker", href: "/redirect-checker", icon: Zap, description: "Trace redirect chains" },
  { label: "Security Checker", href: "/security-checker", icon: Shield, description: "Audit security headers" },
  { label: "Robots.txt Validator", href: "/robots-txt", icon: FileCode, description: "Validate robots.txt" },
  { label: "Broken Link Checker", href: "/broken-links", icon: Unplug, description: "Find broken links" },
  { label: "WHOIS Lookup", href: "/whois-checker", icon: Globe, description: "Domain registration info" },
];

export function Navbar() {
  const [location] = useLocation();
  const [toolsOpen, setToolsOpen] = useState(false);

  const isToolPage = tools.some(t => t.href === location);

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer group" data-testid="link-logo">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight text-foreground">
                  WebTools<span className="text-primary">.io</span>
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link href="/">
                <div 
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2",
                    location === "/" 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  data-testid="link-home"
                >
                  <Home className="w-4 h-4" />
                  Home
                </div>
              </Link>

              <div 
                className="relative"
                onMouseEnter={() => setToolsOpen(true)}
                onMouseLeave={() => setToolsOpen(false)}
              >
                <button
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2",
                    isToolPage 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  data-testid="button-tools-menu"
                >
                  <Search className="w-4 h-4" />
                  Tools
                  <ChevronDown className={cn("w-4 h-4 transition-transform", toolsOpen && "rotate-180")} />
                </button>

                <div 
                  className={cn(
                    "absolute top-full left-0 mt-1 w-64 bg-background border border-border rounded-lg shadow-xl overflow-hidden transition-all duration-200 z-50",
                    toolsOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
                  )}
                >
                  <div className="p-2">
                    {tools.map((tool) => (
                      <Link key={tool.href} href={tool.href}>
                        <div 
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors",
                            location === tool.href 
                              ? "bg-primary/10 text-primary" 
                              : "text-foreground hover:bg-muted"
                          )}
                          data-testid={`link-tool-${tool.href.replace('/', '')}`}
                        >
                          <tool.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-sm text-foreground">{tool.label}</div>
                            <div className="text-xs text-muted-foreground">{tool.description}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <Link href="/about">
                <div 
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2",
                    location === "/about" 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  data-testid="link-about"
                >
                  <Users className="w-4 h-4" />
                  About Us
                </div>
              </Link>

              <Link href="/blog">
                <div 
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2",
                    location === "/blog" 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  data-testid="link-blog"
                >
                  <BookOpen className="w-4 h-4" />
                  Blog
                </div>
              </Link>

              <Link href="/contact">
                <div 
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2",
                    location === "/contact" 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  data-testid="link-contact"
                >
                  <Mail className="w-4 h-4" />
                  Contact Us
                </div>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <SignedOut>
              <Link href="/sign-in">
                <button 
                  className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors"
                  data-testid="button-signin"
                >
                  Sign In
                </button>
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
}
