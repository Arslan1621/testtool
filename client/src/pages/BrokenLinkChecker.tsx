import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Link2, Loader2, AlertCircle, CheckCircle2, Globe, XCircle, ExternalLink, Unplug } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/clerk-react";
import { useLocation } from "wouter";

interface LinkResult {
  url: string;
  status: number;
  ok: boolean;
  anchorText?: string;
  error?: string;
}

interface SingleLinkResult {
  url: string;
  status: number;
  ok: boolean;
  error?: string;
}

interface WebsiteScanResult {
  url: string;
  totalLinks: number;
  checkedLinks: number;
  brokenLinks: LinkResult[];
  workingLinks: LinkResult[];
  error?: string;
}

export default function BrokenLinkChecker() {
  const [mode, setMode] = useState<"single" | "website">("single");
  const [url, setUrl] = useState("");
  const { isSignedIn } = useAuth();
  const [, navigate] = useLocation();

  const handleWebsiteModeClick = () => {
    if (!isSignedIn) {
      navigate("/sign-up");
      return;
    }
    setMode("website");
  };

  const { mutate: checkSingleLink, isPending: isSinglePending, data: singleResult, error: singleError } = useMutation<SingleLinkResult>({
    mutationFn: async () => {
      if (!url.trim()) {
        throw new Error("Please enter a URL");
      }
      
      let checkUrl = url.trim();
      if (!checkUrl.startsWith("http://") && !checkUrl.startsWith("https://")) {
        checkUrl = "https://" + checkUrl;
      }

      const response = await apiRequest("POST", "/api/link-check", { url: checkUrl });
      return response.json();
    }
  });

  const { mutate: scanWebsite, isPending: isWebsitePending, data: websiteResult, error: websiteError } = useMutation<WebsiteScanResult>({
    mutationFn: async () => {
      if (!url.trim()) {
        throw new Error("Please enter a URL");
      }
      
      let checkUrl = url.trim();
      if (!checkUrl.startsWith("http://") && !checkUrl.startsWith("https://")) {
        checkUrl = "https://" + checkUrl;
      }

      const response = await apiRequest("POST", "/api/website-link-check", { url: checkUrl });
      return response.json();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "single") {
      checkSingleLink();
    } else {
      scanWebsite();
    }
  };

  const isPending = mode === "single" ? isSinglePending : isWebsitePending;
  const error = mode === "single" ? singleError : websiteError;

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (status >= 300 && status < 400) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    if (status >= 400) return "bg-red-500/10 text-red-600 border-red-500/20";
    return "bg-slate-500/10 text-slate-600 border-slate-500/20";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative overflow-hidden bg-slate-900 text-white pb-24 pt-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Unplug className="w-6 h-6 text-red-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-red-100 to-red-200">
              Broken Link Checker
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto"
          >
            Find broken links on your website to improve user experience and SEO rankings.
          </motion.p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <Card className="shadow-xl border-border overflow-hidden bg-card">
          <CardHeader className="pb-4 bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Unplug className="w-5 h-5 text-red-500" />
                  Check Broken Links
                </CardTitle>
                <CardDescription className="mt-1">
                  {mode === "single" ? "Check if a single URL is accessible" : "Scan a webpage for all broken links"}
                </CardDescription>
              </div>
              <div className="flex items-center bg-muted rounded-lg p-1">
                <button
                  type="button"
                  data-testid="button-mode-single"
                  onClick={() => setMode("single")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === "single" 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  Single Link
                </button>
                <button
                  type="button"
                  data-testid="button-mode-website"
                  onClick={handleWebsiteModeClick}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === "website" 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Full Website
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  data-testid="input-url"
                  placeholder={mode === "single" ? "https://example.com/page" : "https://example.com"}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <p className="text-xs text-muted-foreground">
                  {mode === "single" 
                    ? "Check if a specific URL returns a valid response" 
                    : "Scans all links found on the page"}
                </p>
                <Button 
                  data-testid="button-check"
                  disabled={isPending || !url.trim()}
                  size="lg"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {mode === "single" ? "Checking..." : "Scanning..."}
                    </>
                  ) : (
                    <>
                      {mode === "single" ? "Check Link" : "Scan Website"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="w-5 h-5" />
                  <span>{(error as Error).message}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {mode === "single" && singleResult && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
          >
            <h2 className="text-2xl font-bold font-display flex items-center gap-2">
              <Link2 className="w-6 h-6 text-red-500" />
              Link Status
            </h2>

            <Card className="overflow-hidden" data-testid="card-single-result">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    {singleResult.ok ? (
                      <div className="p-2 rounded-full bg-emerald-500/10">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-full bg-red-500/10">
                        <XCircle className="w-6 h-6 text-red-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-mono text-sm break-all">{singleResult.url}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {singleResult.ok ? "Link is working correctly" : singleResult.error || "Link is broken or inaccessible"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(singleResult.status)}>
                    HTTP {singleResult.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {mode === "website" && websiteResult && !websiteResult.error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-2xl font-bold font-display flex items-center gap-2">
                <Globe className="w-6 h-6 text-red-500" />
                Scan Results
              </h2>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm">
                  {websiteResult.checkedLinks} links checked
                </Badge>
                {websiteResult.brokenLinks.length > 0 ? (
                  <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                    {websiteResult.brokenLinks.length} broken
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    All links working
                  </Badge>
                )}
              </div>
            </div>

            {websiteResult.brokenLinks.length > 0 && (
              <Card className="overflow-hidden border-red-500/30" data-testid="card-broken-links">
                <CardHeader className="bg-red-500/5 pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    Broken Links ({websiteResult.brokenLinks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {websiteResult.brokenLinks.map((link, idx) => (
                      <div key={idx} className="p-4 flex items-start justify-between gap-4" data-testid={`broken-link-${idx}`}>
                        <div className="flex-1 min-w-0">
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-mono text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1 break-all"
                          >
                            {link.url}
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                          {link.anchorText && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Anchor: "{link.anchorText}"
                            </p>
                          )}
                          {link.error && (
                            <p className="text-xs text-red-500 mt-1">{link.error}</p>
                          )}
                        </div>
                        <Badge variant="outline" className={getStatusColor(link.status)}>
                          {link.status || "Error"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {websiteResult.workingLinks.length > 0 && (
              <Card className="overflow-hidden" data-testid="card-working-links">
                <CardHeader className="bg-emerald-500/5 pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                    Working Links ({websiteResult.workingLinks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                    {websiteResult.workingLinks.map((link, idx) => (
                      <div key={idx} className="p-4 flex items-start justify-between gap-4" data-testid={`working-link-${idx}`}>
                        <div className="flex-1 min-w-0">
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-mono text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1 break-all"
                          >
                            {link.url}
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                          {link.anchorText && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Anchor: "{link.anchorText}"
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className={getStatusColor(link.status)}>
                          {link.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {mode === "website" && websiteResult?.error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="w-5 h-5" />
                  <span>{websiteResult.error}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
