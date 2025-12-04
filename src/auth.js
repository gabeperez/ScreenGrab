import { Hono } from 'hono';
import { SignJWT, jwtVerify } from 'jose';
import { getCookie, setCookie } from 'hono/cookie';

export const authRouter = new Hono();

// Middleware to verify JWT and attach user to context
export async function authMiddleware(c, next) {
  // Try to get token from cookie first
  let token = getCookie(c, 'auth_token');
  
  // If no cookie, try Authorization header
  if (!token) {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (!token) {
    c.set('user', null);
    return next();
  }

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    c.set('user', payload);
  } catch (error) {
    c.set('user', null);
  }

  return next();
}

// Generate JWT token
async function generateToken(user, env) {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
  return token;
}

// Generate random ID
function generateId() {
  return crypto.randomUUID();
}

// OAuth: Initiate Google login
authRouter.get('/google', async (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${c.env.APP_URL}/api/auth/google/callback`;
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('access_type', 'online');

  return c.redirect(authUrl.toString());
});

// OAuth: Handle Google callback
authRouter.get('/google/callback', async (c) => {
  const code = c.req.query('code');
  
  if (!code) {
    return c.redirect(`${c.env.APP_URL}/?error=no_code`);
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${c.env.APP_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokens = await tokenResponse.json();
    
    // Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = await userInfoResponse.json();

    // Check if user exists
    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE google_id = ?'
    ).bind(userInfo.id).first();

    let userId;
    if (existingUser) {
      userId = existingUser.id;
      // Update user info
      await c.env.DB.prepare(
        'UPDATE users SET email = ?, name = ? WHERE id = ?'
      ).bind(userInfo.email, userInfo.name, userId).run();
    } else {
      // Create new user
      userId = generateId();
      await c.env.DB.prepare(
        'INSERT INTO users (id, email, name, google_id, created_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(userId, userInfo.email, userInfo.name, userInfo.id, Date.now()).run();
    }

    // Generate JWT
    const token = await generateToken(
      { id: userId, email: userInfo.email, name: userInfo.name },
      c.env
    );

    // Set cookie (for same-domain requests)
    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    // Redirect to dashboard with token in URL (for cross-domain setup)
    return c.redirect(`${c.env.APP_URL}/dashboard.html?token=${token}`);
  } catch (error) {
    console.error('OAuth error:', error);
    return c.redirect(`${c.env.APP_URL}/?error=auth_failed`);
  }
});

// Get current user
authRouter.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  return c.json({ user });
});

// Logout
authRouter.post('/logout', (c) => {
  setCookie(c, 'auth_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 0,
    path: '/',
  });
  return c.json({ success: true });
});

