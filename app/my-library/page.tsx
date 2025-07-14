"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Search,
  Filter,
  Book,
  Trash2,
  Pencil,
  AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import Link from "next/link";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BookData {
  _id: string;
  no: number;
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
}

export default function MyLibrary() {
  const [books, setBooks] = useState<BookData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bookToDelete, setBookToDelete] = useState<BookData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBooks = async () => {
      const res = await fetch("/api/books");
      const data = await res.json();
      setBooks(data.books);
    };
    fetchBooks();
  }, []);

  const handleDelete = async () => {
    if (!bookToDelete) return;
    try {
      const res = await fetch(`/api/books/${bookToDelete._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus");

      setBooks((prev) => prev.filter((b) => b._id !== bookToDelete._id));
      toast({
        title: "Buku berhasil dihapus",
        description: `"${bookToDelete.judul}" telah dihapus dari perpustakaan.`,
      });
      setBookToDelete(null);
    } catch (error) {
      toast({
        title: "Gagal menghapus",
        description: "Terjadi kesalahan saat menghapus buku.",
        variant: "destructive",
      });
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.pengarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.subjek.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      book.subjek.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const exportToExcel = () => {
    const excelData = filteredBooks.map((book) => ({
      No: book.no,
      "Tanggal Input": book.tanggalInput,
      Pengarang: book.pengarang,
      Judul: book.judul,
      Edisi: book.edisi,
      "Kota Terbit": book.kotaTerbit,
      Penerbit: book.penerbit,
      "Tahun Terbit": book.tahunTerbit,
      "Deskripsi Fisik": book.deskripsiFisik,
      Sumber: book.sumber,
      Subjek: book.subjek,
      "No. Panggil": book.noPanggil,
      Ket: book.ket,
      ISBN: book.isbn,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Katalog Buku");

    const filename = `katalog-buku-${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(workbook, filename);
  };


  const categories = [
    "all",
    "Computer Science",
    "Web Technology",
    "Database Management",
    "Artificial Intelligence",
    "Network Security",
  ];

  // Statistik
  const totalBooks = books.length;
  const totalSubjects = new Set(books.map((b) => b.subjek)).size;
  const totalYears = new Set(books.map((b) => b.tahunTerbit)).size;
  const totalSources = new Set(books.map((b) => b.sumber)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              My Library
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Manage and export your book catalog
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Book className="w-4 h-4" />
            Add New Book
          </Link>
        </div>

        {/* Cards Statistik */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white shadow-md rounded-xl p-6 text-center">
            <p className="text-sm text-gray-500">Total Buku</p>
            <h3 className="text-2xl font-bold text-blue-600">{totalBooks}</h3>
          </div>
          <div className="bg-white shadow-md rounded-xl p-6 text-center">
            <p className="text-sm text-gray-500">Subjek Unik</p>
            <h3 className="text-2xl font-bold text-teal-600">
              {totalSubjects}
            </h3>
          </div>
          <div className="bg-white shadow-md rounded-xl p-6 text-center">
            <p className="text-sm text-gray-500">Tahun Terbit</p>
            <h3 className="text-2xl font-bold text-purple-600">{totalYears}</h3>
          </div>
          <div className="bg-white shadow-md rounded-xl p-6 text-center">
            <p className="text-sm text-gray-500">Sumber Buku</p>
            <h3 className="text-2xl font-bold text-rose-600">{totalSources}</h3>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title, author, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Export */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Export Catalog
              </h2>
              <p className="text-gray-600 mt-1">
                Download your complete book catalog as an Excel file
              </p>
            </div>
            <button
              onClick={exportToExcel}
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Download className="w-5 h-5" />
              Export to Excel ({filteredBooks.length} books)
            </button>
          </div>
        </div>

        {/* Book Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBooks.map((book) => (
            <div
              key={book._id}
              className="bg-white rounded-lg shadow border p-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {book.judul}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    #{book.no}
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate">
                  {book.pengarang}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {book.penerbit} ({book.tahunTerbit})
                </p>
                <p className="text-xs mt-1 bg-gray-100 px-2 py-1 rounded inline-block text-gray-700">
                  {book.subjek}
                </p>

                <div className="flex justify-end gap-2 pt-3">
                  <Link href={`/edit-book/${book._id}`}>
                    <Button
                      variant="outline"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </Link>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        onClick={() => setBookToDelete(book)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="text-red-500 w-5 h-5" />
                          <h4 className="font-semibold text-lg">
                            Confirm Book Deletion
                          </h4>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Are you sure you want to delete the book{" "}
                          <span className="font-medium text-red-600">
                            &quot;{bookToDelete?.judul}&quot;
                          </span>
                          ?
                        </p>
                      </DialogHeader>
                      <DialogFooter className="flex justify-end gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setBookToDelete(null)}
                        >
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada buku ditemukan
            </h3>
            <p className="text-gray-600">
              Coba ubah kata kunci pencarian atau filter kategori.
            </p>
          </div>
        )}

        <div className="text-center text-gray-500 text-sm pt-10">
          <p>&copy; 2025 Mugi Cerdas. Smart cataloging for modern libraries.</p>
        </div>
      </div>
    </div>
  );
}
