/*
  Warnings:

  - The `paymentMethod` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'DINHEIRO_NA_ENTREGA', 'CARTAO_NA_ENTREGA');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "acceptsDelivery" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptsPickup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "deliveryEndTime" TEXT,
ADD COLUMN     "deliveryInstructions" TEXT,
ADD COLUMN     "deliveryStartTime" TEXT,
ADD COLUMN     "pickupInstructions" TEXT,
ADD COLUMN     "pixEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pixInstructions" TEXT,
ADD COLUMN     "pixKey" TEXT,
ADD COLUMN     "pixKeyType" TEXT,
ADD COLUMN     "pixRecipientName" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "fulfillmentType" "FulfillmentType" NOT NULL DEFAULT 'DELIVERY',
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "city" SET DEFAULT 'Várzea Nova',
ALTER COLUMN "state" SET DEFAULT 'BA',
DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "PaymentMethod";
