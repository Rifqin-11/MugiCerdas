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
    await connectToDB();

    // Cek apakah buku dengan kombinasi field ini sudah ada
    const existingBook = await Book.findOne({
      judul: body.judul.trim(),
      pengarang: body.pengarang.trim(),
      penerbit: body.penerbit.trim(),
      tahunTerbit: body.tahunTerbit.trim(),
      isbn: body.isbn.trim(),
    });

    if (existingBook) {
      // Ambil jumlah eks sebelumnya
      const previousCount = parseInt(existingBook.ket) || 1;
      const newCount = previousCount + 1;

      existingBook.ket = `${newCount} eks`;
      await existingBook.save();

      return NextResponse.json(
        { success: true, updated: true, book: existingBook },
        { status: 200 }
      );
    }

    // Jika belum ada, simpan sebagai entri baru
    const createdBook = await Book.create({
      ...body,
      ket: body.ket || "1 eks", // default ke 1 eks jika tidak diisi
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

