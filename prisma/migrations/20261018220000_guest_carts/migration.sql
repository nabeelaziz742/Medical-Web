-- AlterTable
ALTER TABLE "carts" ADD COLUMN     "guestId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "carts_guestId_key" ON "carts"("guestId");

