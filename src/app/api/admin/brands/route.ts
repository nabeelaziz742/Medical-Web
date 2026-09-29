import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminBrandsList, createAdminBrand } from "@/lib/admin";
import { adminBrandSchema } from "@/lib/validations/admin";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Admin privileges required." }, { status: 403 });
    }

    const brands = getAdminBrandsList();
    return NextResponse.json({ success: true, brands });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const validated = adminBrandSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid brand data" },
        { status: 400 }
      );
    }

    const brand = createAdminBrand(validated.data);

    return NextResponse.json({
      success: true,
      message: `Brand "${brand.name}" created successfully`,
      brand,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create brand" },
      { status: 400 }
    );
  }
}
