import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createPrescription, getUserPrescriptions } from "@/lib/prescriptions";
import { validatePrescriptionFile } from "@/lib/storage";
import { createPrescriptionSchema } from "@/lib/validations/prescription";

// GET: Retrieve authenticated user's prescription submissions
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prescriptions = await getUserPrescriptions(session.id);
    return NextResponse.json({ prescriptions });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
}

// POST: Upload a new prescription
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to submit a prescription. Please sign in to continue." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const customerName = formData.get("customerName") as string || session.name;
    const customerPhone = formData.get("customerPhone") as string || session.phone || "";
    const customerEmail = formData.get("customerEmail") as string || session.email;
    const addressId = formData.get("addressId") as string || undefined;
    const deliveryAddress = formData.get("deliveryAddress") as string || "";
    const notes = formData.get("notes") as string || undefined;

    // 1. Validate File
    if (!file) {
      return NextResponse.json(
        { error: "Please select a prescription file to upload." },
        { status: 400 }
      );
    }

    const fileValidationError = validatePrescriptionFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (fileValidationError) {
      return NextResponse.json({ error: fileValidationError }, { status: 400 });
    }

    // 2. Validate Metadata Fields
    const validated = createPrescriptionSchema.safeParse({
      customerName,
      customerPhone,
      customerEmail,
      addressId,
      deliveryAddress,
      notes,
    });

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid submission details" },
        { status: 400 }
      );
    }

    // 3. Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Save prescription securely
    const prescription = await createPrescription(session.id, validated.data, {
      buffer,
      name: file.name,
      type: file.type,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Prescription submitted successfully for review",
        prescription,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to upload prescription" },
      { status: 500 }
    );
  }
}
