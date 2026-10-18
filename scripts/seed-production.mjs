// Creates (or resets the password of) the store admin account.
// Usage: node --env-file=.env scripts/seed-production.mjs
// Needs ADMIN_EMAIL and ADMIN_PASSWORD in the environment. The product catalog seeds itself
// the first time the storefront loads an empty database.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script.");
  process.exit(1);
}
if (password.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.upsert({
    where: { email },
    create: { name: "Store Owner / Admin", email, passwordHash, role: "ADMIN" },
    update: { passwordHash, role: "ADMIN" },
  });
  console.log(`Admin account ready: ${admin.email}`);
} finally {
  await prisma.$disconnect();
}
