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
    jumlahEks: {
      type: Number,
      default: 1, // default saat input pertama
    },
    isbn: String,
    level: String,
  },
  { timestamps: true }
);

export default mongoose.models.Book || mongoose.model("Book", BookSchema);
