-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "sites" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "responsible_person" VARCHAR(255),

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "personnel_number" VARCHAR(255),
    "position" VARCHAR(255) NOT NULL,
    "site_id" INTEGER,
    "position_change_date" DATE,
    "gender" VARCHAR(20),
    "hire_date" DATE,
    "clothing_size" VARCHAR(50),
    "shoe_size" VARCHAR(50),
    "hat_size" VARCHAR(50),
    "respirator_size" VARCHAR(50),
    "gloves_size" VARCHAR(50),
    "height" INTEGER,
    "status" VARCHAR(20) DEFAULT 'active',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "unit" VARCHAR(50) DEFAULT 'шт',
    "default_wear_time_months" INTEGER,
    "seasonality" VARCHAR(50),
    "requires_certificate" BOOLEAN DEFAULT false,

    CONSTRAINT "item_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" SERIAL NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "certificate_number" VARCHAR(255),
    "issue_date" DATE,
    "expiry_date" DATE,
    "file_path" VARCHAR(500),
    "item_type_id" INTEGER,
    "status" VARCHAR(20) DEFAULT 'active',

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_norms" (
    "id" SERIAL NOT NULL,
    "item_type_id" INTEGER,
    "period_months" INTEGER NOT NULL,
    "quantity" INTEGER DEFAULT 1,
    "gender" VARCHAR(20),
    "position" VARCHAR(255),
    "site_id" INTEGER,
    "seasonality" VARCHAR(50),
    "etn_point" VARCHAR(255),
    "period_text" TEXT,

    CONSTRAINT "issue_norms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_records" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER,
    "item_type_id" INTEGER,
    "quantity" INTEGER DEFAULT 1,
    "issue_date" DATE DEFAULT CURRENT_TIMESTAMP,
    "expiry_date" DATE,
    "reorder_date" DATE,
    "certificate_id" INTEGER,
    "status" VARCHAR(20) DEFAULT 'issued',
    "signature_path" VARCHAR(500),
    "signature_date" DATE,
    "return_date" DATE,
    "return_quantity" INTEGER DEFAULT 0,
    "wear_time_override_months" INTEGER,
    "notes" TEXT,

    CONSTRAINT "issue_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) DEFAULT 'user',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_taken" (
    "id" SERIAL NOT NULL,
    "form_id" INTEGER,
    "employee_id" INTEGER,
    "taken_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_taken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "notification_id" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "employee_id" INTEGER,
    "site_id" INTEGER,
    "date" TIMESTAMP(6) NOT NULL,
    "read" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_notification_id_key" ON "notifications"("notification_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_employee_id_endpoint_key" ON "push_subscriptions"("employee_id", "endpoint");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "item_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issue_norms" ADD CONSTRAINT "issue_norms_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "item_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issue_norms" ADD CONSTRAINT "issue_norms_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issue_records" ADD CONSTRAINT "issue_records_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "certificates"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issue_records" ADD CONSTRAINT "issue_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issue_records" ADD CONSTRAINT "issue_records_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "item_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "form_taken" ADD CONSTRAINT "form_taken_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "form_taken" ADD CONSTRAINT "form_taken_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

