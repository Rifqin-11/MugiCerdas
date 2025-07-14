import mongoose from "mongoose";

const BookSchema = new mongoose.Schema(
  {
    tanggalInput: String,
    pengarang: String,
    judul: String,
    edisi: String,
    kotaTerbit: String,
    penerbit: String,
    tahunTerbit: String,
    deskripsiFisik: String,
    sumber: String,
    subjek: String,
    noPanggil: String,
    ket: String,
    isbn: String,
    level: String,
  },
  { timestamps: true }
);

export default mongoose.models.Book || mongoose.model("Book", BookSchema);
