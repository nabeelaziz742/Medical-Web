import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateAdminBrand, deleteAdminBrand } from "@/lib/admin";
import { adminBrandSchema } from "@/lib/validations/admin";

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

    const partialSchema = adminBrandSchema.partial();
    const validated = partialSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid brand update data" },
        { status: 400 }
      );
    }

    const updated = await updateAdminBrand(id, validated.data);

    return NextResponse.json({
      success: true,
      message: `Brand "${updated.name}" updated successfully`,
      brand: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update brand" },
      { status: 400 }
    );
  }
}

export async function DELETE(
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
    const result = await deleteAdminBrand(id);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete brand" },
      { status: 400 }
    );
  }
}
