-- AlterTable
ALTER TABLE "aliquota" ADD COLUMN     "quota" TEXT;

-- AlterTable
ALTER TABLE "destaque_ex" ADD COLUMN     "lista" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "observacao" TEXT,
ADD COLUMN     "quota" TEXT;
