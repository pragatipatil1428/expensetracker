import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spendly';

// One-time migration for email reuse after soft delete: the old full unique
// index on `users.email` blocks registering a new account with a soft-deleted
// account's email. Replace it with a partial unique index that only covers
// live accounts (isDeleted: false), so deleted emails become free while live
// accounts stay unique.
async function migrate() {
  await mongoose.connect(MONGODB_URI);
  const users = mongoose.connection.db.collection('users');

  const indexes = await users.indexes();
  const emailIndexes = indexes.filter(
    (i) => i.name !== '_id_' && i.key && i.key.email === 1
  );
  const partial = emailIndexes.find((i) => i.partialFilterExpression);
  const full = emailIndexes.find((i) => !i.partialFilterExpression);

  if (full) {
    await users.dropIndex(full.name);
    console.log(`Dropped old full unique index "${full.name}"`);
  }

  if (!partial) {
    await users.createIndex(
      { email: 1 },
      { unique: true, partialFilterExpression: { isDeleted: false } }
    );
    console.log('Created partial unique index on users.email (live accounts only)');
  } else {
    console.log('Partial unique index already present — nothing to create');
  }

  console.log('Final email indexes:', JSON.stringify((await users.indexes()).filter((i) => i.name !== '_id_'), null, 2));

  await mongoose.disconnect();
  console.log('Done.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
