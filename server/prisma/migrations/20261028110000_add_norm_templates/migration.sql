-- CreateTable
CREATE TABLE "norm_templates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "position" VARCHAR(255) NOT NULL,
    "gender" VARCHAR(20),
    "site_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "norm_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "norm_template_items" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "item_type_id" INTEGER NOT NULL,
    "period_months" INTEGER NOT NULL,
    "quantity" INTEGER DEFAULT 1,
    "etn_point" VARCHAR(255),
    "period_text" TEXT,
    "seasonality" VARCHAR(50),

    CONSTRAINT "norm_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "norm_templates_position_idx" ON "norm_templates"("position");
CREATE INDEX IF NOT EXISTS "norm_templates_site_id_idx" ON "norm_templates"("site_id");
CREATE INDEX IF NOT EXISTS "norm_template_items_template_id_idx" ON "norm_template_items"("template_id");
CREATE INDEX IF NOT EXISTS "norm_template_items_item_type_id_idx" ON "norm_template_items"("item_type_id");

-- AddForeignKey
ALTER TABLE "norm_templates" ADD CONSTRAINT "norm_templates_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "norm_template_items" ADD CONSTRAINT "norm_template_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "norm_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "norm_template_items" ADD CONSTRAINT "norm_template_items_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "item_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddColumn  (idempotent so safe on prod even if partially present)
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "template_id" INTEGER;
CREATE INDEX IF NOT EXISTS "employees_template_id_idx" ON "employees"("template_id");
ALTER TABLE "employees" ADD CONSTRAINT "employees_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "norm_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
