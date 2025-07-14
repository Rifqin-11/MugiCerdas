"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileImage, Loader2, Eye, Save } from "lucide-react";
import Link from "next/link";
import NextImage from "next/image";

// Fungsi untuk compress & resize image
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 1024;
  let [w, h] = [bitmap.width, bitmap.height];
  if (w > h && w > maxDim) {
    h = Math.round((h * maxDim) / w);
    w = maxDim;
  } else if (h > w && h > maxDim) {
    w = Math.round((w * maxDim) / h);
    h = maxDim;
  }

  // Pilih OffscreenCanvas jika tersedia
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(w, h)
      : document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx && "drawImage" in ctx) {
    ctx.drawImage(bitmap, 0, 0, w, h);
  } else {
    throw new Error("2D rendering context not available or does not support drawImage.");
  }

  return new Promise((resolve) => {
    if ("convertToBlob" in canvas) {
      (canvas as OffscreenCanvas)
        .convertToBlob({ type: "image/jpeg", quality: 0.7 })
        .then(resolve);
    } else {
      (canvas as HTMLCanvasElement).toBlob(
        (blob) => resolve(blob!),
        "image/jpeg",
        0.7
      );
    }
  });
}

export default function Home() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleExtractData = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    setIsExtracting(true);
    try {
      const blob = await compressImage(selectedFile);
      const formData = new FormData();
      formData.append("file", blob, selectedFile.name);

      // 👉 Endpoint diganti ke /api/upload
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to extract data");
      }

      const { book } = await res.json();
      sessionStorage.setItem("extractedBookData", JSON.stringify(book));

      if (previewUrl) {
        const img = new Image();
        img.src = previewUrl;
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = img.width;
          c.height = img.height;
          c.getContext("2d")!.drawImage(img, 0, 0);
          sessionStorage.setItem(
            "uploadedBookImage",
            c.toDataURL("image/jpeg", 0.8)
          );
          router.push("/book-editor");
        };
      } else {
        router.push("/book-editor");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Extraction failed: ${err.message}`);
      setIsExtracting(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Mugi Cerdas Library
          </h1>
          <p className="text-xl text-gray-600">
            Smart book cataloging with just one photo
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Upload Book Info Page
          </h2>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
              selectedFile
                ? "border-green-400 bg-green-50"
                : "border-blue-300 hover:border-blue-400 bg-blue-50"
            }`}
            onClick={() => document.getElementById("file-input")!.click()}
          >
            {selectedFile ? (
              <FileImage className="w-12 h-12 text-green-500 mx-auto" />
            ) : (
              <Upload className="w-12 h-12 text-blue-500 mx-auto" />
            )}

            {selectedFile ? (
              <>
                {previewUrl && (
                  <div className="flex justify-center my-3">
                    <NextImage
                      src={previewUrl}
                      alt="Preview"
                      width={128}
                      height={128}
                      className="rounded-lg border border-gray-200"
                    />
                  </div>
                )}
                <p className="text-gray-800">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </>
            ) : (
              <p className="text-gray-600">
                Drag & drop or click to browse (JPG/PNG, max 10 MB)
              </p>
            )}

            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <button
            onClick={handleExtractData}
            disabled={isExtracting || !selectedFile}
            className={`w-full py-3 rounded-lg font-medium flex justify-center items-center gap-2 ${
              isExtracting || !selectedFile
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {isExtracting ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              "Extract Data"
            )}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Manage Your Library
              </h3>
              <p className="text-sm text-gray-600">
                View, search, and export your books
              </p>
            </div>
          </div>
          <Link
            href="/my-library"
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow"
          >
            Go to Library
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-8 text-center">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Upload",
                desc: "Upload a book info page photo and let our AI extract the bibliographic data automatically",
                icon: <Upload className="w-8 h-8 text-blue-500" />,
                bg: "bg-blue-100",
              },
              {
                title: "Review",
                desc: "Review and edit the extracted information to ensure accuracy before saving",
                icon: <Eye className="w-8 h-8 text-teal-500" />,
                bg: "bg-teal-100",
              },
              {
                title: "Save",
                desc: "Store and manage your book data in an organized, searchable catalog",
                icon: <Save className="w-8 h-8 text-green-500" />,
                bg: "bg-green-100",
              },
            ].map(({ title, desc, icon, bg }) => (
              <div className="text-center space-y-4" key={title}>
                <div className="flex justify-center">
                  <div
                    className={`w-16 h-16 ${bg} rounded-full flex items-center justify-center`}
                  >
                    {icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                <p className="text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          &copy; 2025 Mugi Cerdas Library
        </div>
      </div>
    </div>
  );
}
