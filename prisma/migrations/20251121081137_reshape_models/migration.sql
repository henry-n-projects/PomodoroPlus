/*
  Warnings:

  - You are about to drop the column `completed` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `avartar_url` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id,name]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BreakType" AS ENUM ('SHORT', 'LONG', 'CUSTOM');

-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_user_id_fkey";

-- AlterTable
ALTER TABLE "Break" ALTER COLUMN "end_time" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Distraction" ALTER COLUMN "occured_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "completed",
ADD COLUMN     "name" TEXT,
ADD COLUMN     "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
ALTER COLUMN "end_at" DROP NOT NULL,
ALTER COLUMN "break_time" SET DEFAULT 0,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avartar_url",
ADD COLUMN     "avatar_url" TEXT,
ALTER COLUMN "settings" SET DEFAULT '{}';

-- DropTable
DROP TABLE "public"."Task";

-- CreateIndex
CREATE UNIQUE INDEX "Tag_user_id_name_key" ON "Tag"("user_id", "name");
