-- Create unique constraint on form_taken (employee_id, form_id)
CREATE UNIQUE INDEX form_taken_employee_form_key ON form_taken (employee_id, form_id);
