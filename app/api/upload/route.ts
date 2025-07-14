export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { extractTextFromImage } from "@/lib/azureOCR";
import { analyzeBookText } from "@/lib/gemini";
import { connectToDB } from "@/lib/mongodb";
import Book from "@/models/Book";

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. OCR
    const text = await extractTextFromImage(buffer);

    // 2. Analisis Gemini
    const rawData = await analyzeBookText(text);

    // 3. Tambah tanggalInput & atur nilai default
    const data = {
      ...rawData,
      tanggalInput: new Date().toISOString().split("T")[0],
      edisi: rawData.edisi || "1",
      sumber: rawData.sumber || "hibah",
      ket: "1 eks",
      level: rawData.level || "", // 👈 Tambahkan ini
    };

    await connectToDB();
    const saved = await Book.create(data);

    return NextResponse.json({ success: true, book: saved });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
};
