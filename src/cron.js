// Cron job handler for scheduled tasks

export async function handleScheduled(env) {
  console.log('Running scheduled task: marking expired videos');

  try {
    const now = Date.now();

    // Find videos that have passed their expiration time but aren't marked as expired
    const { results: expiredVideos } = await env.DB.prepare(
      'SELECT id FROM videos WHERE expires_at < ? AND is_expired = 0'
    ).bind(now).all();

    if (expiredVideos.length === 0) {
      console.log('No videos to expire');
      return;
    }

    console.log(`Found ${expiredVideos.length} videos to mark as expired`);

    // Mark all expired videos
    await env.DB.prepare(
      'UPDATE videos SET is_expired = 1 WHERE expires_at < ? AND is_expired = 0'
    ).bind(now).run();

    // Optional: Delete videos that have been expired for more than 7 days
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const { results: oldExpiredVideos } = await env.DB.prepare(
      'SELECT id, r2_key FROM videos WHERE expires_at < ? AND is_expired = 1'
    ).bind(sevenDaysAgo).all();

    if (oldExpiredVideos.length > 0) {
      console.log(`Deleting ${oldExpiredVideos.length} old expired videos from R2`);
      
      // Delete from R2
      for (const video of oldExpiredVideos) {
        try {
          await env.VIDEOS_BUCKET.delete(video.r2_key);
        } catch (error) {
          console.error(`Error deleting video ${video.id} from R2:`, error);
        }
      }

      // Delete from database
      const videoIds = oldExpiredVideos.map(v => v.id);
      for (const id of videoIds) {
        await env.DB.prepare('DELETE FROM videos WHERE id = ?').bind(id).run();
        await env.DB.prepare('DELETE FROM video_requests WHERE video_id = ?').bind(id).run();
      }
    }

    console.log('Scheduled task completed successfully');
  } catch (error) {
    console.error('Error in scheduled task:', error);
    throw error;
  }
}

