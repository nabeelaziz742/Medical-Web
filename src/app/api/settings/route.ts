import { NextResponse } from "next/server";
import { getPublicStoreSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getPublicStoreSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch store settings" },
      { status: 500 }
    );
  }
}
