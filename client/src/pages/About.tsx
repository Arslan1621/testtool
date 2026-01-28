import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <div className="relative overflow-hidden bg-slate-900 text-white pb-24 pt-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-purple-200">
              About Us
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto"
          >
            We're building the most comprehensive suite of web analysis tools for developers and SEO professionals.
          </motion.p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-xl border-border overflow-hidden bg-card">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-3">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                To empower web developers and SEO professionals with powerful, easy-to-use tools that help them build better, faster, and more secure websites. We believe that technical SEO shouldn't be complicated.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-border overflow-hidden bg-card">
            <CardContent className="pt-6">
              <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold mb-3">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                To become the go-to platform for all web analysis needs. We continuously add new tools and features based on community feedback to help you stay ahead in the ever-evolving digital landscape.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 shadow-xl border-border overflow-hidden bg-card">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4">What We Offer</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                WebTools.io provides a comprehensive suite of free web analysis tools designed for developers, marketers, and SEO professionals. Our tools help you:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Trace and debug redirect chains to optimize your URL structure</li>
                <li>Find and fix broken links that hurt user experience and SEO</li>
                <li>Audit security headers to ensure your site is protected</li>
                <li>Validate robots.txt files for proper search engine crawling</li>
                <li>Look up WHOIS information for domain research</li>
                <li>Get AI-powered insights and recommendations for your website</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
