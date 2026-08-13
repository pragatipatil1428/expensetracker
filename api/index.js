import app from '../server/app.js';
import { connectDB } from '../server/config/db.js';

// Vercel serverless entry point for the Spendly API.
//
// The Express app lives in server/app.js; this function is what Vercel runs
// for every request under /api (see the rewrites in vercel.json). Because
// serverless functions are cold-started, we make sure MongoDB is connected
// before handing the request to Express. connectDB caches the connection so
// warm instances reuse it instead of opening a new one per request.

// Give cold starts (first request after idle) time to open the MongoDB connection.
export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (!process.env.MONGODB_URI) {
    res.status(500).json({
      message:
        'MONGODB_URI is not set. Add it to the Vercel project environment variables.',
    });
    return;
  }

  try {
    await connectDB(process.env.MONGODB_URI);
  } catch (err) {
    // Surface the real cause (e.g. Atlas network access) instead of a 504.
    console.error('MongoDB connection failed:', err);
    res.status(500).json({
      message: `Database connection failed: ${err.message}`,
    });
    return;
  }

  return app(req, res);
}
