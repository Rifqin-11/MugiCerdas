import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Book from "@/models/Book";

export const GET = async () => {
  try {
    await connectToDB();
    const books = await Book.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, books });
  } catch (error) {
    console.error("❌ Error GET /api/books:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch books" },
      { status: 500 }
    );
  }
};
