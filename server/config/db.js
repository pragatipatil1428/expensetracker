import mongoose from 'mongoose';

// Serverless-safe connection: cache the connect promise at module scope so
// warm Vercel function instances reuse the existing MongoDB connection
// instead of opening a new one on every invocation.
let connectionPromise = null;

export async function connectDB(uri) {
  const readyState = mongoose.connection.readyState;
  // 1 = connected, 2 = connecting — reuse what's already there.
  if (readyState === 1 || readyState === 2) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri, {
      // Fail fast instead of hanging the whole function budget when the
      // database is unreachable (e.g. Atlas network access blocks Vercel).
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 10000,
    });
  }

  try {
    const conn = await connectionPromise;
    console.log(
      `MongoDB connected: ${conn.connection.host}/${conn.connection.name}`
    );
    return conn;
  } catch (err) {
    // Don't cache a rejection — allow a retry on the next invocation.
    connectionPromise = null;
    throw err;
  }
}
