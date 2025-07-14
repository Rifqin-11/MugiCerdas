import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeBookText(rawText: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite-preview-06-17",
  });

  const prompt = `
Kamu adalah asisten perpustakaan yang mengekstrak data dari hasil OCR buku.
Ubah teks berikut menjadi objek JSON dengan struktur:

{
  "pengarang": "",
  "judul": "",
  "edisi": "",              // Ambil angka atau tulis "1" jika cetakan pertama
  "kotaTerbit": "",
  "penerbit": "",
  "tahunTerbit": "",
  "deskripsiFisik": "",     // Contoh: "20 hlm.; 22,9 cm"
  "sumber": "",             // Jika tidak ada, tulis "hibah"
  "subjek": "",             // Ambil hanya poin 1 dari bagian subjek
  "noPanggil": "",          // Gabungkan semua bagian jadi satu baris, contoh: "398.209 598 GRI"
  "ket": "",                // Tuliskan "1 eks"
  "isbn": ""                // Nomor ISBN
}

Teks OCR:
"""
${rawText}
"""
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Ambil bagian JSON dari respon
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  const jsonString = text.slice(jsonStart, jsonEnd + 1);

  return JSON.parse(jsonString);
}
