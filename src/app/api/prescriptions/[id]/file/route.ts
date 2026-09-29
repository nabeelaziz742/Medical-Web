import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPrescriptionById } from "@/lib/prescriptions";
import { readPrescriptionFile } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Prescription ID required" }, { status: 400 });
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prescription = await getPrescriptionById(id);
    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    // Access authorization: User must be owner or admin
    if (session.role !== "ADMIN" && (!prescription.userId || prescription.userId !== session.id)) {
      return NextResponse.json(
        { error: "Access denied. You cannot view prescription documents submitted by other accounts." },
        { status: 403 }
      );
    }

    const fileBuffer = await readPrescriptionFile(prescription.storageKey);
    if (!fileBuffer) {
      return NextResponse.json({ error: "Prescription file document not found" }, { status: 404 });
    }

    const isDownload = req.nextUrl.searchParams.get("download") === "true";
    const dispositionType = isDownload ? "attachment" : "inline";

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": prescription.fileType || "application/octet-stream",
        "Content-Disposition": `${dispositionType}; filename="${prescription.fileName}"`,
        "Content-Length": fileBuffer.length.toString(),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve prescription file" },
      { status: 500 }
    );
  }
}
