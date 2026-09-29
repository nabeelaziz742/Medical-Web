import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateAdminCategory, deleteAdminCategory } from "@/lib/admin";
import { adminCategorySchema } from "@/lib/validations/admin";

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

    const partialSchema = adminCategorySchema.partial();
    const validated = partialSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid category update data" },
        { status: 400 }
      );
    }

    const updated = await updateAdminCategory(id, validated.data);

    return NextResponse.json({
      success: true,
      message: `Category "${updated.name}" updated successfully`,
      category: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update category" },
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
    const result = await deleteAdminCategory(id);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete category" },
      { status: 400 }
    );
  }
}
