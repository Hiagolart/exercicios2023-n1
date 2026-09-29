-- CreateEnum
CREATE TYPE "Tributo" AS ENUM ('II', 'IPI', 'PIS', 'COFINS', 'CBS', 'IBS');

-- CreateEnum
CREATE TYPE "TipoAliquota" AS ENUM ('ad_valorem', 'especifica', 'nao_tributado');

-- CreateEnum
CREATE TYPE "RegimeAliquota" AS ENUM ('geral', 'excecao', 'regra_geral');

-- AlterTable
ALTER TABLE "ingestion_run" ADD COLUMN     "ignorados" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "aliquota" (
    "id" TEXT NOT NULL,
    "ncm_codigo" VARCHAR(8),
    "tributo" "Tributo" NOT NULL,
    "regime" "RegimeAliquota" NOT NULL,
    "lista" TEXT NOT NULL DEFAULT '',
    "tipo" "TipoAliquota" NOT NULL,
    "aliquota" DECIMAL(9,4),
    "vigencia_inicio" DATE,
    "vigencia_fim" DATE,
    "vigencia_inferida" BOOLEAN NOT NULL DEFAULT false,
    "ato_legal" TEXT,
    "observacao" TEXT,
    "source_id" TEXT NOT NULL,
    "ingestion_run_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aliquota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destaque_ex" (
    "id" TEXT NOT NULL,
    "ncm_codigo" VARCHAR(8) NOT NULL,
    "tributo" "Tributo" NOT NULL,
    "numero" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "aliquota" DECIMAL(9,4) NOT NULL,
    "vigencia_inicio" DATE,
    "vigencia_fim" DATE,
    "ato_legal" TEXT,
    "source_id" TEXT NOT NULL,
    "ingestion_run_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destaque_ex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aliquota_ncm_codigo_tributo_idx" ON "aliquota"("ncm_codigo", "tributo");

-- CreateIndex
CREATE INDEX "aliquota_source_id_vigencia_fim_idx" ON "aliquota"("source_id", "vigencia_fim");

-- CreateIndex
CREATE INDEX "destaque_ex_ncm_codigo_tributo_idx" ON "destaque_ex"("ncm_codigo", "tributo");

-- AddForeignKey
ALTER TABLE "aliquota" ADD CONSTRAINT "aliquota_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "data_source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destaque_ex" ADD CONSTRAINT "destaque_ex_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "data_source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
