-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TENANT', 'OWNER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'TENANT';
