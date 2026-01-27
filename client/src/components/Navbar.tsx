import { Link, useLocation } from "wouter";
import { BarChart3, Search, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { label: "Dashboard", href: "/", icon: BarChart3 },
    { label: "Redirect Checker", href: "/redirect-checker", icon: Zap },
    { label: "Security Checker", href: "/security-checker", icon: Shield },
  ];

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer group">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight text-foreground">
                  WebTools<span className="text-primary">.io</span>
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2",
                    location === item.href 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </button>
            <button className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
