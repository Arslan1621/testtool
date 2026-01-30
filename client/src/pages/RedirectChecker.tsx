import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Loader2, AlertCircle, CheckCircle2, ArrowDown, ExternalLink, Globe, List, ChevronDown, ChevronUp } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import type { RedirectHop } from "@shared/schema";
import { useAuth } from "@clerk/clerk-react";
import { useLocation } from "wouter";

interface BulkRedirectResult {
  url: string;
  hops: RedirectHop[];
  error?: string;
}

export default function RedirectChecker() {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [singleUrl, setSingleUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const { isSignedIn } = useAuth();
  const [, navigate] = useLocation();

  const handleBulkModeClick = () => {
    if (!isSignedIn) {
      navigate("/sign-up");
      return;
    }
    setMode("bulk");
  };

  const { mutate: checkRedirects, isPending, data: results } = useMutation<BulkRedirectResult[]>({
    mutationFn: async () => {
      let urlList: string[];
      
      if (mode === "single") {
        if (!singleUrl.trim()) {
          throw new Error("Please enter a URL");
        }
        urlList = [singleUrl.trim()];
      } else {
        urlList = bulkUrls
          .split('\n')
          .map(u => u.trim())
          .filter(u => u.length > 0);
        
        if (urlList.length === 0) {
          throw new Error("Please enter at least one URL");
        }
      }

      const response = await apiRequest("POST", "/api/redirect-check", { urls: urlList });
      return response.json();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkRedirects();
  };

  const urlCount = mode === "single" ? (singleUrl.trim() ? 1 : 0) : bulkUrls.split('\n').filter(u => u.trim()).length;

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (status >= 300 && status < 400) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    if (status >= 400) return "bg-red-500/10 text-red-600 border-red-500/20";
    return "bg-slate-500/10 text-slate-600 border-slate-500/20";
  };

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status >= 300 && status < 400) return <ArrowRight className="w-4 h-4 text-amber-500" />;
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative overflow-hidden bg-black text-white pb-16 pt-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-amber-100 to-amber-200">
              Redirect Checker
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto"
          >
            Trace redirect chains, identify loops, and catch SEO issues before they impact your rankings.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-2xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="text-left">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Check Redirects
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  {mode === "single" ? "Enter a single URL to check" : "Enter multiple URLs, one per line"}
                </p>
              </div>
              <div className="flex items-center bg-white/10 rounded-lg p-1">
                <button
                  type="button"
                  data-testid="button-mode-single"
                  onClick={() => setMode("single")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === "single" 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Single URL
                </button>
                <button
                  type="button"
                  data-testid="button-mode-bulk"
                  onClick={handleBulkModeClick}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === "bulk" 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <List className="w-4 h-4" />
                  Bulk URLs
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "single" ? (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    data-testid="input-single-url"
                    placeholder="https://example.com"
                    value={singleUrl}
                    onChange={(e) => setSingleUrl(e.target.value)}
                    className="pl-10 h-12 text-base bg-white text-slate-900 border-0 focus-visible:ring-2 ring-primary"
                  />
                </div>
              ) : (
                <Textarea
                  data-testid="input-bulk-urls"
                  placeholder={"https://example.com\nhttps://example.org/page\nhttps://test.com/redirect\n\nEnter one URL per line..."}
                  value={bulkUrls}
                  onChange={(e) => setBulkUrls(e.target.value)}
                  className="min-h-[200px] font-mono text-sm bg-white text-slate-900 border-0 focus-visible:ring-2 ring-primary"
                />
              )}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  {urlCount > 0 && (
                    <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                      {urlCount} URL{urlCount > 1 ? 's' : ''} to check
                    </Badge>
                  )}
                  {mode === "bulk" && (
                    <span className="text-xs text-slate-300">Unlimited URLs supported</span>
                  )}
                </div>
                <Button 
                  data-testid="button-check-redirects"
                  disabled={isPending || urlCount === 0}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking {urlCount} URL{urlCount > 1 ? 's' : ''}...
                    </>
                  ) : (
                    <>
                      Check Redirect{urlCount > 1 ? 's' : ''}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {results && results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
          >
            <h2 className="text-2xl font-bold font-display flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              Results ({results.length} URL{results.length > 1 ? 's' : ''})
            </h2>

            {results.map((result, index) => (
              <Card key={index} className="overflow-hidden" data-testid={`card-result-${index}`}>
                <CardHeader className="bg-muted/50 pb-3">
                  <CardTitle className="text-base font-mono flex items-center gap-2 flex-wrap">
                    <span className="text-muted-foreground text-sm">#{index + 1}</span>
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors flex items-center gap-1"
                    >
                      {result.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {result.hops.length > 1 && (
                      <Badge variant="secondary" className="ml-auto">
                        {result.hops.length - 1} redirect{result.hops.length - 1 > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {result.hops.length === 1 && result.hops[0].status >= 200 && result.hops[0].status < 300 && (
                      <Badge variant="outline" className="ml-auto border-emerald-500/30 text-emerald-600">
                        No redirects
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {result.error ? (
                    <div className="flex items-center gap-2 text-red-500">
                      <AlertCircle className="w-4 h-4" />
                      <span>{result.error}</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {result.hops.map((hop, hopIndex) => (
                        <HopDetails 
                          key={hopIndex} 
                          hop={hop} 
                          hopIndex={hopIndex} 
                          isLast={hopIndex === result.hops.length - 1}
                          getStatusColor={getStatusColor}
                          getStatusIcon={getStatusIcon}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Educational Content Section */}
        <div className="mt-16 space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold font-display text-foreground mb-4">Understanding Redirects</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Learn how redirects work, common errors, and best practices for SEO
            </p>
          </div>

          {/* What is Redirect Checker */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                What is a Redirect Checker?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                A Redirect Checker is a tool that traces the complete path a URL takes from the initial request to its final destination. When you enter a URL, it follows all redirects in sequence, showing you each step (or "hop") along the way.
              </p>
              <p>
                Redirects are server instructions that automatically send users and search engines from one URL to another. They're commonly used when pages move, websites migrate, or URLs are restructured. Understanding your redirect chains is crucial for maintaining good SEO and user experience.
              </p>
            </CardContent>
          </Card>

          {/* How it Works */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-primary" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ol className="list-decimal list-inside space-y-3">
                <li><strong>Enter a URL:</strong> Provide the URL you want to check. The tool accepts both HTTP and HTTPS URLs.</li>
                <li><strong>Follow the Chain:</strong> The tool makes a request to your URL and follows each redirect automatically, recording the HTTP status code and destination at each step.</li>
                <li><strong>View Results:</strong> See the complete redirect chain visualized, including all intermediate hops, status codes, and response headers.</li>
                <li><strong>Identify Issues:</strong> Spot problems like redirect loops, unnecessary hops, or incorrect status codes that could hurt your SEO.</li>
              </ol>
            </CardContent>
          </Card>

          {/* Common Errors */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Common Redirect Errors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-foreground">301 - Moved Permanently</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    The URL has permanently moved to a new location. Search engines will transfer SEO value to the new URL. This is the recommended redirect for permanent URL changes.
                  </p>
                </div>

                <div className="border-l-4 border-amber-500 pl-4">
                  <h4 className="font-semibold text-foreground">302 - Found (Temporary Redirect)</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    The URL is temporarily redirected. Search engines may not transfer SEO value. Use this only for genuinely temporary redirects, like during maintenance.
                  </p>
                </div>

                <div className="border-l-4 border-amber-500 pl-4">
                  <h4 className="font-semibold text-foreground">307 - Temporary Redirect</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    Similar to 302, but guarantees the request method won't change. The browser will repeat the exact same request to the new URL.
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-foreground">308 - Permanent Redirect</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    Similar to 301, but guarantees the request method won't change. Useful for APIs and form submissions that need permanent redirects.
                  </p>
                </div>

                <div className="border-l-4 border-red-600 pl-4">
                  <h4 className="font-semibold text-foreground">404 - Not Found</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    The requested URL doesn't exist. If this appears in a redirect chain, the chain is broken and users will see an error page.
                  </p>
                </div>

                <div className="border-l-4 border-red-600 pl-4">
                  <h4 className="font-semibold text-foreground">500 - Internal Server Error</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    The server encountered an error processing the redirect. This indicates a server-side problem that needs immediate attention.
                  </p>
                </div>

                <div className="border-l-4 border-red-600 pl-4">
                  <h4 className="font-semibold text-foreground">Redirect Loop</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    URL A redirects to URL B, which redirects back to URL A. This creates an infinite loop that browsers will stop after several attempts, showing an error.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How to Resolve */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                How to Resolve Redirect Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Too Many Redirects</h4>
                  <p className="text-sm">Reduce redirect chains to a maximum of 1-2 hops. Update old redirects to point directly to the final destination.</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Wrong Redirect Type</h4>
                  <p className="text-sm">Use 301 for permanent moves and 302/307 only for temporary changes. Incorrect usage can hurt SEO rankings.</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Redirect Loops</h4>
                  <p className="text-sm">Map out your redirect rules and ensure no circular references exist. Check .htaccess, nginx config, or application code.</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Mixed HTTP/HTTPS</h4>
                  <p className="text-sm">Ensure all redirects go to HTTPS versions. Avoid HTTP to HTTPS to HTTP chains that waste redirect hops.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function HopDetails({ 
  hop, 
  hopIndex, 
  isLast, 
  getStatusColor, 
  getStatusIcon 
}: { 
  hop: RedirectHop; 
  hopIndex: number; 
  isLast: boolean;
  getStatusColor: (status: number) => string;
  getStatusIcon: (status: number) => JSX.Element;
}) {
  const [showHeaders, setShowHeaders] = useState(false);
  const headers = hop.headers || {};
  const headerEntries = Object.entries(headers).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="relative">
      <div className="rounded-lg bg-muted/30 border border-border overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon(hop.status)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={getStatusColor(hop.status)}>
                {hop.status}
              </Badge>
              <span className="font-mono text-sm break-all">
                {hop.url}
              </span>
            </div>
            {hop.headers?.location && (
              <p className="text-xs text-muted-foreground mt-2">
                Redirects to: <span className="font-mono">{hop.headers.location}</span>
              </p>
            )}
          </div>
        </div>
        
        {headerEntries.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowHeaders(!showHeaders)}
              className="w-full flex items-center justify-between px-4 py-2 bg-muted/50 border-t border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid={`button-toggle-headers-${hopIndex}`}
            >
              <span className="flex items-center gap-2">
                <span className="font-medium">Response Headers</span>
                <Badge variant="secondary" className="text-xs">{headerEntries.length}</Badge>
              </span>
              {showHeaders ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {showHeaders && (
              <div className="border-t border-border bg-background/50">
                <div className="max-h-[400px] overflow-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {headerEntries.map(([key, value], idx) => (
                        <tr 
                          key={key} 
                          className={idx % 2 === 0 ? "bg-muted/20" : ""}
                        >
                          <td className="px-4 py-2 font-mono text-xs font-medium text-primary whitespace-nowrap align-top border-r border-border">
                            {key}
                          </td>
                          <td className="px-4 py-2 font-mono text-xs text-foreground break-all">
                            {value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {!isLast && (
        <div className="flex justify-center py-2">
          <ArrowDown className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
