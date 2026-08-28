-- Link employees to the user account that owns them so push subscriptions
-- (and other user-scoped features) can resolve the employee by user_id.
-- Idempotent: safe to re-run on a database where the column already exists.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE "employees" ADD COLUMN "user_id" INTEGER;
  END IF;
END $$;

ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_user_id_fkey";

ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE UNIQUE INDEX IF NOT EXISTS "employees_user_id_key" ON "employees"("user_id");
