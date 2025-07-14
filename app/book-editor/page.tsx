"use client";

import { useState, useEffect } from 'react';
import { Save, ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

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
  ket: string;
  isbn: string;
}

export default function BookEditor() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
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
    ket: "1 eks",
    isbn: "978-1-234-56789-0"
  });

useEffect(() => {
  // Ambil gambar
  const imageData = sessionStorage.getItem("uploadedBookImage");
  if (imageData) setUploadedImage(imageData);

  // Ambil data hasil ekstraksi
  const extractedData = sessionStorage.getItem("extractedBookData");
  if (extractedData) {
    try {
      const parsed = JSON.parse(extractedData);
      // Hapus _id, __v, createdAt, updatedAt jika ada
      const { _id, __v, createdAt, updatedAt, ...cleaned } = parsed;
      setBookData(cleaned);
    } catch (err) {
      console.error("Gagal memuat data buku dari sessionStorage:", err);
    }
  }
}, []);


  const handleInputChange = (field: keyof BookData, value: string) => {
    setBookData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Get existing books from localStorage
    const existingBooks = JSON.parse(localStorage.getItem('libraryBooks') || '[]');

    // Check if book with same data already exists
    const duplicateIndex = existingBooks.findIndex((book: any) =>
      book.pengarang === bookData.pengarang &&
      book.judul === bookData.judul &&
      book.edisi === bookData.edisi &&
      book.penerbit === bookData.penerbit &&
      book.tahunTerbit === bookData.tahunTerbit
    );

    if (duplicateIndex !== -1) {
      // Update existing book's exemplar count
      const currentKet = existingBooks[duplicateIndex].ket;
      const currentCount = parseInt(currentKet.split(' ')[0]) || 1;
      existingBooks[duplicateIndex].ket = `${currentCount + 1} eks`;

      // Save updated books
      localStorage.setItem('libraryBooks', JSON.stringify(existingBooks));

      toast({
        title: "Book updated successfully!",
        description: `Exemplar count updated to ${currentCount + 1} for "${bookData.judul}".`,
      });
    } else {
      // Create new book entry with current date and auto-increment ID
      const newBook = {
        no: existingBooks.length + 1,
        tanggalInput: new Date().toISOString().split('T')[0],
        ...bookData
      };

      // Add new book to the list
      const updatedBooks = [...existingBooks, newBook];

      // Save to localStorage
      localStorage.setItem('libraryBooks', JSON.stringify(updatedBooks));

      toast({
        title: "Book saved successfully!",
        description: `"${bookData.judul}" has been added to your library.`,
      });
    }

    // Clear the uploaded image from sessionStorage
    sessionStorage.removeItem('uploadedBookImage');

    // Navigate to My Library
    router.push('/my-library');
  };

  const handleCancel = () => {
    // Show cancel toast
    toast({
      title: "Changes discarded",
      description: "Book data was not saved.",
      variant: "destructive",
    });

    // Clear the uploaded image from sessionStorage
    sessionStorage.removeItem('uploadedBookImage');

    // Navigate back to homepage
    router.push('/');
  };

  return (
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
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Image Preview Section */}
          {showPreview && uploadedImage && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Uploaded Image</h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={uploadedImage}
                  alt="Uploaded book page"
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>
            </div>
          )}

          {/* Form Section */}
          <div className={`bg-white rounded-xl shadow-md p-6 ${showPreview && uploadedImage ? '' : 'lg:col-span-2'}`}>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Book Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pengarang (Author)
                </label>
                <input
                  type="text"
                  value={bookData.pengarang}
                  onChange={(e) => handleInputChange('pengarang', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul (Title)
                </label>
                <input
                  type="text"
                  value={bookData.judul}
                  onChange={(e) => handleInputChange('judul', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Edition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edisi (Edition)
                </label>
                <input
                  type="text"
                  value={bookData.edisi}
                  onChange={(e) => handleInputChange('edisi', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kota Terbit (City)
                </label>
                <input
                  type="text"
                  value={bookData.kotaTerbit}
                  onChange={(e) => handleInputChange('kotaTerbit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Publisher */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Penerbit (Publisher)
                </label>
                <input
                  type="text"
                  value={bookData.penerbit}
                  onChange={(e) => handleInputChange('penerbit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tahun Terbit (Year)
                </label>
                <input
                  type="text"
                  value={bookData.tahunTerbit}
                  onChange={(e) => handleInputChange('tahunTerbit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Physical Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi Fisik (Physical Description)
                </label>
                <input
                  type="text"
                  value={bookData.deskripsiFisik}
                  onChange={(e) => handleInputChange('deskripsiFisik', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sumber (Source)
                </label>
                <select
                  value={bookData.sumber}
                  onChange={(e) => handleInputChange('sumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Purchase">Purchase</option>
                  <option value="Donation">Donation</option>
                  <option value="Exchange">Exchange</option>
                  <option value="Gift">Gift</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subjek (Subject)
                </label>
                <input
                  type="text"
                  value={bookData.subjek}
                  onChange={(e) => handleInputChange('subjek', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Call Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Panggil (Call Number)
                </label>
                <input
                  type="text"
                  value={bookData.noPanggil}
                  onChange={(e) => handleInputChange('noPanggil', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keterangan (Notes)
                </label>
                <input
                  type="text"
                  value={bookData.ket}
                  onChange={(e) => handleInputChange('ket', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* ISBN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ISBN
                </label>
                <input
                  type="text"
                  value={bookData.isbn}
                  onChange={(e) => handleInputChange('isbn', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 mt-8">
              <button
                onClick={handleSave}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Check className="w-5 h-5" />
                Save Book
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
        <div className="text-center text-gray-500 text-sm">
          <p>&copy; 2025 Mugi Cerdas. Smart cataloging for modern libraries.</p>
        </div>
      </div>
    </div>
  );
}
