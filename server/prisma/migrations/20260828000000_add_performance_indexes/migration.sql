-- Performance indexes for foreign-key joins, common filters and sort columns.
-- Postgres does not auto-create indexes on FK columns, so every JOIN / WHERE /
-- ORDER BY on these columns used a sequential scan. Add targeted indexes.

CREATE INDEX IF NOT EXISTS "employees_site_id_idx" ON "employees"("site_id");
CREATE INDEX IF NOT EXISTS "employees_status_idx" ON "employees"("status");
CREATE INDEX IF NOT EXISTS "employees_created_at_idx" ON "employees"("created_at");

CREATE INDEX IF NOT EXISTS "certificates_item_type_id_idx" ON "certificates"("item_type_id");
CREATE INDEX IF NOT EXISTS "certificates_status_expiry_date_idx" ON "certificates"("status", "expiry_date");

CREATE INDEX IF NOT EXISTS "item_types_category_name_idx" ON "item_types"("category", "name");

CREATE INDEX IF NOT EXISTS "issue_norms_item_type_id_idx" ON "issue_norms"("item_type_id");
CREATE INDEX IF NOT EXISTS "issue_norms_site_id_idx" ON "issue_norms"("site_id");

CREATE INDEX IF NOT EXISTS "issue_records_employee_id_issue_date_idx" ON "issue_records"("employee_id", "issue_date");
CREATE INDEX IF NOT EXISTS "issue_records_status_expiry_date_idx" ON "issue_records"("status", "expiry_date");
CREATE INDEX IF NOT EXISTS "issue_records_item_type_id_idx" ON "issue_records"("item_type_id");
CREATE INDEX IF NOT EXISTS "issue_records_certificate_id_idx" ON "issue_records"("certificate_id");
CREATE INDEX IF NOT EXISTS "issue_records_reorder_date_idx" ON "issue_records"("reorder_date");

CREATE INDEX IF NOT EXISTS "notifications_employee_id_idx" ON "notifications"("employee_id");
CREATE INDEX IF NOT EXISTS "notifications_site_id_idx" ON "notifications"("site_id");
CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications"("read");
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications"("type");
CREATE INDEX IF NOT EXISTS "notifications_date_idx" ON "notifications"("date");

CREATE INDEX IF NOT EXISTS "form_taken_employee_id_idx" ON "form_taken"("employee_id");
CREATE INDEX IF NOT EXISTS "form_taken_form_id_idx" ON "form_taken"("form_id");

CREATE INDEX IF NOT EXISTS "push_subscriptions_employee_id_idx" ON "push_subscriptions"("employee_id");
