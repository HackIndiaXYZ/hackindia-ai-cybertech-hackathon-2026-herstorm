import express from 'express';
import path from 'path';
import { app } from './server/app';
import { connectDB } from './server/db';
import { runSeed } from './server/seed';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const port = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  // 1. Initialize Database connection & seed baseline records
  await connectDB();
  await runSeed(false);

  // 2. Attach Vite middleware in development mode
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // 3. Bind to port 3000 for AI Studio environment
  app.listen(port, '0.0.0.0', () => {
    console.log(`[TraceCrop] Full-stack application running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[TraceCrop Startup Error]', err);
  process.exit(1);
});
