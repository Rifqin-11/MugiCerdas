import { connectToDB } from "../lib/mongodb";
import BookModel from "../models/Book";

async function runMigration() {
  try {
    await connectToDB();

    const result = await BookModel.updateMany(
      { jumlahEks: { $exists: false } },
      { $set: { jumlahEks: 1 } }
    );

    console.log(
      `✅ Migration successful: ${result.modifiedCount} documents updated.`
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
