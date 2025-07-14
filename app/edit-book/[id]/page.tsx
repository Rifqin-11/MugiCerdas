"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { DatePicker } from "@/components/DatePicker"; // ganti sesuai path kamu

interface BookData {
  _id?: string;
  no?: number;
  tanggalInput: string;
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
  ket: string;
  isbn: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export default function EditBookPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [bookData, setBookData] = useState<BookData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await fetch(`/api/books/${id}`);
        if (!res.ok) throw new Error("Failed to fetch book data");
        const data = await res.json();

        // Remove unwanted fields
        const { _id, createdAt, updatedAt, __v, ...cleaned } = data;
        setBookData(cleaned);
      } catch (err) {
        toast({
          title: "Failed to load",
          description: "Could not fetch book data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchBook();
  }, [id]);

  const handleInputChange = (field: keyof BookData, value: string) => {
    setBookData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const formatted = format(date, "yyyy-MM-dd");
      setBookData((prev) =>
        prev ? { ...prev, tanggalInput: formatted } : prev
      );
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData),
      });

      if (!res.ok) throw new Error();

      toast({
        title: "Success",
        description: "Book has been updated successfully.",
      });

      router.push("/my-library");
    } catch {
      toast({
        title: "Error",
        description: "An error occurred while saving changes.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    toast({
      title: "Edit canceled",
      description: "Changes were not saved.",
      variant: "destructive",
    });

    router.push("/my-library");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-2 text-gray-600">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading book data...</span>
        </div>
      </div>
    );
  }

  if (!bookData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Edit Book
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Update book details and save changes
            </p>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {showPreview ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div
            className={`bg-white rounded-xl shadow-md p-6 ${
              showPreview ? "" : "lg:col-span-2"
            }`}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Book Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(bookData).map(([key, value]) => {
                if (["_id", "__v", "createdAt", "updatedAt"].includes(key))
                  return null;

                if (key === "tanggalInput") {
                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Input Date
                      </label>
                      <DatePicker value={value} onChange={handleDateChange} />
                    </div>
                  );
                }

                return (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        handleInputChange(key as keyof BookData, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-8">
              <button
                onClick={handleSave}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Check className="w-5 h-5" />
                Save Changes
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

        <div className="text-center text-gray-500 text-sm">
          <p>&copy; 2025 Mugi Cerdas. Smart cataloging for modern libraries.</p>
        </div>
      </div>
    </div>
  );
}
