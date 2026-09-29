-- AlterTable
ALTER TABLE "destaque_ex" ADD COLUMN     "tipo" "TipoAliquota" NOT NULL DEFAULT 'ad_valorem',
ALTER COLUMN "aliquota" DROP NOT NULL;
