import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPrescriptionById, updatePrescriptionStatus, replacePrescriptionFile } from "@/lib/prescriptions";
import { updatePrescriptionStatusSchema } from "@/lib/validations/prescription";
import { validatePrescriptionFile } from "@/lib/storage";

// GET: Retrieve single prescription detail with authorization check
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
        { error: "Access denied. You cannot view prescriptions submitted by other accounts." },
        { status: 403 }
      );
    }

    return NextResponse.json({ prescription });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve prescription" },
      { status: 500 }
    );
  }
}

// PATCH: Review status update (admin) or replacement file upload (customer)
export async function PATCH(
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

    const existing = await getPrescriptionById(id);
    if (!existing) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") || "";

    // Case A: Customer uploads a replacement file (multipart/form-data)
    if (contentType.includes("multipart/form-data")) {
      if (existing.userId !== session.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const fileValidationError = validatePrescriptionFile({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      if (fileValidationError) {
        return NextResponse.json({ error: fileValidationError }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const updated = await replacePrescriptionFile(id, session.id, {
        buffer,
        name: file.name,
        type: file.type,
      });

      return NextResponse.json({
        success: true,
        message: "Replacement prescription uploaded successfully",
        prescription: updated,
      });
    }

    // Case B: Status review transition (Admin only)
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only licensed pharmacists and administrators can update prescription review statuses." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = updatePrescriptionStatusSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid status update" },
        { status: 400 }
      );
    }

    const reviewerName = session.name || "Licensed Pharmacist";
    const updated = await updatePrescriptionStatus(id, validated.data, reviewerName);

    return NextResponse.json({
      success: true,
      message: `Prescription status updated to ${validated.data.status}`,
      prescription: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update prescription" },
      { status: 400 }
    );
  }
}
