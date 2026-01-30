import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const blogPosts = [
  {
    id: 1,
    title: "Understanding Redirect Chains and Their Impact on SEO",
    description: "Learn how redirect chains can affect your website's SEO performance and how to identify and fix them.",
    category: "SEO",
    date: "Jan 25, 2026",
    readTime: "5 min read"
  },
  {
    id: 2,
    title: "Essential Security Headers Every Website Should Have",
    description: "A comprehensive guide to implementing security headers like HSTS, CSP, and X-Frame-Options.",
    category: "Security",
    date: "Jan 20, 2026",
    readTime: "8 min read"
  },
  {
    id: 3,
    title: "How to Write an Effective robots.txt File",
    description: "Best practices for creating and maintaining your robots.txt file for optimal search engine crawling.",
    category: "Technical SEO",
    date: "Jan 15, 2026",
    readTime: "6 min read"
  },
  {
    id: 4,
    title: "WHOIS Lookup: What Information Can You Find?",
    description: "Explore what WHOIS data reveals about domain ownership and how to use it for research.",
    category: "Domains",
    date: "Jan 10, 2026",
    readTime: "4 min read"
  }
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative overflow-hidden bg-black text-white pb-24 pt-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-100 to-emerald-200">
              Blog
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto"
          >
            Tips, tutorials, and insights on web development, SEO, and security best practices.
          </motion.p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="shadow-xl border-border overflow-hidden bg-card hover:shadow-2xl hover:border-primary/50 transition-all cursor-pointer group h-full">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{post.category}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.date}
                    </span>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription>{post.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{post.readTime}</span>
                    <span className="text-primary flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all">
                      Read more <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
