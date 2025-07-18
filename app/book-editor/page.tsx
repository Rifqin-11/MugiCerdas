"use client";

import { useState, useEffect } from "react";
import { Save, ArrowLeft, Check, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BookData {
  pengarang: string;
  judul: string;
  edisi: string;
  kotaTerbit: string;
  penerbit: string;
  tahunTerbit: string;
  deskripsiFisik: string;
  sumber: string;
  subjek: string;
  noPanggil: string;
  isbn: string;
  level: string;
  jumlahEks: number;
}

export default function BookEditor() {
  const router = useRouter();
  const { toast } = useToast();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [bookData, setBookData] = useState<BookData>({
    pengarang: "John Doe",
    judul: "Introduction to Programming",
    edisi: "1",
    kotaTerbit: "Jakarta",
    penerbit: "Tech Publisher",
    tahunTerbit: "2024",
    deskripsiFisik: "37 hlm; 27,5 cm",
    sumber: "Hibah",
    subjek: "Computer Science",
    noPanggil: "004.1 DOE i",
    isbn: "978-1-234-56789-0",
    level: "",
    jumlahEks: 1,
  });

  useEffect(() => {
    const imageData = sessionStorage.getItem("uploadedBookImage");
    if (imageData) setUploadedImage(imageData);

    const extractedData = sessionStorage.getItem("extractedBookData");
    if (extractedData) {
      try {
        const parsed = JSON.parse(extractedData);
        const { _id, __v, createdAt, updatedAt, ...cleaned } = parsed;
        setBookData(cleaned);
      } catch (err) {
        console.error("Gagal memuat data buku dari sessionStorage:", err);
      }
    }
  }, []);

  const handleInputChange = (field: keyof BookData, value: string) => {
    setBookData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

const checkDuplicateBook = async () => {
  const res = await fetch(`/api/books/check-duplicate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      judul: bookData.judul.trim(),
      pengarang: bookData.pengarang.trim(),
      isbn: bookData.isbn.trim(),
    }),
  });

  if (!res.ok) return false;

  const data = await res.json();

  // Jika buku duplikat, simpan ke sessionStorage
  if (data.exists && data.book?._id) {
    sessionStorage.setItem(
      "extractedBookData",
      JSON.stringify({ ...data.book })
    );
  }

  return data.exists;
};


  const handleSave = async () => {
    if (!bookData.level) {
      toast({
        title: "Level wajib diisi",
        description: "Silakan pilih level sebelum menyimpan buku.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const isDuplicateBook = await checkDuplicateBook();

    if (isDuplicateBook && !isDuplicate) {
      setShowConfirmDialog(true);
      setIsDuplicate(true);
      setIsSaving(false);
      return;
    }

    // langsung simpan jika tidak duplikat
    await submitBook();
  };

const submitBook = async () => {
  try {
    const extracted = sessionStorage.getItem("extractedBookData");
    const parsed = extracted ? JSON.parse(extracted) : null;
    const bookId = parsed?._id;

    let payload = { ...bookData };

    // Jika duplikat, tambahkan jumlahEksisting + 1
    if (bookId) {
      const currentEks = parsed.jumlahEks || 1;
      payload.jumlahEks = currentEks + 1;
    }

    const res = await fetch(bookId ? `/api/books/${bookId}` : "/api/books", {
      method: bookId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Failed to save data");

    toast({
      title: "Book saved successfully!",
      description: `"${bookData.judul}" has been ${
        bookId ? "updated" : "added"
      } to your library.`,
    });

    sessionStorage.removeItem("uploadedBookImage");
    sessionStorage.removeItem("extractedBookData");
    router.push("/my-library");
  } catch (err) {
    console.error(err);
    toast({
      title: "Error saving book",
      description: "Failed to save book to database.",
      variant: "destructive",
    });
  } finally {
    setIsSaving(false);
  }
};


  const handleCancel = () => {
    toast({
      title: "Changes discarded",
      description: "Book data was not saved.",
      variant: "destructive",
    });

    sessionStorage.removeItem("uploadedBookImage");
    router.push("/");
  };

  return (
    <>
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Book Detected</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mb-4">
            A book with the same title and author already exists. Are you sure
            you want to add another?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setIsDuplicate(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowConfirmDialog(false);
                setIsDuplicate(false); // Reset agar bisa klik Save lagi jika perlu
                submitBook(); // Lanjutkan simpan
              }}
            >
              Yes, Add It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                Book Editor
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Review and edit the extracted book information
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Preview Section */}
            {uploadedImage && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Uploaded Image
                </h2>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={uploadedImage}
                    alt="Uploaded book page"
                    className="w-full h-auto max-h-96 object-contain"
                    width={600}
                    height={400}
                  />
                </div>
              </div>
            )}

            {/* Form Section */}
            <div
              className={`bg-white rounded-xl shadow-md p-6 ${
                uploadedImage ? "" : "lg:col-span-2"
              }`}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Book Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Pengarang (Author)", field: "pengarang" },
                  { label: "Judul (Title)", field: "judul" },
                  { label: "Edisi (Edition)", field: "edisi" },
                  { label: "Kota Terbit (City)", field: "kotaTerbit" },
                  { label: "Penerbit (Publisher)", field: "penerbit" },
                  { label: "Tahun Terbit (Year)", field: "tahunTerbit" },
                  {
                    label: "Deskripsi Fisik (Physical Description)",
                    field: "deskripsiFisik",
                  },
                  { label: "Subjek (Subject)", field: "subjek" },
                  { label: "No. Panggil (Call Number)", field: "noPanggil" },
                  { label: "Keterangan (Notes)", field: "ket" },
                  { label: "ISBN", field: "isbn" },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={bookData[field as keyof BookData]}
                      onChange={(e) =>
                        handleInputChange(
                          field as keyof BookData,
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}

                {/* Source */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sumber (Source)
                  </label>
                  <select
                    value={bookData.sumber}
                    onChange={(e) =>
                      handleInputChange("sumber", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Hibah">Donation</option>
                    <option value="Pembelian">Purchase</option>
                    <option value="Pertukaran">Exchange</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level
                  </label>
                  <select
                    value={bookData.level}
                    onChange={(e) => handleInputChange("level", e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="" disabled>
                      Pilih Level
                    </option>
                    <option value="0">Tidak Ada Level</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="A">A</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="B3">B3</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-4 mt-8">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex-1 inline-flex items-center justify-center gap-2 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${
                    isSaving
                      ? "bg-green-300 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Save Book
                    </>
                  )}
                </button>

                <button
                  onClick={handleCancel}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm mt-10">
            <p>
              &copy; 2025 Mugi Cerdas. Smart cataloging for modern libraries.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
