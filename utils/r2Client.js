// utils/r2Client.js
require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

async function uploadToR2({ key, body, contentType }) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType || 'video/mp4',
    ACL: 'public-read'
  });
  await s3.send(command);
  return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET}/${key}`;
}

module.exports = { uploadToR2 }; 