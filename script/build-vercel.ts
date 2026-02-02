import { build as viteBuild } from "vite";
import { rm } from "fs/promises";
import react from "@vitejs/plugin-react";
import path from "path";

async function buildVercel() {
  await rm("dist", { recursive: true, force: true });

  console.log("Building client for Vercel...");
  await viteBuild({
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "client", "src"),
        "@shared": path.resolve(process.cwd(), "shared"),
        "@assets": path.resolve(process.cwd(), "attached_assets"),
      },
    },
    root: path.resolve(process.cwd(), "client"),
    build: {
      outDir: path.resolve(process.cwd(), "dist"),
      emptyOutDir: true,
    },
  });
  
  console.log("Vercel build complete!");
}

buildVercel().catch((err) => {
  console.error(err);
  process.exit(1);
});
