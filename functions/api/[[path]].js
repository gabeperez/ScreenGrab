import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRouter, authMiddleware } from '../../src/auth.js';
import { videosRouter } from '../../src/videos.js';

const app = new Hono();

// Enable CORS for frontend
app.use('*', cors({
  origin: (origin) => origin,
  credentials: true,
}));

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

// Mount routers
app.route('/api/auth', authRouter);
app.route('/api/videos', videosRouter);

// User videos endpoint
app.get('/api/user/videos', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, filename, size_bytes, duration_seconds, expiration_type, expires_at, is_expired, created_at, view_count FROM videos WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(user.id).all();

    return c.json({ videos: results });
  } catch (error) {
    console.error('Error fetching user videos:', error);
    return c.json({ error: 'Failed to fetch videos' }, 500);
  }
});

// Export for Pages Functions
export const onRequest = app.fetch;

