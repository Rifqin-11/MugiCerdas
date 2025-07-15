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

export const POST = async (req: Request) => {
  try {
    const body = await req.json();

    // Validasi field wajib
    const requiredFields = [
      "judul",
      "pengarang",
      "penerbit",
      "tahunTerbit",
      "isbn",
      "level",
    ];

    for (const field of requiredFields) {
      if (!body[field] || body[field].toString().trim() === "") {
        return NextResponse.json(
          {
            success: false,
            error: `Field "${field}" is required and cannot be empty.`,
          },
          { status: 400 }
        );
      }
    }

    await connectToDB();

    const judul = body.judul.trim();
    const pengarang = body.pengarang.trim();
    const isbn = body.isbn.trim();

    // Cek apakah sudah ada buku dengan judul+pengarang atau ISBN
    const existingBook = await Book.findOne({
      $or: [
        {
          judul: new RegExp(`^${judul}$`, "i"),
          pengarang: new RegExp(`^${pengarang}$`, "i"),
        },
        {
          isbn: new RegExp(`^${isbn}$`, "i"),
        },
      ],
    });

    if (existingBook) {
      // Update jumlah eksisting
      const prevKet = existingBook.ket || "1 eks";
      const prevCount = parseInt(prevKet) || 1;
      const newCount = prevCount + 1;

      existingBook.ket = `${newCount} eks`;
      await existingBook.save();

      return NextResponse.json(
        { success: true, updated: true, book: existingBook },
        { status: 200 }
      );
    }

    // Jika belum ada, buat baru
    const createdBook = await Book.create({
      ...body,
      ket: body.ket || "1 eks", // default jika kosong
    });

    return NextResponse.json(
      { success: true, created: true, book: createdBook },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error POST /api/books:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create or update book" },
      { status: 500 }
    );
  }
};
