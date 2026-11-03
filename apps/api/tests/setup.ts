import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';

const TEST_URI =
  process.env.MONGODB_URI_TEST ?? 'mongodb://127.0.0.1:27017/yaqeen_test';

beforeAll(async () => {
  await mongoose.connect(TEST_URI, {
    serverSelectionTimeoutMS: 10_000,
  });
});

afterEach(async () => {
  const { collections } = mongoose.connection;

  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
