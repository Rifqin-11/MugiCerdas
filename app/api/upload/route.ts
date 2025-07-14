// app/api/upload/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { extractTextFromImage } from "@/lib/azureOCR";
import { analyzeBookText } from "@/lib/gemini";
import { connectToDB } from "@/lib/mongodb";
import Book from "@/models/Book";

// Health‑check untuk memastikan endpoint hidup
export async function GET(req: NextRequest) {
  return NextResponse.json({ ok: true, message: "Upload endpoint is live" });
}

// Handle CORS preflight (opsional untuk same‑origin)
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(null, { status: 204 });
}

// Handler utama POST untuk menerima file, OCR, parse & simpan
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileBlob = formData.get("file") as Blob | null;
    if (!fileBlob) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Ubah Blob ke Buffer
    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. OCR (dengan cache & polling cepat)
    const ocrText = await extractTextFromImage(buffer);

    // 2. Analisis AI → JSON metadata
    const rawData = await analyzeBookText(ocrText);

    // 3. Lengkapi field default & tanggal input
    const data = {
      ...rawData,
      tanggalInput: new Date().toISOString().split("T")[0],
      edisi: rawData.edisi || "1",
      sumber: rawData.sumber || "hibah",
      ket: rawData.ket || "1 eks",
      level: rawData.level || "",
    };

    // 4. Simpan ke MongoDB
    await connectToDB();
    const savedBook = await Book.create(data);

    return NextResponse.json({ success: true, book: savedBook });
  } catch (error) {
    console.error("Error in POST /api/upload:", error);
    return NextResponse.json(
      { error: "Something went wrong during upload" },
      { status: 500 }
    );
  }
}
