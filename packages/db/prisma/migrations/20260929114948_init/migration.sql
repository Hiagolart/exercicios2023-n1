-- CreateEnum
CREATE TYPE "DataKind" AS ENUM ('ncm', 'imports', 'companies', 'tariffs');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('running', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "NcmLevel" AS ENUM ('capitulo', 'posicao', 'subposicao', 'item', 'subitem');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "FavoritoTipo" AS ENUM ('ncm', 'produto', 'empresa', 'pais');

-- CreateEnum
CREATE TYPE "PesquisaTipo" AS ENUM ('codigo', 'descricao', 'produto');

-- CreateTable
CREATE TABLE "data_source" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "url" TEXT,
    "licenca" TEXT,
    "descricao" TEXT NOT NULL,
    "is_mock" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_run" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "kind" "DataKind" NOT NULL,
    "status" "IngestionStatus" NOT NULL DEFAULT 'running',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "reference_date" DATE,
    "processados" INTEGER NOT NULL DEFAULT 0,
    "inseridos" INTEGER NOT NULL DEFAULT 0,
    "atualizados" INTEGER NOT NULL DEFAULT 0,
    "inalterados" INTEGER NOT NULL DEFAULT 0,
    "rejeitados" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "file_hash" TEXT,

    CONSTRAINT "ingestion_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_error" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "linha" INTEGER NOT NULL,
    "campo" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,

    CONSTRAINT "ingestion_error_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ncm_node" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(8) NOT NULL,
    "nivel" "NcmLevel" NOT NULL,
    "parent_codigo" VARCHAR(8),
    "descricao" TEXT NOT NULL,
    "data_inicio" DATE,
    "data_fim" DATE,
    "ato_tipo" TEXT,
    "ato_numero" TEXT,
    "ato_ano" INTEGER,
    "source_id" TEXT NOT NULL,
    "last_seen_run_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ncm_node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "last_request" BIGINT NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorito" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tipo" "FavoritoTipo" NOT NULL,
    "referencia" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pesquisa" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "termo" TEXT NOT NULL,
    "tipo" "PesquisaTipo" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pesquisa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ingestion_run_source_id_started_at_idx" ON "ingestion_run"("source_id", "started_at");

-- CreateIndex
CREATE INDEX "ingestion_error_run_id_idx" ON "ingestion_error"("run_id");

-- CreateIndex
CREATE UNIQUE INDEX "ncm_node_codigo_key" ON "ncm_node"("codigo");

-- CreateIndex
CREATE INDEX "ncm_node_parent_codigo_idx" ON "ncm_node"("parent_codigo");

-- CreateIndex
CREATE INDEX "ncm_node_nivel_idx" ON "ncm_node"("nivel");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "account_user_id_idx" ON "account"("user_id");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_key_key" ON "rate_limit"("key");

-- CreateIndex
CREATE UNIQUE INDEX "favorito_user_id_tipo_referencia_key" ON "favorito"("user_id", "tipo", "referencia");

-- CreateIndex
CREATE INDEX "pesquisa_user_id_created_at_idx" ON "pesquisa"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "ingestion_run" ADD CONSTRAINT "ingestion_run_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "data_source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_error" ADD CONSTRAINT "ingestion_error_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "ingestion_run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ncm_node" ADD CONSTRAINT "ncm_node_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "data_source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorito" ADD CONSTRAINT "favorito_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesquisa" ADD CONSTRAINT "pesquisa_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
