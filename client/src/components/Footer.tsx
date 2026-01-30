import { Link } from "wouter";
import { Search, Mail, Twitter, Github, Linkedin } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold font-display">SEO Toolkit</span>
            </div>
            <p className="text-neutral-400 text-sm max-w-md mb-6">
              Comprehensive SEO analysis tools to help you optimize your website's performance, security, and search engine visibility.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="#" 
                className="text-neutral-400 hover:text-primary transition-colors"
                data-testid="link-social-twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-neutral-400 hover:text-primary transition-colors"
                data-testid="link-social-github"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-neutral-400 hover:text-primary transition-colors"
                data-testid="link-social-linkedin"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-neutral-300">Tools</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/redirect-checker" className="text-neutral-400 hover:text-primary text-sm transition-colors" data-testid="link-footer-redirect">
                  Redirect Checker
                </Link>
              </li>
              <li>
                <Link href="/broken-links" className="text-neutral-400 hover:text-primary text-sm transition-colors" data-testid="link-footer-broken-links">
                  Broken Link Finder
                </Link>
              </li>
              <li>
                <Link href="/security-checker" className="text-neutral-400 hover:text-primary text-sm transition-colors" data-testid="link-footer-security">
                  Security Audit
                </Link>
              </li>
              <li>
                <Link href="/robots-txt" className="text-neutral-400 hover:text-primary text-sm transition-colors" data-testid="link-footer-robots">
                  Robots.txt Validator
                </Link>
              </li>
              <li>
                <Link href="/whois-checker" className="text-neutral-400 hover:text-primary text-sm transition-colors" data-testid="link-footer-whois">
                  WHOIS Lookup
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-neutral-300">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-neutral-400 hover:text-primary text-sm transition-colors" data-testid="link-footer-about">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-neutral-400 hover:text-primary text-sm transition-colors" data-testid="link-footer-blog">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-neutral-400 hover:text-primary text-sm transition-colors" data-testid="link-footer-contact">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-neutral-500 text-sm">
            {currentYear} SEO Toolkit. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors" data-testid="link-footer-privacy">
              Privacy Policy
            </a>
            <a href="#" className="text-neutral-500 hover:text-neutral-300 text-sm transition-colors" data-testid="link-footer-terms">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
