// app/api/upload/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { extractTextFromImage } from "@/lib/azureOCR";
import { analyzeBookText } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  return NextResponse.json({ ok: true, message: "Upload endpoint is live" });
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileBlob = formData.get("file") as Blob | null;
    if (!fileBlob) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. OCR
    const ocrText = await extractTextFromImage(buffer);

    // 2. AI Analysis
    const rawData = await analyzeBookText(ocrText);

    // 3. Tambahkan default value
    const data = {
      ...rawData,
      tanggalInput: new Date().toISOString().split("T")[0],
      edisi: rawData.edisi || "1",
      sumber: rawData.sumber || "hibah",
      ket: rawData.ket || "1 eks",
      level: rawData.level || "",
    };

    // ⚠️ Tidak menyimpan ke database di sini
    return NextResponse.json({ success: true, book: data });
  } catch (error) {
    console.error("Error in POST /api/upload:", error);
    return NextResponse.json(
      { error: "Something went wrong during upload" },
      { status: 500 }
    );
  }
}
