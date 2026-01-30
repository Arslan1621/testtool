import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Search, Loader2, Globe, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

interface WhoisResult {
  domain: string;
  data: Record<string, string | string[]>;
  error?: string;
  rawText?: string;
}

export default function WhoisChecker() {
  const [domain, setDomain] = useState("");
  const [copied, setCopied] = useState(false);

  const { mutate: checkWhois, isPending, data: result } = useMutation<WhoisResult>({
    mutationFn: async () => {
      if (!domain.trim()) {
        throw new Error("Please enter a domain");
      }
      const response = await apiRequest("POST", "/api/whois-check", { domain: domain.trim() });
      return response.json();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkWhois();
  };

  const handleCopy = () => {
    if (result?.rawText) {
      navigator.clipboard.writeText(result.rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
      .trim();
  };

  const getFieldOrder = (): string[] => {
    return [
      'domainName',
      'registrar',
      'registrarId',
      'registrarName',
      'status',
      'creationDate',
      'createdDate',
      'updatedDate',
      'expirationDate',
      'registryExpiryDate',
      'registrantName',
      'registrantOrganization',
      'registrantEmail',
      'registrantContactId',
      'registrantContactName',
      'registrantContactEmail',
      'registrantContactOrganisation',
      'techContactId',
      'techContactName',
      'techContactEmail',
      'techContactOrganisation',
      'adminName',
      'adminOrganization',
      'adminEmail',
      'nameServer',
      'nameServers',
      'dnssec'
    ];
  };

  const sortedEntries = () => {
    if (!result?.data) return [];
    const entries = Object.entries(result.data);
    const order = getFieldOrder();
    
    return entries.sort((a, b) => {
      const indexA = order.indexOf(a[0]);
      const indexB = order.indexOf(b[0]);
      if (indexA === -1 && indexB === -1) return a[0].localeCompare(b[0]);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative overflow-hidden bg-black text-white pb-24 pt-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-200">
              WHOIS Lookup
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto"
          >
            Look up domain registration information including registrar, owner details, and name servers.
          </motion.p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <Card className="shadow-xl border-border overflow-hidden bg-card">
          <CardHeader className="pb-4 bg-card">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-500" />
              Domain WHOIS Lookup
            </CardTitle>
            <CardDescription className="mt-1">
              Enter a domain name to retrieve its WHOIS information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  data-testid="input-domain"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  data-testid="button-check-whois"
                  disabled={isPending || !domain.trim()}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    <>
                      Lookup WHOIS
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
          >
            {result.error ? (
              <Card className="border-red-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 text-red-500">
                    <AlertCircle className="w-5 h-5" />
                    <span>{result.error}</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden" data-testid="card-whois-result">
                <CardHeader className="bg-muted/50 pb-3">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <CardTitle className="text-lg font-mono flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      WHOIS Information for {result.domain}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      data-testid="button-copy-whois"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="rounded-lg bg-muted/30 border border-border overflow-hidden">
                    <div className="max-h-[600px] overflow-auto">
                      <table className="w-full text-sm">
                        <tbody>
                          {sortedEntries().map(([key, value], idx) => (
                            <tr 
                              key={key} 
                              className={idx % 2 === 0 ? "bg-muted/20" : ""}
                              data-testid={`row-whois-${key}`}
                            >
                              <td className="px-4 py-3 font-medium text-primary whitespace-nowrap align-top border-r border-border min-w-[180px]">
                                {formatLabel(key)}:
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
                  </div>

                  <div className="mt-6">
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Badge variant="secondary">Raw WHOIS Response</Badge>
                    </h3>
                    <pre className="bg-muted/50 border border-border rounded-lg p-4 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[400px] text-muted-foreground">
                      {result.rawText || 'No raw data available'}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
