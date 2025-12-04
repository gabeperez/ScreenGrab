import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize R2 client
export function getR2Client(env) {
  return new S3Client({
    region: 'auto',
    endpoint: env.VIDEOS_BUCKET.endpoint,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

// Generate presigned upload URL
export async function generatePresignedUploadUrl(env, key, expiresIn = 3600) {
  // For Workers R2, we use the binding directly
  // We'll generate a unique upload URL that the frontend can PUT to
  const uploadUrl = await env.VIDEOS_BUCKET.createMultipartUpload(key);
  return uploadUrl;
}

// Generate presigned download URL
export async function generatePresignedDownloadUrl(env, key, expiresIn = 3600) {
  // For R2 bindings, we can create signed URLs using the binding
  const url = new URL(`https://${env.VIDEOS_BUCKET_DOMAIN}/${key}`);
  return url.toString();
}

// Delete object from R2
export async function deleteFromR2(env, key) {
  try {
    await env.VIDEOS_BUCKET.delete(key);
    return true;
  } catch (error) {
    console.error('Error deleting from R2:', error);
    return false;
  }
}

// Get object from R2
export async function getFromR2(env, key) {
  try {
    const object = await env.VIDEOS_BUCKET.get(key);
    return object;
  } catch (error) {
    console.error('Error getting from R2:', error);
    return null;
  }
}

// Put object to R2
export async function putToR2(env, key, value, options = {}) {
  try {
    await env.VIDEOS_BUCKET.put(key, value, options);
    return true;
  } catch (error) {
    console.error('Error putting to R2:', error);
    return false;
  }
}

