"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Eye, Save, FileImage, Loader2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = event.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      const file = files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleExtractData = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    setIsExtracting(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to extract book data");
      }

      const result = await res.json();
      sessionStorage.setItem("extractedBookData", JSON.stringify(result.book));

      if (previewUrl) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const base64 = canvas.toDataURL("image/jpeg", 0.8);
          sessionStorage.setItem("uploadedBookImage", base64);
          router.push("/book-editor");
        };

        img.src = previewUrl;
      } else {
        router.push("/book-editor");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while extracting data.");
      setIsExtracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            Mugi Cerdas Library
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Smart book cataloging with just one photo
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Upload Book Info Page
          </h2>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              isDragOver
                ? "border-blue-400 bg-blue-50"
                : selectedFile
                ? "border-green-400 bg-green-50"
                : "border-blue-300 bg-blue-50 hover:border-blue-400"
            } cursor-pointer`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              const fileInput = document.querySelector(
                'input[type="file"]'
              ) as HTMLInputElement;
              fileInput?.click();
            }}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                {selectedFile ? (
                  <FileImage className="w-12 h-12 text-green-500" />
                ) : (
                  <Upload className="w-12 h-12 text-blue-500" />
                )}
              </div>

              {selectedFile ? (
                <div className="space-y-2">
                  <p className="text-green-600 font-medium">File selected:</p>
                  {previewUrl && (
                    <div className="flex justify-center mb-3">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-32 max-h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  <p className="text-sm text-gray-600">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-600">
                    Drag and drop an image here, or{" "}
                    <label className="text-blue-500 hover:text-blue-600 cursor-pointer font-medium">
                      browse files
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports: JPG, PNG, WEBP (Max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Extract Button */}
          <button
            onClick={handleExtractData}
            disabled={!selectedFile || isExtracting}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex justify-center items-center gap-2 ${
              !selectedFile || isExtracting
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg"
            }`}
          >
            {isExtracting ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                Extracting...
              </>
            ) : (
              "Extract Data"
            )}
          </button>
        </div>

        {/* How it works */}
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

        {/* My Library */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              Manage Your Library
            </h2>
            <p className="text-gray-600">
              View, search, and export your complete book catalog
            </p>
            <Link
              href="/my-library"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Eye className="w-5 h-5" />
              View My Library
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>&copy; 2025 Mugi Cerdas. Smart cataloging for modern libraries.</p>
        </div>
      </div>
    </div>
  );
}
