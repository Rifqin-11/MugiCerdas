import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Book from "@/models/Book";

interface Params {
  id: string;
}

interface SuccessResponse {
  success: boolean;
}

interface ErrorResponse {
  error: string;
}

export async function DELETE(
  req: Request,
  { params }: { params: Params }
): Promise<Response> {
  try {
    await connectToDB();
    await Book.findByIdAndDelete(params.id);
    return NextResponse.json<SuccessResponse>({ success: true });
  } catch (error) {
    return NextResponse.json<ErrorResponse>(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}

interface PutRequestBody {
  // Define the shape of the book update payload as needed, or use Record<string, any> for flexibility
  [key: string]: any;
}

interface PutSuccessResponse {
  // Define the shape of the updated book as needed, or use any for flexibility
  [key: string]: any;
}

export async function PUT(
  req: Request,
  { params }: { params: Params }
): Promise<Response> {
  try {
    const body: PutRequestBody = await req.json();
    await connectToDB();

    const updated = await Book.findByIdAndUpdate(params.id, body, {
      new: true,
    });

    if (!updated) {
      return NextResponse.json<ErrorResponse>(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<PutSuccessResponse>(updated);
  } catch (error) {
    console.error("❌ Error in PUT /api/books/[id]:", error);
    return NextResponse.json<ErrorResponse>(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}


interface GetParams {
  params: Params;
}

interface GetErrorResponse {
  error: string;
}

export async function GET(
  req: Request,
  { params }: GetParams
): Promise<Response> {
  try {
    await connectToDB();
    const book: any = await Book.findById(params.id);

    if (!book) {
      return NextResponse.json<GetErrorResponse>(
        { error: "Buku tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json<typeof book>(book);
  } catch (error) {
    return NextResponse.json<GetErrorResponse>(
      { error: "Gagal mengambil data" },
      { status: 500 }
    );
  }
}
