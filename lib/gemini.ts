import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeBookText(rawText: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite-preview-06-17", // Disarankan menggunakan model terbaru
  });

  const prompt = `
Kamu adalah asisten perpustakaan ahli yang mengekstrak data katalog dari hasil OCR sebuah buku.
Ubah teks berikut menjadi objek JSON dengan struktur yang telah ditentukan.

{
  "pengarang": "",
  "judul": "",
  "edisi": "",
  "kotaTerbit": "",
  "penerbit": "",
  "tahunTerbit": "",
  "deskripsiFisik": "",
  "sumber": "",
  "subjek": "",
  "noPanggil": "",
  "ket": "",
  "isbn": "",
  "level": ""
}

Catatan penting:
- Jika nama pengarang ditulis dalam bentuk "nama belakang, nama depan", JANGAN ubah urutannya.
- Untuk "edisi", ambil angka dari informasi cetakan atau tulis "1" jika cetakan pertama.
- Untuk "deskripsiFisik", abaikan angka romawi untuk halaman awal (misal: "iv"). Contoh: "iv, 20 hlm.; 22,9 cm" menjadi "20 hlm.; 22,9 cm".
- Untuk "sumber", jika tidak ada, tulis "hibah".
- Untuk "subjek", ambil hanya poin nomor 1 dari bagian subjek.
- Untuk "ket", selalu tuliskan "1 eks".
- **Untuk "noPanggil"**: Temukan nomor panggil yang biasanya berada di dalam kotak Katalog Dalam Terbitan (KDT) dan mungkin terbagi menjadi beberapa baris. Gabungkan semua baris tersebut menjadi satu string tunggal, dengan setiap bagian dipisahkan oleh satu spasi. Pastikan untuk menyertakan semua elemen: kode klasifikasi (misal: PB), nomor DDC, tiga huruf nama pengarang (misal: GRI), dan satu huruf kecil judul di akhir (misal: i).
  Contoh input dari OCR:
  PB
  398.209 598
  GRI
  i
  Hasil JSON yang benar untuk "noPanggil": "PB 398.209 598 GRI i"

Teks OCR:
"""
${rawText}
"""
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Ekstrak konten JSON dari respons teks
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1) {
    const jsonString = text.slice(jsonStart, jsonEnd + 1);
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("Gagal mem-parsing JSON:", e);
      return null;
    }
  }
  console.error("Tidak dapat menemukan objek JSON dalam respons.");
  return null;
}
