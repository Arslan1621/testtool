import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, FileCode, Loader2, AlertCircle, CheckCircle2, Globe, XCircle, Plus, Trash2, Copy, Download, Eye, PenTool } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface RobotsValidationResult {
  url: string;
  content: string | null;
  isValid: boolean;
  status: number;
  issues: string[];
}

interface UserAgentRule {
  userAgent: string;
  disallow: string[];
  allow: string[];
}

export default function RobotsTxtTool() {
  const [mode, setMode] = useState<"validate" | "generate">("validate");
  const [url, setUrl] = useState("");
  const { toast } = useToast();

  const [rules, setRules] = useState<UserAgentRule[]>([
    { userAgent: "*", disallow: [], allow: [] }
  ]);
  const [sitemap, setSitemap] = useState("");
  const [crawlDelay, setCrawlDelay] = useState("");
  const [includeCrawlDelay, setIncludeCrawlDelay] = useState(false);

  const { mutate: validateRobots, isPending, data: result, error } = useMutation<RobotsValidationResult>({
    mutationFn: async () => {
      if (!url.trim()) {
        throw new Error("Please enter a URL");
      }
      
      let checkUrl = url.trim();
      if (!checkUrl.startsWith("http://") && !checkUrl.startsWith("https://")) {
        checkUrl = "https://" + checkUrl;
      }

      const response = await apiRequest("POST", "/api/robots-check", { url: checkUrl });
      return response.json();
    }
  });

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    validateRobots();
  };

  const addRule = () => {
    setRules([...rules, { userAgent: "*", disallow: [], allow: [] }]);
  };

  const removeRule = (index: number) => {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== index));
    }
  };

  const updateUserAgent = (index: number, value: string) => {
    const newRules = [...rules];
    newRules[index].userAgent = value;
    setRules(newRules);
  };

  const addDisallowPath = (ruleIndex: number) => {
    const newRules = [...rules];
    newRules[ruleIndex].disallow.push("");
    setRules(newRules);
  };

  const updateDisallowPath = (ruleIndex: number, pathIndex: number, value: string) => {
    const newRules = [...rules];
    newRules[ruleIndex].disallow[pathIndex] = value;
    setRules(newRules);
  };

  const removeDisallowPath = (ruleIndex: number, pathIndex: number) => {
    const newRules = [...rules];
    newRules[ruleIndex].disallow.splice(pathIndex, 1);
    setRules(newRules);
  };

  const addAllowPath = (ruleIndex: number) => {
    const newRules = [...rules];
    newRules[ruleIndex].allow.push("");
    setRules(newRules);
  };

  const updateAllowPath = (ruleIndex: number, pathIndex: number, value: string) => {
    const newRules = [...rules];
    newRules[ruleIndex].allow[pathIndex] = value;
    setRules(newRules);
  };

  const removeAllowPath = (ruleIndex: number, pathIndex: number) => {
    const newRules = [...rules];
    newRules[ruleIndex].allow.splice(pathIndex, 1);
    setRules(newRules);
  };

  const generateRobotsTxt = () => {
    let content = "";
    
    rules.forEach((rule, index) => {
      if (index > 0) content += "\n";
      content += `User-agent: ${rule.userAgent}\n`;
      
      rule.disallow.forEach(path => {
        if (path.trim()) {
          content += `Disallow: ${path}\n`;
        }
      });
      
      rule.allow.forEach(path => {
        if (path.trim()) {
          content += `Allow: ${path}\n`;
        }
      });
      
      if (includeCrawlDelay && crawlDelay && index === 0) {
        content += `Crawl-delay: ${crawlDelay}\n`;
      }
    });
    
    if (sitemap.trim()) {
      content += `\nSitemap: ${sitemap}\n`;
    }
    
    return content;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateRobotsTxt());
    toast({
      title: "Copied!",
      description: "robots.txt content copied to clipboard",
    });
  };

  const downloadFile = () => {
    const content = generateRobotsTxt();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "robots.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
              <FileCode className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-amber-100 to-amber-200">
              Robots.txt Tool
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto"
          >
            Validate existing robots.txt files or generate new ones to control how search engines crawl your site.
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
                  <FileCode className="w-5 h-5 text-amber-400" />
                  Robots.txt Tool
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  {mode === "validate" ? "Enter a URL to validate its robots.txt file" : "Configure rules to generate a robots.txt file"}
                </p>
              </div>
              <div className="flex items-center bg-white/10 rounded-lg p-1">
                <button
                  type="button"
                  data-testid="button-mode-validate"
                  onClick={() => setMode("validate")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === "validate" 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Validate
                </button>
                <button
                  type="button"
                  data-testid="button-mode-generate"
                  onClick={() => setMode("generate")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === "generate" 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  Generate
                </button>
              </div>
            </div>

            {mode === "validate" ? (
              <form onSubmit={handleValidate} className="space-y-4">
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
                    data-testid="button-validate"
                    disabled={isPending || !url.trim()}
                    size="lg"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        Validate robots.txt
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {rules.map((rule, ruleIndex) => (
                  <Card key={ruleIndex} className="border-border" data-testid={`rule-card-${ruleIndex}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground mb-1 block">User-Agent</Label>
                          <Input
                            data-testid={`input-user-agent-${ruleIndex}`}
                            value={rule.userAgent}
                            onChange={(e) => updateUserAgent(ruleIndex, e.target.value)}
                            placeholder="* (all bots)"
                            className="font-mono"
                          />
                        </div>
                        {rules.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRule(ruleIndex)}
                            className="mt-5"
                            data-testid={`button-remove-rule-${ruleIndex}`}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs text-muted-foreground">Disallow Paths</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addDisallowPath(ruleIndex)}
                            data-testid={`button-add-disallow-${ruleIndex}`}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {rule.disallow.map((path, pathIndex) => (
                            <div key={pathIndex} className="flex items-center gap-2">
                              <Input
                                data-testid={`input-disallow-${ruleIndex}-${pathIndex}`}
                                value={path}
                                onChange={(e) => updateDisallowPath(ruleIndex, pathIndex, e.target.value)}
                                placeholder="/private/"
                                className="font-mono"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeDisallowPath(ruleIndex, pathIndex)}
                                data-testid={`button-remove-disallow-${ruleIndex}-${pathIndex}`}
                              >
                                <Trash2 className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </div>
                          ))}
                          {rule.disallow.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">No disallow paths added</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs text-muted-foreground">Allow Paths</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addAllowPath(ruleIndex)}
                            data-testid={`button-add-allow-${ruleIndex}`}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {rule.allow.map((path, pathIndex) => (
                            <div key={pathIndex} className="flex items-center gap-2">
                              <Input
                                data-testid={`input-allow-${ruleIndex}-${pathIndex}`}
                                value={path}
                                onChange={(e) => updateAllowPath(ruleIndex, pathIndex, e.target.value)}
                                placeholder="/public/"
                                className="font-mono"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeAllowPath(ruleIndex, pathIndex)}
                                data-testid={`button-remove-allow-${ruleIndex}-${pathIndex}`}
                              >
                                <Trash2 className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </div>
                          ))}
                          {rule.allow.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">No allow paths added</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addRule}
                  className="w-full"
                  data-testid="button-add-rule"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another User-Agent Rule
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Sitemap URL (optional)</Label>
                    <Input
                      data-testid="input-sitemap"
                      value={sitemap}
                      onChange={(e) => setSitemap(e.target.value)}
                      placeholder="https://example.com/sitemap.xml"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Switch
                        checked={includeCrawlDelay}
                        onCheckedChange={setIncludeCrawlDelay}
                        data-testid="switch-crawl-delay"
                      />
                      <Label className="text-xs text-muted-foreground">Include Crawl-delay</Label>
                    </div>
                    <Input
                      data-testid="input-crawl-delay"
                      value={crawlDelay}
                      onChange={(e) => setCrawlDelay(e.target.value)}
                      placeholder="10"
                      disabled={!includeCrawlDelay}
                      className="font-mono"
                    />
                  </div>
                </div>

                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileCode className="w-4 h-4" />
                      Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm font-mono bg-background p-4 rounded-lg border border-border overflow-x-auto whitespace-pre-wrap" data-testid="preview-content">
                      {generateRobotsTxt() || "# Your robots.txt will appear here"}
                    </pre>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={copyToClipboard}
                        data-testid="button-copy"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        type="button"
                        onClick={downloadFile}
                        data-testid="button-download"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {mode === "validate" && error && (
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

        {mode === "validate" && result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
          >
            <h2 className="text-2xl font-bold font-display flex items-center gap-2">
              <FileCode className="w-6 h-6 text-amber-500" />
              Validation Results
            </h2>

            <Card className="overflow-hidden" data-testid="card-result">
              <CardHeader className="bg-muted/50 pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base font-mono flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    {result.url}/robots.txt
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      HTTP {result.status}
                    </Badge>
                    {result.isValid ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Valid
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                        <XCircle className="w-3 h-3 mr-1" />
                        Issues Found
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {result.issues && result.issues.length > 0 && (
                  <div className="mb-4 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                    <h4 className="font-semibold text-sm text-red-600 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Issues Detected
                    </h4>
                    <ul className="space-y-1">
                      {result.issues.map((issue, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-red-500 mt-1">-</span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.content && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <FileCode className="w-4 h-4" />
                      File Content
                    </h4>
                    <pre className="text-sm font-mono bg-muted/50 p-4 rounded-lg border border-border overflow-x-auto whitespace-pre-wrap max-h-[400px] overflow-y-auto" data-testid="robots-content">
                      {result.content}
                    </pre>
                  </div>
                )}

                {!result.content && result.isValid === false && (
                  <p className="text-sm text-muted-foreground">No robots.txt content available</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Educational Content Section */}
        <div className="mt-16 space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold font-display text-foreground mb-4">Understanding Robots.txt</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Learn what robots.txt is, how it works, and best practices for SEO
            </p>
          </div>

          {/* What is Robots.txt */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-500" />
                What is Robots.txt?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Robots.txt is a text file placed at the root of your website (yoursite.com/robots.txt) that tells search engine crawlers which pages they can and cannot access. It's part of the Robots Exclusion Protocol, a standard used by websites to communicate with web crawlers.
              </p>
              <p>
                While robots.txt is a suggestion rather than a security feature (malicious bots can ignore it), reputable search engines like Google, Bing, and others respect these directives. It's essential for controlling how search engines index your site.
              </p>
            </CardContent>
          </Card>

          {/* How it Works */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ol className="list-decimal list-inside space-y-3">
                <li><strong>Crawler Visits:</strong> When a search engine bot visits your site, it first looks for /robots.txt.</li>
                <li><strong>Rules Check:</strong> The bot reads the file and checks for rules that match its user-agent.</li>
                <li><strong>Apply Directives:</strong> Based on Allow and Disallow rules, the bot decides which URLs to crawl.</li>
                <li><strong>Continue Crawling:</strong> The bot follows the rules while discovering and indexing your content.</li>
              </ol>
              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <h4 className="font-semibold text-foreground mb-2">Basic Syntax</h4>
                <pre className="text-xs font-mono">
{`User-agent: *
Disallow: /private/
Disallow: /admin/
Allow: /public/

Sitemap: https://yoursite.com/sitemap.xml`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Common Directives */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Common Robots.txt Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-foreground">Blocking Important Content</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    Accidentally disallowing pages you want indexed. Always double-check your Disallow rules and test with Google Search Console.
                  </p>
                </div>

                <div className="border-l-4 border-amber-500 pl-4">
                  <h4 className="font-semibold text-foreground">Blocking CSS/JavaScript</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    Disallowing /css/ or /js/ folders prevents search engines from rendering your pages properly, which can hurt rankings.
                  </p>
                </div>

                <div className="border-l-4 border-amber-500 pl-4">
                  <h4 className="font-semibold text-foreground">Using robots.txt for Security</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    Robots.txt is public and not a security measure. Don't use it to hide sensitive pages - use authentication instead.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-foreground">Missing Sitemap Reference</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    Not including your sitemap URL in robots.txt. Adding it helps search engines discover all your important pages.
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-foreground">Incorrect Syntax</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    Typos or incorrect formatting can make rules ineffective. Use our validator to check for syntax errors.
                  </p>
                </div>

                <div className="border-l-4 border-red-600 pl-4">
                  <h4 className="font-semibold text-foreground">Disallow: / (Blocking Everything)</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    This completely blocks all crawling. Only use this for staging sites or when you genuinely want no indexing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Robots.txt Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Always Include Sitemap</h4>
                  <p className="text-sm">Add your sitemap URL at the end of robots.txt to help search engines find all your pages.</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Use Specific User-Agents</h4>
                  <p className="text-sm">Target specific bots when needed (Googlebot, Bingbot) instead of always using the wildcard *.</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Test Before Deploying</h4>
                  <p className="text-sm">Use Google Search Console's robots.txt tester to verify your rules work as expected.</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Keep It Simple</h4>
                  <p className="text-sm">Use clear, straightforward rules. Complex patterns can be confusing and error-prone.</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Block Duplicate Content</h4>
                  <p className="text-sm">Disallow URL parameters, print pages, and other duplicate content to save crawl budget.</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Review Regularly</h4>
                  <p className="text-sm">Update robots.txt when your site structure changes to ensure rules are still relevant.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
