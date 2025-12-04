// Email notification using Resend API

export async function sendEmailNotification(env, { to, subject, videoId, videoFilename, requesterEmail, ownerName, isReuploadNotification = false }) {
  const resendApiKey = env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return;
  }

  let htmlContent;
  
  if (isReuploadNotification) {
    // Email to requester: video is now available
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Video Now Available! 🎥</h2>
          <p>Great news! The video you requested is now available to watch.</p>
          <p><strong>Video:</strong> ${videoFilename}</p>
          <a href="${env.APP_URL}/video.html?v=${videoId}" class="button">Watch Video</a>
          <p>This video will expire based on the owner's settings, so watch it soon!</p>
          <div class="footer">
            <p>You received this email because you requested access to an expired video on ScreenGrab.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  } else {
    // Email to owner: someone requested expired video
    htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .info-box { background-color: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Video Request Notification 📧</h2>
          <p>Hi ${ownerName || 'there'},</p>
          <p>Someone is trying to access one of your expired videos:</p>
          <div class="info-box">
            <p><strong>Video:</strong> ${videoFilename}</p>
            <p><strong>Requested by:</strong> ${requesterEmail}</p>
            <p><strong>Video ID:</strong> ${videoId}</p>
          </div>
          <p>If you'd like to share this video again, you can re-upload it from your dashboard. The link will be automatically sent to the requester.</p>
          <a href="${env.APP_URL}/dashboard.html" class="button">Go to Dashboard</a>
          <div class="footer">
            <p>This is an automated notification from ScreenGrab. You're receiving this because someone requested access to your expired video.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ScreenGrab <noreply@screengrab.app>', // Update with your verified domain
        to: [to],
        subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result.id);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

