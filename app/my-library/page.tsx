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
  List,
  LayoutGrid,
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"card" | "list">("list");

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
        title: "Book deleted successfully",
        description: `"${bookToDelete.judul}" has been removed.`,
      });
      setBookToDelete(null);
    } catch (error) {
      toast({
        title: "Failed to delete book",
        description: "An error occurred while deleting the book.",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredBooks.map((book) => book._id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectBook = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    );
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

  const selectedBooks = filteredBooks.filter((b) =>
    selectedIds.includes(b._id)
  );

  const exportToExcel = () => {
    const exportData = selectedBooks.length > 0 ? selectedBooks : filteredBooks;

    const excelData = exportData.map((book, index) => ({
      No: index + 1,
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

    const filename = `catalog-export-${
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              My Library
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage and export your book catalog
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              className="px-3 py-1.5 text-sm"
              onClick={() => setViewMode("card")}
            >
              <LayoutGrid className="w-4 h-4 mr-1" />
              Card View
            </Button>
            <Button
              variant="outline"
              className="px-3 py-1.5 text-sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4 mr-1" />
              List View
            </Button>
            <Link href="/">
              <Button className="px-3 py-1.5 text-sm">
                <Book className="w-4 h-4 mr-2" />
                Add Book
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Books" value={books.length} color="blue" />
          <StatCard
            label="Unique Subjects"
            value={new Set(books.map((b) => b.subjek)).size}
            color="teal"
          />
          <StatCard
            label="Years"
            value={new Set(books.map((b) => b.tahunTerbit)).size}
            color="purple"
          />
          <StatCard
            label="Sources"
            value={new Set(books.map((b) => b.sumber)).size}
            color="rose"
          />
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, author, or subject..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              className="w-full sm:w-auto pl-10 pr-4 py-2 border rounded-lg text-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Export & Select All */}
        <div className="bg-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={
                selectedIds.length === filteredBooks.length &&
                filteredBooks.length > 0
              }
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            <label className="text-gray-700 text-sm">
              Select all ({filteredBooks.length})
            </label>
          </div>
          <Button onClick={exportToExcel} disabled={filteredBooks.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel ({selectedBooks.length || filteredBooks.length})
          </Button>
        </div>

        {/* Book List */}
        {viewMode === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => (
              <BookCard
                key={book._id}
                book={book}
                selected={selectedIds.includes(book._id)}
                onSelect={handleSelectBook}
                onDelete={setBookToDelete}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl shadow overflow-hidden">
              <thead className="bg-gray-100 text-sm">
                <tr>
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === filteredBooks.length &&
                        filteredBooks.length > 0
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Author</th>
                  <th className="p-3 text-left">Publisher</th>
                  <th className="p-3 text-left">Year</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr key={book._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(book._id)}
                        onChange={(e) =>
                          handleSelectBook(book._id, e.target.checked)
                        }
                      />
                    </td>
                    <td className="p-3">{book.judul}</td>
                    <td className="p-3">{book.pengarang}</td>
                    <td className="p-3">{book.penerbit}</td>
                    <td className="p-3">{book.tahunTerbit}</td>
                    <td className="p-3 flex flex-wrap gap-2">
                      <Link href={`/edit-book/${book._id}`}>
                        <Button size="sm" variant="outline">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setBookToDelete(book)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {bookToDelete && (
          <Dialog
            open={!!bookToDelete}
            onOpenChange={() => setBookToDelete(null)}
          >
            <DialogContent>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-red-500" />
                  <h4>Confirm Deletion</h4>
                </div>
                <p>
                  Are you sure to delete book:{" "}
                  <strong>{bookToDelete.judul}</strong>?
                </p>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBookToDelete(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 text-center">
      <p className="text-sm text-gray-500">{label}</p>
      <h3 className={`text-2xl font-bold text-${color}-600`}>{value}</h3>
    </div>
  );
}

function BookCard({
  book,
  selected,
  onSelect,
  onDelete,
}: {
  book: BookData;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onDelete: (book: BookData) => void;
}) {
  return (
    <div className="relative bg-white rounded-lg shadow border p-4 space-y-2 hover:ring-2 hover:ring-blue-300 transition-all duration-300">
      <label className="absolute top-3 left-3 inline-flex items-center cursor-pointer z-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(book._id, e.target.checked)}
          className="peer sr-only"
        />
        <div className="h-5 w-5 rounded border-2 border-gray-300 bg-white peer-checked:border-blue-600 peer-checked:bg-blue-600 flex items-center justify-center transition-colors duration-200">
          <svg
            className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </label>

      <div className="pl-8">
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-bold">{book.judul}</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 rounded-full">
            #{book.no}
          </span>
        </div>
        <p className="text-xs text-gray-600">{book.pengarang}</p>
        <p className="text-xs text-gray-600">
          {book.penerbit} ({book.tahunTerbit})
        </p>
        <p className="text-xs text-gray-700 bg-gray-100 inline-block px-2 rounded">
          {book.subjek}
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Link href={`/edit-book/${book._id}`}>
            <Button size="sm" variant="outline">
              <Pencil className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(book)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
