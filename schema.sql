-- Database schema for ScreenGrab
-- Run with: npm run db:init

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  google_id TEXT UNIQUE,
  created_at INTEGER NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  size_bytes INTEGER,
  duration_seconds INTEGER,
  expiration_type TEXT CHECK(expiration_type IN ('24h', '1week', '1month')),
  expires_at INTEGER NOT NULL,
  is_expired INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  view_count INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_expires_at ON videos(expires_at);
CREATE INDEX IF NOT EXISTS idx_videos_is_expired ON videos(is_expired);

-- Video requests table (for expired videos)
CREATE TABLE IF NOT EXISTS video_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT NOT NULL,
  requester_email TEXT,
  requested_at INTEGER NOT NULL,
  fulfilled INTEGER DEFAULT 0,
  FOREIGN KEY (video_id) REFERENCES videos(id)
);

-- Create index on video_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_video_requests_video_id ON video_requests(video_id);
CREATE INDEX IF NOT EXISTS idx_video_requests_fulfilled ON video_requests(fulfilled);

