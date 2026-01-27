import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Loader2, AlertCircle, CheckCircle2, ArrowDown, ExternalLink } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import type { RedirectHop } from "@shared/schema";

interface BulkRedirectResult {
  url: string;
  hops: RedirectHop[];
  error?: string;
}

export default function RedirectChecker() {
  const [urls, setUrls] = useState("");

  const { mutate: checkRedirects, isPending, data: results } = useMutation<BulkRedirectResult[]>({
    mutationFn: async () => {
      const urlList = urls
        .split('\n')
        .map(u => u.trim())
        .filter(u => u.length > 0);
      
      if (urlList.length === 0) {
        throw new Error("Please enter at least one URL");
      }

      const response = await apiRequest("POST", "/api/redirect-check", { urls: urlList });
      return response.json();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkRedirects();
  };

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
      <Navbar />

      <div className="relative overflow-hidden bg-slate-900 text-white pb-24 pt-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90" />
        
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
              Bulk Redirect Checker
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto"
          >
            Check multiple URLs at once to trace redirect chains, identify redirect loops, and catch SEO issues before they impact your rankings.
          </motion.p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <Card className="shadow-xl border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Enter URLs to Check
            </CardTitle>
            <CardDescription>
              Enter one URL per line. You can check up to 50 URLs at once.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                data-testid="input-urls"
                placeholder={"https://example.com\nhttps://example.org/page\nhttps://test.com/redirect"}
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {urls.split('\n').filter(u => u.trim()).length} URL(s) entered
                </p>
                <Button 
                  data-testid="button-check-redirects"
                  disabled={isPending || !urls.trim()}
                  size="lg"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      Check Redirects
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

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
                    <div className="space-y-2">
                      {result.hops.map((hop, hopIndex) => (
                        <div key={hopIndex} className="relative">
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                            <div className="flex-shrink-0 mt-0.5">
                              {getStatusIcon(hop.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={getStatusColor(hop.status)}>
                                  {hop.status}
                                </Badge>
                                <span className="font-mono text-sm truncate">
                                  {hop.url}
                                </span>
                              </div>
                              {hop.headers?.location && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Location: {hop.headers.location}
                                </p>
                              )}
                            </div>
                          </div>
                          {hopIndex < result.hops.length - 1 && (
                            <div className="flex justify-center py-1">
                              <ArrowDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
