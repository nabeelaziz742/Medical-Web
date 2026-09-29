import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPrescriptionById, updatePrescriptionStatus } from "@/lib/prescriptions";
import { adminPrescriptionReviewSchema } from "@/lib/validations/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Admin privileges required." }, { status: 403 });
    }

    const { id } = await params;
    const prescription = await getPrescriptionById(id);

    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, prescription });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve prescription" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Admin privileges required." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const validated = adminPrescriptionReviewSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid review data" },
        { status: 400 }
      );
    }

    const reviewerName = session.name || "Store Pharmacist Admin";
    const updated = await updatePrescriptionStatus(
      id,
      {
        status: validated.data.status,
        rejectionReason: validated.data.rejectionReason || undefined,
        adminNotes: validated.data.adminNotes || undefined,
      },
      reviewerName
    );

    return NextResponse.json({
      success: true,
      message: `Prescription status updated to ${validated.data.status}`,
      prescription: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to review prescription" },
      { status: 400 }
    );
  }
}
