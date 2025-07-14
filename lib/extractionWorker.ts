// lib/extractionWorker.ts

import { extractTextFromImage } from "@/lib/azureOCR";
import { analyzeBookText } from "@/lib/gemini";
import { connectToDB } from "@/lib/mongodb";
import Book from "@/models/Book";

// Fungsi ini sengaja tidak mengembalikan promise (fire and forget)
export function runExtraction(imageBuffer: Buffer, jobId: string) {
  // Kita bungkus dalam fungsi async agar bisa menggunakan await di dalamnya
  const process = async () => {
    try {
      // 1. OCR
      const text = await extractTextFromImage(imageBuffer);

      // 2. Analisis Gemini
      const rawData = await analyzeBookText(text);

      // 3. Siapkan data final
      const finalData = {
        ...rawData,
        status: "completed", // Ubah status menjadi 'completed'
        edisi: rawData.edisi || "1",
        sumber: rawData.sumber || "hibah",
        ket: "1 eks",
        level: rawData.level || "",
      };

      // 4. Update data di database berdasarkan jobId
      await connectToDB();
      await Book.findByIdAndUpdate(jobId, finalData);
      console.log(`✅ Job ${jobId} completed successfully.`);
    } catch (error) {
      console.error(`🟥 Job ${jobId} failed:`, error);
      // Update status di DB menjadi 'failed' agar UI bisa menampilkannya
      await connectToDB();
      await Book.findByIdAndUpdate(jobId, { status: "failed" });
    }
  };

  // Jalankan prosesnya
  process();
}
