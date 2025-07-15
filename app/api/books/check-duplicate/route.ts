import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Book from "@/models/Book";

export const POST = async (req: Request) => {
  try {
    const { judul, pengarang, isbn } = await req.json();
    await connectToDB();

    const exists = await Book.exists({
      $or: [
        {
          judul: { $regex: new RegExp(`^${judul}$`, "i") },
          pengarang: { $regex: new RegExp(`^${pengarang}$`, "i") },
        },
        {
          isbn: { $regex: new RegExp(`^${isbn}$`, "i") },
        },
      ],
    });

    return NextResponse.json({ exists: !!exists });
  } catch (error) {
    console.error("❌ Error checking duplicate:", error);
    return NextResponse.json({ exists: false }, { status: 500 });
  }
};
