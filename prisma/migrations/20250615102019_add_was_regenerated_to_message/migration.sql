-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "wasRegenerated" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "branchId" DROP NOT NULL,
ALTER COLUMN "branchId" DROP DEFAULT;
