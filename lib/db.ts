import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is required");
}

const mongoUri = uri;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as {
  mongooseCache?: MongooseCache;
};

const cache = globalForMongoose.mongooseCache ?? {
  conn: null,
  promise: null
};

globalForMongoose.mongooseCache = cache;

export async function connectDb() {
  if (cache.conn) {
    return cache.conn;
  }

  cache.promise ??= mongoose.connect(mongoUri, {
    dbName: "afajics",
    bufferCommands: false
  });

  cache.conn = await cache.promise;
  return cache.conn;
}
