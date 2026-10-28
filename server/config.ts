import dotenv from 'dotenv';
dotenv.config();

function sanitizeMongoUri(raw?: string): string {
  if (!raw) return '';
  let uri = raw.trim();
  // Strip variable name prefix if user pasted "MONGO_URI=mongodb+srv://..."
  if (uri.startsWith('MONGO_URI=')) {
    uri = uri.slice('MONGO_URI='.length).trim();
  }
  // Strip surrounding double or single quotes
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }
  // If user pasted something like `mongodb+srv://...` with quotes inside
  uri = uri.replace(/^["']|["']$/g, '');
  return uri;
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'tracecrop_hackathon_jwt_secret_secure_key_2026',
  mongoUri: sanitizeMongoUri(process.env.MONGO_URI),
  geminiApiKey: (process.env.GEMINI_API_KEY || '').trim(),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
};
