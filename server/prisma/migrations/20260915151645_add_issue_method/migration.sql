-- DropIndex
DROP INDEX "employees_user_id_key";

-- DropIndex
DROP INDEX "push_subscriptions_employee_id_endpoint_key";

-- AlterTable
ALTER TABLE "issue_records" ADD COLUMN     "issue_method" VARCHAR(20);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "push_enabled" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "employees_user_id_idx" ON "employees"("user_id");
