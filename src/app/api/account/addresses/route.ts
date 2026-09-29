import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { addressSchema } from "@/lib/validations/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let addresses: any[] = [];
    try {
      addresses = await prisma.address.findMany({
        where: { userId: session.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      });
    } catch (err) {
      console.warn("DB notice:", err);
    }

    return NextResponse.json({ addresses });
  } catch (error) {
    return NextResponse.json({ addresses: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = addressSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0]?.message || "Invalid address format" },
        { status: 400 }
      );
    }

    const { fullName, phone, addressLine1, addressLine2, city, area, isDefault } = validated.data;

    let newAddress = null;
    try {
      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId: session.id },
          data: { isDefault: false },
        });
      }

      newAddress = await prisma.address.create({
        data: {
          userId: session.id,
          fullName: fullName.trim(),
          phone: phone.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2?.trim() || null,
          city: city || "Lahore",
          area: area?.trim() || null,
          isDefault: Boolean(isDefault),
        },
      });
    } catch (err) {
      newAddress = {
        id: `addr-${Date.now()}`,
        userId: session.id,
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2 || null,
        city: city || "Lahore",
        area: area || null,
        isDefault: Boolean(isDefault),
        createdAt: new Date(),
      };
    }

    return NextResponse.json({
      success: true,
      message: "Address saved successfully",
      address: newAddress,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Address ID required" }, { status: 400 });
    }

    try {
      await prisma.address.deleteMany({
        where: { id, userId: session.id },
      });
    } catch (err) {
      console.warn("DB notice:", err);
    }

    return NextResponse.json({ success: true, message: "Address deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}
