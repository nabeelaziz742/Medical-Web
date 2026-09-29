import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStoreSettings, updateStoreSettings } from "@/lib/settings";
import { updateSettingsSchema } from "@/lib/validations/settings";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const settings = await getStoreSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve store settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const body = await req.json();
    const validated = updateSettingsSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid settings input" },
        { status: 400 }
      );
    }

    const updated = await updateStoreSettings(validated.data, session.id);
    return NextResponse.json({
      success: true,
      message: "Store settings updated successfully",
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update store settings" },
      { status: 400 }
    );
  }
}
