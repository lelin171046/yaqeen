import { describe, expect, it } from 'vitest';
import { requireMongoUri, resolveMongoUri } from '../src/config/env.js';

describe('MongoDB URI mode selection', () => {
  it('uses the local URI outside production', () => {
    expect(
      resolveMongoUri({
        NODE_ENV: 'development',
        MONGODB_URI_LOCAL: 'mongodb://127.0.0.1:27017/local-db',
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.example/prod-db',
      }),
    ).toBe('mongodb://127.0.0.1:27017/local-db');
  });

  it('uses the production URI in production', () => {
    expect(
      resolveMongoUri({
        NODE_ENV: 'production',
        MONGODB_URI_LOCAL: 'mongodb://127.0.0.1:27017/local-db',
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.example/prod-db',
      }),
    ).toBe('mongodb+srv://user:pass@cluster.example/prod-db');
  });

  it('falls back to the shared URI for backwards compatibility', () => {
    expect(
      resolveMongoUri({
        NODE_ENV: 'development',
        MONGODB_URI: 'mongodb://127.0.0.1:27017/legacy-db',
      }),
    ).toBe('mongodb://127.0.0.1:27017/legacy-db');
  });

  it('rejects an invalid selected URI', () => {
    expect(() =>
      requireMongoUri({
        NODE_ENV: 'development',
        MONGODB_URI_LOCAL: '127.0.0.1:27017/local-db',
        MONGODB_URI: 'mongodb://127.0.0.1:27017/legacy-db',
      }),
    ).toThrow(/mongodb:\/\//);
  });
});
