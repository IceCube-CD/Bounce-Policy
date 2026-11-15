import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAVED_WORLD_STATE_PATH = path.resolve(__dirname, 'src/data/savedWorldState.json');

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Allow large JSON payloads (custom scene background images, zones, props, bills)
  app.use(express.json({ limit: '50mb' }));

  // Read saved world state from disk
  app.get('/api/world-state', (_req, res) => {
    try {
      if (fs.existsSync(SAVED_WORLD_STATE_PATH)) {
        const raw = fs.readFileSync(SAVED_WORLD_STATE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        res.json(parsed);
        return;
      }
    } catch {
      // Ignore read errors and return empty state
    }
    res.json({ updatedAt: 0, scenes: [] });
  });

  // Save updated scenes, obstacles, zones, doors, masks, floor bounds & props directly into src/data/savedWorldState.json
  app.post('/api/world-state', (req, res) => {
    try {
      const { scenes, bills, updatedAt } = req.body || {};
      if (!Array.isArray(scenes) || scenes.length === 0) {
        res.status(400).json({ ok: false, error: 'Invalid scenes array' });
        return;
      }
      const payload = {
        updatedAt: typeof updatedAt === 'number' ? updatedAt : Date.now(),
        scenes,
        ...(Array.isArray(bills) ? { bills } : {}),
      };
      fs.writeFileSync(SAVED_WORLD_STATE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
      res.json({ ok: true, updatedAt: payload.updatedAt });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
