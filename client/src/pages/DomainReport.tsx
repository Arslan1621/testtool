import { useDomain, useRunScan } from "@/hooks/use-domains";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeft, ExternalLink, ShieldCheck, AlertCircle, CheckCircle, FileCode, Unplug, Sparkles, MapPin, Briefcase, Globe } from "lucide-react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge, getStatusCodeBadge } from "@/components/StatusBadge";
import { RedirectHop, SecurityHeaderResult, BrokenLinkResult, RobotsResult, AiSummaryResult, WhoisResult } from "@shared/schema";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";

export default function DomainReport() {
  const [, params] = useRoute("/:domain");
  const domain = params?.domain || "";
  
  const { data, isLoading, error } = useDomain(domain);
  const { mutate: reScan, isPending: isRescanning } = useRunScan();

  const redirectData = data?.redirectData as RedirectHop[] | null;
  const securityData = data?.securityData as SecurityHeaderResult[] | null;
  const brokenLinksData = data?.brokenLinksData as BrokenLinkResult[] | null;
  const robotsData = data?.robotsData as RobotsResult | null;
  const aiData = data?.aiData as AiSummaryResult | null;
  const whoisData = data?.whoisData as WhoisResult | null;

  useEffect(() => {
    if (aiData) {
      if (aiData.seoTitle) {
        document.title = `${aiData.seoTitle} | SEO Report`;
      }
      
      // Update meta description
      if (aiData.seoDescription) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', aiData.seoDescription);
      }

      // Update keywords
      if (aiData.seoKeywords && aiData.seoKeywords.length > 0) {
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
          metaKeywords = document.createElement('meta');
          metaKeywords.setAttribute('name', 'keywords');
          document.head.appendChild(metaKeywords);
        }
        metaKeywords.setAttribute('content', aiData.seoKeywords.join(', '));
      }
    } else if (data) {
      document.title = `SEO Report for ${data.domain}`;
    }
  }, [data, aiData]);

  const handleRescan = () => {
    reScan({ 
      url: domain, 
      tools: ["redirect", "broken_links", "security", "robots", "whois", "ai"] 
    });
  };

  if (isLoading) return <ReportSkeleton />;
  if (error || !data) return <ReportError domain={domain} />;

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <Navbar />
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
              </Link>
              <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
                {data.domain}
                <a href={`https://${data.domain}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <ExternalLink className="w-5 h-5" />
                </a>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Last scanned: {data.lastScannedAt ? format(new Date(data.lastScannedAt), "PPpp") : "Never"}
              </p>
            </div>
            <Button 
              onClick={handleRescan} 
              disabled={isRescanning}
              className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRescanning ? 'animate-spin' : ''}`} />
              {isRescanning ? "Analyzing..." : "Re-run Analysis"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* AI Summary Section */}
        {aiData && (
          <section id="ai-summary" className="scroll-mt-24">
            <Card className="border-border shadow-sm overflow-hidden bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
              <CardHeader className="border-b border-border/50 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg dark:bg-indigo-900/30 dark:text-indigo-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    AI Insights
                    <span className="text-xs font-normal bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800">Generated by GPT-4o</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">About this Website</h3>
                  <p className="text-muted-foreground leading-relaxed">{aiData.summary || "No summary available."}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground/80">
                      <Briefcase className="w-4 h-4" /> Services & Products
                    </h4>
                    {aiData.services && aiData.services.length > 0 ? (
                      <ul className="space-y-2">
                        {aiData.services.map((service, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                            {service}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No services detected.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground/80">
                      <MapPin className="w-4 h-4" /> Locations
                    </h4>
                    {aiData.locations && aiData.locations.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {aiData.locations.map((loc, i) => (
                          <span key={i} className="px-2.5 py-1 bg-white dark:bg-black/40 border border-border rounded-md text-xs font-medium text-muted-foreground">
                            {loc}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No specific locations detected.</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <h4 className="text-sm font-semibold mb-3">SEO Recommendations</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recommended Title</span>
                      <p className="font-medium text-sm border border-border bg-background p-2 rounded">{aiData.seoTitle || "No title recommendation"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recommended Description</span>
                      <p className="text-sm border border-border bg-background p-2 rounded text-muted-foreground">{aiData.seoDescription || "No description recommendation"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Redirect Chains */}
        {redirectData && (
          <section id="redirects" className="scroll-mt-24">
            <Card className="border-border shadow-sm overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <CardTitle>Redirect Chain Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {redirectData.map((hop, index) => (
                    <div key={index} className="p-6 flex items-start gap-4 group hover:bg-muted/20 transition-colors">
                      <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center font-mono text-sm font-bold text-muted-foreground border border-border">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusCodeBadge(hop.status)}
                          <span className="font-mono text-sm truncate w-full" title={hop.url}>{hop.url}</span>
                        </div>
                        {hop.headers && (
                          <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono text-muted-foreground mt-2">
                            {Object.entries(hop.headers).slice(0, 3).map(([k, v]) => (
                              <div key={k} className="flex gap-2">
                                <span className="font-semibold text-foreground/70">{k}:</span>
                                <span className="truncate">{v}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-muted/10 text-center text-sm text-muted-foreground">
                    {redirectData.length} hop{redirectData.length !== 1 ? 's' : ''} in total
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Security Headers */}
        {securityData && (
          <section id="security" className="scroll-mt-24">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg dark:bg-purple-900/30 dark:text-purple-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <CardTitle>Security Headers</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {securityData.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm font-mono text-foreground">{item.header}</h4>
                        {item.status === "present" && <StatusBadge status="success" icon={false}>Pass</StatusBadge>}
                        {item.status === "missing" && <StatusBadge status="error" icon={false}>Missing</StatusBadge>}
                        {item.status === "warning" && <StatusBadge status="warning" icon={false}>Warning</StatusBadge>}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 min-h-[40px]">{item.description || "No description available."}</p>
                      {item.value && (
                        <code className="block bg-muted p-2 rounded text-[10px] break-all text-muted-foreground border border-border/50">
                          {item.value.slice(0, 50)}{item.value.length > 50 ? '...' : ''}
                        </code>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Broken Links */}
        {brokenLinksData && (
          <section id="links" className="scroll-mt-24">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg dark:bg-red-900/30 dark:text-red-400">
                    <Unplug className="w-5 h-5" />
                  </div>
                  <CardTitle>Broken Links Check</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase font-medium text-xs">
                    <tr>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">URL</th>
                      <th className="px-6 py-4">Anchor Text</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {brokenLinksData.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                          No broken links found. Great job!
                        </td>
                      </tr>
                    ) : (
                      brokenLinksData.map((link, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {typeof link.status === 'number' 
                              ? getStatusCodeBadge(link.status) 
                              : <StatusBadge status="error">{link.status}</StatusBadge>}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs max-w-xs truncate" title={link.url}>
                            {link.url}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground italic">
                            {link.anchorText || "(No text)"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Robots.txt */}
        {robotsData && (
          <section id="robots" className="scroll-mt-24">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg dark:bg-amber-900/30 dark:text-amber-400">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <CardTitle>Robots.txt Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      Validation Status
                      {robotsData.isValid 
                        ? <StatusBadge status="success">Valid</StatusBadge>
                        : <StatusBadge status="error">Issues Found</StatusBadge>
                      }
                    </h3>
                    {robotsData.issues.length > 0 ? (
                      <ul className="space-y-2">
                        {robotsData.issues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 p-2 rounded">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/10 p-3 rounded">
                        <CheckCircle className="w-4 h-4" />
                        No syntax errors detected.
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-3">File Content</h3>
                    <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-[300px] shadow-inner">
                      <pre>{robotsData.content || "# No robots.txt found"}</pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* WHOIS Information */}
        {whoisData && whoisData.data && (
          <section id="whois" className="scroll-mt-24">
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <CardTitle>WHOIS Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {whoisData.error ? (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 p-3 rounded">
                    <AlertCircle className="w-4 h-4" />
                    {whoisData.error}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        {Object.entries(whoisData.data).map(([key, value], idx) => (
                          <tr key={key} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                            <td className="px-4 py-3 font-medium text-primary whitespace-nowrap align-top border-r border-border min-w-[180px]">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}:
                            </td>
                            <td className="px-4 py-3 text-foreground break-all font-mono text-xs">
                              {Array.isArray(value) ? (
                                <div className="space-y-1">
                                  {value.map((v, i) => (
                                    <div key={i}>{v}</div>
                                  ))}
                                </div>
                              ) : (
                                <span>{value}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

      </div>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <div className="bg-background border-b border-border py-8">
        <div className="max-w-7xl mx-auto px-4">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-10 w-96 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ReportError({ domain }: { domain: string }) {
  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Analysis Not Found</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          We couldn't find a report for <strong>{domain}</strong>. It might not exist or may have expired.
        </p>
        <Link href="/">
          <Button size="lg" className="bg-primary">
            Start New Scan
          </Button>
        </Link>
      </div>
    </div>
  );
}
