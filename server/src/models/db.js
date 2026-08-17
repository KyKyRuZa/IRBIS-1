import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'irbis',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

export async function initDB() {
  const createTables = `
    CREATE TABLE IF NOT EXISTS sites (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      responsible_person VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      personnel_number VARCHAR(255),
      position VARCHAR(255) NOT NULL,
      site_id INTEGER REFERENCES sites(id) ON DELETE SET NULL,
      position_change_date DATE,
      gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
      hire_date DATE,
      clothing_size VARCHAR(50),
      shoe_size VARCHAR(50),
      hat_size VARCHAR(50),
      respirator_size VARCHAR(50),
      gloves_size VARCHAR(50),
      height INTEGER,
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'terminated')),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS item_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL CHECK (category IN ('clothing', 'footwear', 'siz', 'consumable')),
      unit VARCHAR(50) DEFAULT 'шт',
      default_wear_time_months INTEGER,
      seasonality VARCHAR(50) CHECK (seasonality IN ('winter', 'summer', 'year_round')),
      requires_certificate BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id SERIAL PRIMARY KEY,
      product_name VARCHAR(255) NOT NULL,
      certificate_number VARCHAR(255),
      issue_date DATE,
      expiry_date DATE,
      file_path VARCHAR(500),
      item_type_id INTEGER REFERENCES item_types(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expiring', 'expired'))
    );

    CREATE TABLE IF NOT EXISTS issue_norms (
      id SERIAL PRIMARY KEY,
      item_type_id INTEGER REFERENCES item_types(id) ON DELETE CASCADE,
      period_months INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
      position VARCHAR(255),
      site_id INTEGER REFERENCES sites(id) ON DELETE SET NULL,
      seasonality VARCHAR(50) CHECK (seasonality IN ('winter', 'summer', 'year_round')),
      etn_point VARCHAR(255),
      period_text TEXT
    );

    CREATE TABLE IF NOT EXISTS issue_records (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      item_type_id INTEGER REFERENCES item_types(id) ON DELETE CASCADE,
      quantity INTEGER DEFAULT 1,
      issue_date DATE DEFAULT NOW(),
      expiry_date DATE,
      reorder_date DATE,
      certificate_id INTEGER REFERENCES certificates(id) ON DELETE SET NULL,
      status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('issued', 'due_for_disposal', 'disposed', 'returned')),
      signature_path VARCHAR(500),
      signature_date DATE,
      return_date DATE,
      return_quantity INTEGER DEFAULT 0,
      wear_time_override_months INTEGER,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS forms (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS form_taken (
      id SERIAL PRIMARY KEY,
      form_id INTEGER REFERENCES forms(id) ON DELETE CASCADE,
      employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      taken_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      notification_id VARCHAR(255) UNIQUE NOT NULL,
      type VARCHAR(50) NOT NULL,
      severity VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      site_id INTEGER REFERENCES sites(id) ON DELETE SET NULL,
      date TIMESTAMP NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(employee_id, endpoint)
    );
  `;
  await pool.query(createTables);

  const alterTables = `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'personnel_number') THEN
        ALTER TABLE employees ADD COLUMN personnel_number VARCHAR(255);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'position_change_date') THEN
        ALTER TABLE employees ADD COLUMN position_change_date DATE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'hat_size') THEN
        ALTER TABLE employees ADD COLUMN hat_size VARCHAR(50);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'respirator_size') THEN
        ALTER TABLE employees ADD COLUMN respirator_size VARCHAR(50);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'gloves_size') THEN
        ALTER TABLE employees ADD COLUMN gloves_size VARCHAR(50);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'height') THEN
        ALTER TABLE employees ADD COLUMN height INTEGER;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'issue_records' AND column_name = 'return_date') THEN
        ALTER TABLE issue_records ADD COLUMN return_date DATE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'issue_records' AND column_name = 'return_quantity') THEN
        ALTER TABLE issue_records ADD COLUMN return_quantity INTEGER DEFAULT 0;
      END if;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'issue_records' AND column_name = 'wear_time_override_months') THEN
        ALTER TABLE issue_records ADD COLUMN wear_time_override_months INTEGER;
      END if;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'issue_records' AND column_name = 'notes') THEN
        ALTER TABLE issue_records ADD COLUMN notes TEXT;
      END if;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'issue_records' AND column_name = 'reorder_date') THEN
        ALTER TABLE issue_records ADD COLUMN reorder_date DATE;
      END if;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'status') THEN
        ALTER TABLE certificates ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expiring', 'expired'));
      END if;
    END $$;
  `;
  await pool.query(alterTables);
  console.log('Database initialized with migrations');
}

export default pool;