import { Hono } from 'hono';
import { authMiddleware } from './auth.js';
import { deleteFromR2, getFromR2 } from './storage.js';
import { sendEmailNotification } from './email.js';

export const videosRouter = new Hono();

// Apply auth middleware to all routes
videosRouter.use('*', authMiddleware);

// Generate random ID
function generateId(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Calculate expiration timestamp
function calculateExpirationTime(expirationType) {
  const now = Date.now();
  switch (expirationType) {
    case '24h':
      return now + (24 * 60 * 60 * 1000);
    case '1week':
      return now + (7 * 24 * 60 * 60 * 1000);
    case '1month':
      return now + (30 * 24 * 60 * 60 * 1000);
    default:
      return now + (24 * 60 * 60 * 1000);
  }
}

// Prepare upload - generate video ID and return presigned URL
videosRouter.post('/prepare-upload', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { filename, expirationType = '24h' } = await c.req.json();
    
    if (!filename) {
      return c.json({ error: 'Filename is required' }, 400);
    }

    // Generate video ID
    const videoId = generateId();
    const r2Key = `videos/${user.id}/${videoId}.webm`;

    // For R2 bindings, we return the video ID and the frontend will upload via our upload endpoint
    return c.json({
      videoId,
      uploadUrl: `/api/videos/${videoId}/upload`,
      expirationType,
      r2Key,
    });
  } catch (error) {
    console.error('Error preparing upload:', error);
    return c.json({ error: 'Failed to prepare upload' }, 500);
  }
});

// Handle direct upload to R2
videosRouter.put('/:id/upload', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const videoId = c.req.param('id');
  const r2Key = `videos/${user.id}/${videoId}.webm`;

  try {
    // Get the video blob from request
    const blob = await c.req.blob();
    
    // Upload to R2
    await c.env.VIDEOS_BUCKET.put(r2Key, blob, {
      httpMetadata: {
        contentType: 'video/webm',
      },
    });

    return c.json({ success: true, videoId });
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return c.json({ error: 'Failed to upload video' }, 500);
  }
});

// Finalize upload - store metadata in D1
videosRouter.post('/:id/finalize', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const videoId = c.req.param('id');

  try {
    const { filename, sizeBytes, durationSeconds, expirationType } = await c.req.json();
    const r2Key = `videos/${user.id}/${videoId}.webm`;
    const expiresAt = calculateExpirationTime(expirationType);

    // Insert video metadata
    await c.env.DB.prepare(
      `INSERT INTO videos (id, user_id, filename, r2_key, size_bytes, duration_seconds, expiration_type, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      videoId,
      user.id,
      filename,
      r2Key,
      sizeBytes || 0,
      durationSeconds || 0,
      expirationType,
      expiresAt,
      Date.now()
    ).run();

    return c.json({
      success: true,
      videoId,
      shareUrl: `${c.env.APP_URL}/video.html?v=${videoId}`,
    });
  } catch (error) {
    console.error('Error finalizing upload:', error);
    return c.json({ error: 'Failed to finalize upload' }, 500);
  }
});

// Get video metadata
videosRouter.get('/:id', async (c) => {
  const videoId = c.req.param('id');

  try {
    const video = await c.env.DB.prepare(
      'SELECT * FROM videos WHERE id = ?'
    ).bind(videoId).first();

    if (!video) {
      return c.json({ error: 'Video not found' }, 404);
    }

    // Check if expired
    const now = Date.now();
    if (video.expires_at < now && !video.is_expired) {
      // Mark as expired
      await c.env.DB.prepare(
        'UPDATE videos SET is_expired = 1 WHERE id = ?'
      ).bind(videoId).run();
      video.is_expired = 1;
    }

    return c.json({ video });
  } catch (error) {
    console.error('Error fetching video:', error);
    return c.json({ error: 'Failed to fetch video' }, 500);
  }
});

// Stream video
videosRouter.get('/:id/stream', async (c) => {
  const videoId = c.req.param('id');

  try {
    const video = await c.env.DB.prepare(
      'SELECT * FROM videos WHERE id = ?'
    ).bind(videoId).first();

    if (!video) {
      return c.json({ error: 'Video not found' }, 404);
    }

    if (video.is_expired || video.expires_at < Date.now()) {
      return c.json({ error: 'Video expired' }, 410);
    }

    // Increment view count
    await c.env.DB.prepare(
      'UPDATE videos SET view_count = view_count + 1 WHERE id = ?'
    ).bind(videoId).run();

    // Get video from R2
    const object = await c.env.VIDEOS_BUCKET.get(video.r2_key);
    
    if (!object) {
      return c.json({ error: 'Video file not found' }, 404);
    }

    // Return video stream
    return new Response(object.body, {
      headers: {
        'Content-Type': 'video/webm',
        'Content-Length': object.size,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error streaming video:', error);
    return c.json({ error: 'Failed to stream video' }, 500);
  }
});

// Download video
videosRouter.get('/:id/download', async (c) => {
  const videoId = c.req.param('id');

  try {
    const video = await c.env.DB.prepare(
      'SELECT * FROM videos WHERE id = ?'
    ).bind(videoId).first();

    if (!video) {
      return c.json({ error: 'Video not found' }, 404);
    }

    if (video.is_expired || video.expires_at < Date.now()) {
      return c.json({ error: 'Video expired' }, 410);
    }

    // Get video from R2
    const object = await c.env.VIDEOS_BUCKET.get(video.r2_key);
    
    if (!object) {
      return c.json({ error: 'Video file not found' }, 404);
    }

    // Return video with download headers
    return new Response(object.body, {
      headers: {
        'Content-Type': 'video/webm',
        'Content-Disposition': `attachment; filename="${video.filename}"`,
        'Content-Length': object.size,
      },
    });
  } catch (error) {
    console.error('Error downloading video:', error);
    return c.json({ error: 'Failed to download video' }, 500);
  }
});

// Request expired video
videosRouter.post('/:id/request', async (c) => {
  const videoId = c.req.param('id');

  try {
    const { requesterEmail } = await c.req.json();

    const video = await c.env.DB.prepare(
      'SELECT v.*, u.email as owner_email, u.name as owner_name FROM videos v JOIN users u ON v.user_id = u.id WHERE v.id = ?'
    ).bind(videoId).first();

    if (!video) {
      return c.json({ error: 'Video not found' }, 404);
    }

    // Store request
    await c.env.DB.prepare(
      'INSERT INTO video_requests (video_id, requester_email, requested_at) VALUES (?, ?, ?)'
    ).bind(videoId, requesterEmail || null, Date.now()).run();

    // Send email to video owner
    await sendEmailNotification(c.env, {
      to: video.owner_email,
      subject: 'Someone requested your expired video',
      videoId,
      videoFilename: video.filename,
      requesterEmail: requesterEmail || 'Anonymous',
      ownerName: video.owner_name,
    });

    return c.json({ success: true, message: 'Request sent to video owner' });
  } catch (error) {
    console.error('Error requesting video:', error);
    return c.json({ error: 'Failed to send request' }, 500);
  }
});

// Re-upload expired video
videosRouter.post('/:id/reupload', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const videoId = c.req.param('id');

  try {
    const video = await c.env.DB.prepare(
      'SELECT * FROM videos WHERE id = ? AND user_id = ?'
    ).bind(videoId, user.id).first();

    if (!video) {
      return c.json({ error: 'Video not found or unauthorized' }, 404);
    }

    const { expirationType = '24h' } = await c.req.json();
    const expiresAt = calculateExpirationTime(expirationType);

    // Update video expiration
    await c.env.DB.prepare(
      'UPDATE videos SET expires_at = ?, is_expired = 0, expiration_type = ? WHERE id = ?'
    ).bind(expiresAt, expirationType, videoId).run();

    // Get all pending requests for this video
    const { results: requests } = await c.env.DB.prepare(
      'SELECT * FROM video_requests WHERE video_id = ? AND fulfilled = 0'
    ).bind(videoId).all();

    // Mark requests as fulfilled
    await c.env.DB.prepare(
      'UPDATE video_requests SET fulfilled = 1 WHERE video_id = ?'
    ).bind(videoId).run();

    // Send notification emails to requesters
    for (const request of requests) {
      if (request.requester_email) {
        await sendEmailNotification(c.env, {
          to: request.requester_email,
          subject: 'Video you requested is now available',
          videoId,
          videoFilename: video.filename,
          isReuploadNotification: true,
        });
      }
    }

    return c.json({
      success: true,
      shareUrl: `${c.env.APP_URL}/video.html?v=${videoId}`,
    });
  } catch (error) {
    console.error('Error re-uploading video:', error);
    return c.json({ error: 'Failed to re-upload video' }, 500);
  }
});

// Delete video
videosRouter.delete('/:id', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const videoId = c.req.param('id');

  try {
    const video = await c.env.DB.prepare(
      'SELECT * FROM videos WHERE id = ? AND user_id = ?'
    ).bind(videoId, user.id).first();

    if (!video) {
      return c.json({ error: 'Video not found or unauthorized' }, 404);
    }

    // Delete from R2
    await deleteFromR2(c.env, video.r2_key);

    // Delete from database
    await c.env.DB.prepare('DELETE FROM videos WHERE id = ?').bind(videoId).run();
    await c.env.DB.prepare('DELETE FROM video_requests WHERE video_id = ?').bind(videoId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting video:', error);
    return c.json({ error: 'Failed to delete video' }, 500);
  }
});

