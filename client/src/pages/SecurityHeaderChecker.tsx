import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, Loader2, AlertCircle, CheckCircle2, Globe, XCircle, AlertTriangle, Info } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import type { SecurityHeaderResult } from "@shared/schema";

interface SecurityCheckResult {
  url: string;
  headers: SecurityHeaderResult[];
  error?: string;
}

const headerDescriptions: Record<string, string> = {
  "HSTS": "HTTP Strict Transport Security forces browsers to use HTTPS, preventing downgrade attacks.",
  "CSP": "Content Security Policy prevents XSS attacks by controlling which resources can be loaded.",
  "X-Frame-Options": "Prevents clickjacking attacks by controlling if the page can be embedded in iframes.",
  "X-Content-Type-Options": "Prevents MIME-type sniffing, reducing exposure to drive-by download attacks.",
  "Referrer-Policy": "Controls how much referrer information is sent with requests.",
  "Permissions-Policy": "Controls which browser features can be used by the page."
};

export default function SecurityHeaderChecker() {
  const [url, setUrl] = useState("");

  const { mutate: checkSecurity, isPending, data: result, error } = useMutation<SecurityCheckResult>({
    mutationFn: async () => {
      if (!url.trim()) {
        throw new Error("Please enter a URL");
      }
      
      let checkUrl = url.trim();
      if (!checkUrl.startsWith("http://") && !checkUrl.startsWith("https://")) {
        checkUrl = "https://" + checkUrl;
      }

      const response = await apiRequest("POST", "/api/security-check", { url: checkUrl });
      return response.json();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkSecurity();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Present
          </Badge>
        );
      case "missing":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-400">
            <XCircle className="w-3 h-3 mr-1" />
            Missing
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Warning
          </Badge>
        );
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const calculateScore = (headers: SecurityHeaderResult[]) => {
    if (!headers || headers.length === 0) return 0;
    const presentCount = headers.filter(h => h.status === "present").length;
    return Math.round((presentCount / headers.length) * 100);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative overflow-hidden bg-black text-white pb-16 pt-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-purple-200">
              Security Header Checker
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto"
          >
            Analyze HTTP security headers to identify vulnerabilities and improve your website's security posture.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-2xl"
          >
            <div className="text-left mb-6">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                Check Security Headers
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                Enter a URL to analyze its HTTP security headers
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  data-testid="input-url"
                  placeholder="example.com or https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10 h-12 text-base bg-white text-slate-900 border-0 focus-visible:ring-2 ring-primary"
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  data-testid="button-check-security"
                  disabled={isPending || !url.trim()}
                  size="lg"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      Check Security
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

        {result && !result.error && result.headers && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold font-display flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-purple-500" />
                Security Analysis
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Score:</span>
                <span className={`text-2xl font-bold ${getScoreColor(calculateScore(result.headers))}`}>
                  {calculateScore(result.headers)}%
                </span>
              </div>
            </div>

            <Card className="overflow-hidden" data-testid="card-result">
              <CardHeader className="bg-muted/50 pb-3">
                <CardTitle className="text-base font-mono flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  {result.url}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.headers.map((header, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
                      data-testid={`header-result-${idx}`}
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h4 className="font-semibold text-sm font-mono text-foreground">{header.header}</h4>
                        {getStatusBadge(header.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 min-h-[40px]">
                        {headerDescriptions[header.header] || "Security header check"}
                      </p>
                      {header.value && (
                        <div className="bg-muted/50 rounded-lg p-2 mt-2">
                          <code className="text-xs font-mono text-foreground break-all">
                            {header.value}
                          </code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground mb-1">About Security Headers</h3>
                    <p className="text-sm text-muted-foreground">
                      Security headers are HTTP response headers that help protect your website from common attacks like XSS, clickjacking, and data injection. Implementing these headers is a best practice for web security.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {result?.error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="w-5 h-5" />
                  <span>{result.error}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
