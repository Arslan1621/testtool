import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

// Helper to inject SEO tags into HTML
async function injectSEOTags(req: Request, res: Response, next: NextFunction) {
  // Only handle GET requests for potential page routes, not API or static files
  if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.includes('.')) {
    return next();
  }

  try {
    const domainName = req.path.slice(1); // Remove leading slash
    const domainData = domainName ? await storage.getDomain(domainName) : null;

    let title = "WebTools.io - Professional SEO Analysis & Audit Tools";
    let description = "Comprehensive web analysis for redirects, broken links, security headers, and robots.txt. Analyze your technical SEO instantly.";
    let ogTitle = title;
    let ogDescription = description;
    let ogUrl = `https://${req.get('host')}${req.path}`;

    if (domainData) {
      title = `${domainData.domain} SEO Analysis Report | WebTools.io`;
      description = `Technical SEO audit for ${domainData.domain}. View redirect chains, security headers, broken links, and AI-powered summaries.`;
      
      if (domainData.aiData && typeof domainData.aiData === 'object' && 'seoTitle' in domainData.aiData) {
        const ai = domainData.aiData as any;
        title = ai.seoTitle || title;
        description = ai.seoDescription || description;
      }
      
      ogTitle = title;
      ogDescription = description;
    }

    const indexPath = process.env.NODE_ENV === "production" 
      ? path.resolve(__dirname, "public", "index.html")
      : path.resolve(__dirname, "..", "client", "index.html");

    if (!fs.existsSync(indexPath)) {
      return next();
    }

    let html = fs.readFileSync(indexPath, "utf8");

    const seoTags = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${ogDescription}" />
    <meta property="og:url" content="${ogUrl}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${title}",
      "description": "${description}",
      "author": {
        "@type": "Organization",
        "name": "WebTools.io"
      }
    }
    </script>
    `;

    // Remove existing title if any and inject new tags
    html = html.replace(/<title>.*?<\/title>/, "");
    html = html.replace("</head>", `${seoTags}</head>`);

    res.send(html);
  } catch (err) {
    console.error("SEO Injection Error:", err);
    next();
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  // Inject SEO tags for non-API routes
  app.use(injectSEOTags);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
