// lib/azureOCR.ts
import axios from "axios";
import crypto from "crypto";

const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT!;
const AZURE_KEY = process.env.AZURE_KEY!;

// Cache sederhana di memori: { hashImage → teks OCR }
const ocrCache = new Map<string, string>();

export async function extractTextFromImage(
  imageBuffer: Buffer
): Promise<string> {
  // Hitung SHA-256 sebagai key cache
  const hash = crypto.createHash("sha256").update(imageBuffer).digest("hex");
  if (ocrCache.has(hash)) {
    console.log("⚡️ Menggunakan cache OCR");
    return ocrCache.get(hash)!;
  }

  const url = `${AZURE_ENDPOINT}/vision/v3.2/read/analyze`;
  const headers = {
    "Ocp-Apim-Subscription-Key": AZURE_KEY,
    "Content-Type": "application/octet-stream",
  };

  // 1. Kirim image buffer
  const resp = await axios.post(url, imageBuffer, { headers });
  const opLocation = resp.headers["operation-location"];
  if (!opLocation) {
    throw new Error("Gagal mendapatkan operation-location dari Azure OCR.");
  }

  // 2. Polling dengan interval 1 detik, maksimal 10 kali
  const POLL_INTERVAL = 1000;
  const MAX_ATTEMPTS = 10;
  let resultText: string | null = null;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    const poll = await axios.get(opLocation, {
      headers: { "Ocp-Apim-Subscription-Key": AZURE_KEY },
    });
    const status = poll.data.status;
    if (status === "succeeded") {
      // Gabungkan semua baris teks
      resultText = poll.data.analyzeResult.readResults
        .flatMap((r: any) => r.lines.map((l: any) => l.text))
        .join("\n");
      break;
    }
    if (status === "failed") {
      throw new Error("Azure OCR gagal memproses gambar.");
    }
  }

  if (!resultText) {
    throw new Error("Timeout OCR: Azure tidak merespon dalam batas waktu.");
  }

  // Simpan ke cache
  ocrCache.set(hash, resultText);
  return resultText;
}
