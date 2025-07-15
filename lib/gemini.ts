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
  "noPanggil": "",          // Gabungkan semua bagian, termasuk kode koleksi (seperti "PB") dan huruf akhir (seperti "k"), contoh: "PB 398.209 598 GRI k"
  "ket": "",                // Tuliskan "1 eks"
  "isbn": "",               // Nomor ISBN
  "level": ""
}

Catatan penting:
- Jika nama pengarang ditulis dalam bentuk "nama belakang, nama depan", JANGAN ubah urutannya.
- Tetap simpan seperti itu: "Doe, John" bukan "John Doe".
- Jika deskripsi fisik mengandung "iv" atau angka romawi halaman awal, abaikan dan hanya ambil halaman utama dan ukuran (contoh: "iv, 16 hlm.; 29 cm." menjadi "16 hlm.; 29 cm.")
- Untuk "noPanggil", pastikan menyertakan **seluruh bagian**, termasuk:
  - Kode koleksi (contoh: "PB")
  - Klasifikasi DDC (angka)
  - Kode tambahan (contoh: "598")
  - Tiga huruf awal nama pengarang (contoh: "GRI")
  - Pastikan huruf kecil di akhir No. Panggil seperti "i", "k", atau lainnya tidak diabaikan atau dihilangkan. Contoh: "PB 398.209 598 GRI i".

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
