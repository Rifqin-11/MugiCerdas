"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Download,
  Search,
  Book,
  Trash2,
  Pencil,
  AlertCircle,
  List,
  LayoutGrid,
  ArrowUpDown,
} from "lucide-react";
import * as XLSX from "xlsx";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

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
  isbn: string;
  level: string;
  jumlahEks: number;
}

type SortableKeys = "judul" | "pengarang" | "count";

export default function MyLibrary() {
  const [books, setBooks] = useState<BookData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [bookToDelete, setBookToDelete] = useState<BookData | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  const { toast } = useToast();

  const [sortConfig, setSortConfig] = useState<{
    key: SortableKeys;
    direction: "asc" | "desc" | "none";
  }>({ key: "judul", direction: "none" });

  useEffect(() => {
    const fetchBooks = async () => {
      const res = await fetch("/api/books");
      const data = await res.json();
      setBooks(data.books);
    };
    fetchBooks();
  }, []);

  const groupedBooks = Object.values(
    books.reduce((acc, book) => {
      const key = `${book.judul?.trim().toLowerCase()}|${book.pengarang
        ?.trim()
        .toLowerCase()}|${book.isbn?.trim() || ""}`;
      if (!acc[key]) {
        acc[key] = { ...book, count: book.jumlahEks || 1 };
      }
      return acc;
    }, {} as Record<string, BookData & { count: number }>)
  );

  const filteredBooks = groupedBooks.filter((book) => {
    const matchesSearch =
      (book.judul?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (book.pengarang?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      ) ||
      (book.subjek?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const sortedBooks = useMemo(() => {
    let sortableItems = [...filteredBooks];
    if (sortConfig.direction !== "none") {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (sortConfig.key === "count") {
          const numA = Number(valA ?? 0);
          const numB = Number(valB ?? 0);
          return sortConfig.direction === "asc" ? numA - numB : numB - numA;
        }

        const strValA = String(valA).toLowerCase() || "";
        const strValB = String(valB).toLowerCase() || "";

        if (strValA < strValB) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (strValA > strValB) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredBooks, sortConfig]);

  const handleSort = (key: SortableKeys) => {
    setSortConfig((current) => {
      const isCurrentKey = current.key === key;
      if (isCurrentKey) {
        if (current.direction === "none") return { key, direction: "asc" };
        if (current.direction === "asc") return { key, direction: "desc" };
        return { ...current, direction: "none" };
      }
      return { key, direction: "asc" };
    });
  };

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
      const allIds = sortedBooks.map((book) => book._id);
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

  const selectedBooks = filteredBooks.filter((b) =>
    selectedIds.includes(b._id)
  );

  const exportToExcel = () => {
    const exportData = selectedBooks.length > 0 ? selectedBooks : sortedBooks;

    const excelData = exportData.map((book, index) => ({
      No: index + 1,
      Judul: book.judul,
      Pengarang: book.pengarang,
      Penerbit: book.penerbit,
      "Tahun Terbit": book.tahunTerbit,
      Edisi: book.edisi,
      "Kota Terbit": book.kotaTerbit,
      "Tanggal Input": book.tanggalInput,
      "Deskripsi Fisik": book.deskripsiFisik,
      Sumber: book.sumber,
      Subjek: book.subjek,
      "No. Panggil": book.noPanggil,
      ISBN: book.isbn,
      Level: book.level,
      Ket: `${book.jumlahEks || book.count || 1} eks`,
    }));

    const worksheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [
          "No",
          "Judul",
          "Pengarang",
          "Penerbit",
          "Tahun Terbit",
          "Edisi",
          "Kota Terbit",
          "Tanggal Input",
          "Deskripsi Fisik",
          "Sumber",
          "Subjek",
          "No. Panggil",
          "ISBN",
          "Level",
          "Ket",
        ],
      ],
      { origin: "A1" }
    );
    XLSX.utils.sheet_add_json(worksheet, excelData, {
      origin: "A2",
      skipHeader: true,
    });

    const maxWidths = Object.keys(excelData[0]).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...excelData.map((row) => String(row[key as keyof typeof row]).length)
      );
      return { wch: maxLen + 2 };
    });
    worksheet["!cols"] = maxWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Katalog Buku");

    const filename = `katalog-export-${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
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
            <Link href="/">
              <Button className="px-3 py-1.5 text-sm">
                <Book className="w-4 h-4 mr-2" />
                Add Book
              </Button>
            </Link>
          </div>
        </div>

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

        <div className="bg-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row gap-4 items-center flex-wrap">
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

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-500">Sort by:</span>
            {/* START: Modified buttons for active state */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort("judul")}
              className={`flex items-center gap-1 transition-colors ${
                sortConfig.key === "judul" && sortConfig.direction !== "none"
                  ? "bg-black text-white hover:bg-gray-800 hover:text-white"
                  : ""
              }`}
            >
              Title
              {sortConfig.key === "judul" &&
                sortConfig.direction !== "none" && (
                  <ArrowUpDown className="w-4 h-4" />
                )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort("pengarang")}
              className={`flex items-center gap-1 transition-colors ${
                sortConfig.key === "pengarang" &&
                sortConfig.direction !== "none"
                  ? "bg-black text-white hover:bg-gray-800 hover:text-white"
                  : ""
              }`}
            >
              Author
              {sortConfig.key === "pengarang" &&
                sortConfig.direction !== "none" && (
                  <ArrowUpDown className="w-4 h-4" />
                )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort("count")}
              className={`flex items-center gap-1 transition-colors ${
                sortConfig.key === "count" && sortConfig.direction !== "none"
                  ? "bg-black text-white hover:bg-gray-800 hover:text-white"
                  : ""
              }`}
            >
              Ket
              {sortConfig.key === "count" &&
                sortConfig.direction !== "none" && (
                  <ArrowUpDown className="w-4 h-4" />
                )}
            </Button>
            {/* END: Modified buttons for active state */}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={
                selectedIds.length === sortedBooks.length &&
                sortedBooks.length > 0
              }
              onCheckedChange={(checked) => handleSelectAll(!!checked)}
            />
            <label className="text-gray-700 text-sm">
              Select all ({sortedBooks.length})
            </label>
          </div>
          <Button onClick={exportToExcel} disabled={sortedBooks.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel ({selectedBooks.length || sortedBooks.length})
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow overflow-hidden">
            <thead className="bg-gray-100 text-sm">
              <tr>
                <th className="p-3 text-left">
                  <Checkbox
                    checked={
                      selectedIds.length === sortedBooks.length &&
                      sortedBooks.length > 0
                    }
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Author</th>
                <th className="p-3 text-left">Publisher</th>
                <th className="p-3 text-left">Year</th>
                <th className="p-3 text-left">Ket</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedBooks.map((book) => (
                <tr key={book._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedIds.includes(book._id)}
                      onCheckedChange={(checked) =>
                        handleSelectBook(book._id, !!checked)
                      }
                    />
                  </td>
                  <td className="p-3">{book.judul}</td>
                  <td className="p-3">{book.pengarang}</td>
                  <td className="p-3">{book.penerbit}</td>
                  <td className="p-3">{book.tahunTerbit}</td>
                  <td className="p-3">{book.count} eks</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/edit-book/${book._id}`} passHref>
                        <button
                          className="inline-flex items-center justify-center p-2 rounded-md border border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-blue-600 transition duration-150"
                          title="Edit Book"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => setBookToDelete(book)}
                        className="inline-flex items-center justify-center p-2 rounded-md border border-gray-200 bg-red-500 hover:border-red-500 hover:bg-red-600 text-white transition duration-150"
                        title="Delete Book"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
