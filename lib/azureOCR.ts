import axios from "axios";

const AZURE_ENDPOINT = process.env.AZURE_ENDPOINT!;
const AZURE_KEY = process.env.AZURE_KEY!;

export async function extractTextFromImage(imageBuffer: Buffer) {
  const url = `${AZURE_ENDPOINT}/vision/v3.2/read/analyze`;

  try {
    console.log("🔵 Mengirim gambar ke Azure OCR...");

    const response = await axios.post(url, imageBuffer, {
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_KEY,
        "Content-Type": "application/octet-stream",
      },
    });

    const operationLocation = response.headers["operation-location"];
    console.log("📍 Azure operation-location:", operationLocation);

    if (!operationLocation) {
      throw new Error("Gagal mendapatkan operation-location dari Azure OCR.");
    }

    let result: string | null = null;

    for (let i = 0; i < 15; i++) {
      console.log(`⏳ Polling status Azure OCR (attempt ${i + 1})...`);
      await new Promise((res) => setTimeout(res, 1500));

      const poll = await axios.get(operationLocation, {
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_KEY,
        },
      });

      const status = poll.data.status;
      console.log(`📦 Status OCR: ${status}`);

      if (status === "succeeded") {
        const lines = poll.data.analyzeResult.readResults
          .map((r: any) => r.lines.map((l: any) => l.text))
          .flat()
          .join("\n");

        result = lines;
        break;
      }

      if (status === "failed") {
        throw new Error("Azure OCR gagal memproses gambar.");
      }
    }

    if (!result) {
      throw new Error("OCR timeout atau tidak berhasil.");
    }

    console.log("✅ OCR berhasil dijalankan.");
    return result;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("🟥 Axios error:", error.response?.data || error.message);
    } else {
      console.error("🟥 General error:", error.message || error);
    }
    throw new Error("Proses OCR gagal dijalankan.");
  }
}
