import { useState } from "react";
import { useDomains, useRunScan } from "@/hooks/use-domains";
import { Navbar } from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowRight, Globe, Link as LinkIcon, Lock, Search, FileText, Activity, Zap, Shield, FileCode, Unplug } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  const [url, setUrl] = useState("");
  const [tools, setTools] = useState({
    redirect: true,
    broken_links: true,
    security: true,
    robots: true,
    ai: true,
  });

  const { data: recentScans } = useDomains();
  const { mutate: runScan, isPending } = useRunScan();
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    // Basic URL cleanup
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const selectedTools = Object.entries(tools)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key) as ("redirect" | "broken_links" | "security" | "robots")[];

    if (selectedTools.length === 0) return;

    runScan({ url: cleanUrl, tools: selectedTools });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 text-white pb-24 pt-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-display font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-200"
          >
            Master Your Technical SEO
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-300 mb-12 max-w-2xl mx-auto"
          >
            Comprehensive analysis for redirects, broken links, security headers, and robots.txt in one powerful dashboard.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input 
                    placeholder="Enter domain (e.g., example.com)" 
                    className="pl-10 h-14 bg-white text-slate-900 border-0 focus-visible:ring-2 ring-primary text-lg"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <Button 
                  size="lg" 
                  disabled={isPending}
                  className="h-14 px-8 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                >
                  {isPending ? "Scanning..." : "Analyze Site"}
                  {!isPending && <ArrowRight className="ml-2 w-5 h-5" />}
                </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <Checkbox 
                    checked={tools.redirect}
                    onCheckedChange={(c) => setTools(prev => ({ ...prev, redirect: c === true }))}
                    className="border-white/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="text-slate-300 group-hover:text-white transition-colors">Redirect Chains</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <Checkbox 
                    checked={tools.broken_links}
                    onCheckedChange={(c) => setTools(prev => ({ ...prev, broken_links: c === true }))}
                    className="border-white/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="text-slate-300 group-hover:text-white transition-colors">Broken Links</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <Checkbox 
                    checked={tools.security}
                    onCheckedChange={(c) => setTools(prev => ({ ...prev, security: c === true }))}
                    className="border-white/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="text-slate-300 group-hover:text-white transition-colors">Security Headers</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <Checkbox 
                    checked={tools.robots}
                    onCheckedChange={(c) => setTools(prev => ({ ...prev, robots: c === true }))}
                    className="border-white/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="text-slate-300 group-hover:text-white transition-colors">Robots.txt</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <Checkbox 
                    checked={tools.ai}
                    onCheckedChange={(c) => setTools(prev => ({ ...prev, ai: c === true }))}
                    className="border-white/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="text-slate-300 group-hover:text-white transition-colors">AI Summary</span>
                </label>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ToolFeatureCard 
            icon={<Zap className="w-6 h-6 text-amber-500" />}
            title="Redirect Checker"
            description="Visualize redirect chains and catch loops before they hurt SEO."
            href="/redirect-checker"
          />
          <ToolFeatureCard 
            icon={<Unplug className="w-6 h-6 text-emerald-500" />}
            title="Broken Link Finder"
            description="Scan pages for 404 errors and broken anchors instantly."
            href="/broken-links"
          />
          <ToolFeatureCard 
            icon={<Shield className="w-6 h-6 text-purple-500" />}
            title="Security Audit"
            description="Verify SSL, HSTS, CSP and other critical security headers."
            href="/security-checker"
          />
          <ToolFeatureCard 
            icon={<FileCode className="w-6 h-6 text-blue-500" />}
            title="Robots.txt Validator"
            description="Ensure your robots.txt file is valid and discoverable."
            href="/robots-txt"
          />
          <ToolFeatureCard 
            icon={<Globe className="w-6 h-6 text-indigo-500" />}
            title="WHOIS Lookup"
            description="Look up domain registration details, owner info, and name servers."
            href="/whois-checker"
          />
          <ToolFeatureCard 
            icon={<Search className="w-6 h-6 text-rose-500" />}
            title="AI Summary & SEO"
            description="Get an AI-generated summary, services list, and SEO recommendations."
          />
        </div>

        {/* Recent Scans */}
        <div className="mt-20">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold font-display">Recent Analyses</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentScans?.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-muted/50 rounded-xl border border-dashed border-border">
                <p className="text-muted-foreground">No recent scans found. Start by analyzing a URL above.</p>
              </div>
            ) : (
              recentScans?.map((domain) => (
                <div 
                  key={domain.id} 
                  onClick={() => setLocation(`/${domain.domain}`)}
                  className="group bg-card hover:bg-accent/5 rounded-xl p-5 border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {domain.domain}
                    </h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {domain.lastScannedAt ? formatDistanceToNow(new Date(domain.lastScannedAt)) + ' ago' : 'Just now'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {domain.redirectData && <Badge>Redirects</Badge>}
                    {domain.securityData && <Badge>Security</Badge>}
                    {domain.brokenLinksData && <Badge>Links</Badge>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolFeatureCard({ icon, title, description, href }: { icon: React.ReactNode, title: string, description: string, href?: string }) {
  const content = (
    <div className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl hover:border-primary/50 transition-all duration-300 h-full cursor-pointer group">
      <div className="h-12 w-12 rounded-lg bg-background border border-border flex items-center justify-center mb-4 shadow-sm group-hover:border-primary/30 transition-colors">
        {icon}
      </div>
      <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} data-testid={`link-tool-card-${href.replace('/', '')}`}>
        {content}
      </Link>
    );
  }

  return content;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
      {children}
    </span>
  );
}
