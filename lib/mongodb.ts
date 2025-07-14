import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

declare global {
  // Use a unique name to avoid conflict with imported mongoose
  // eslint-disable-next-line no-var
  var mongooseGlobal: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

// Ensure global mongooseGlobal is initialized
globalThis.mongooseGlobal ||= { conn: null, promise: null };

export async function connectToDB(): Promise<typeof mongoose> {
  if (globalThis.mongooseGlobal?.conn) return globalThis.mongooseGlobal.conn;

  if (!globalThis.mongooseGlobal?.promise) {
    globalThis.mongooseGlobal!.promise = mongoose.connect(MONGODB_URI!, {
      dbName: "pendataanbuku",
      bufferCommands: false,
    });
  }

  globalThis.mongooseGlobal!.conn = await globalThis.mongooseGlobal!.promise;
  return globalThis.mongooseGlobal!.conn;
}
