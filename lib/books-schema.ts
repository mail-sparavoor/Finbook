import { pool } from './db';

let schemaInitialized = false;

// Helper to ensure books table and foreign/column links exist
export async function ensureBooksSchema() {
  if (schemaInitialized) return;
  try {
    // 1. Create books table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        currency_symbol VARCHAR(10) NOT NULL DEFAULT '₹',
        color VARCHAR(30) NOT NULL DEFAULT '#2563eb',
        icon VARCHAR(50) NOT NULL DEFAULT 'BookOpen',
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_books_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Ensure book_id exists on transactions
    const [txCols]: any = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'book_id'`
    );
    if (!txCols || txCols.length === 0) {
      await pool.query(`ALTER TABLE transactions ADD COLUMN book_id VARCHAR(64) NULL AFTER user_id`);
      try {
        await pool.query(`CREATE INDEX idx_transactions_book ON transactions (book_id)`);
      } catch {}
    }

    // 3. Ensure book_id exists on dues
    const [dueCols]: any = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'dues' AND COLUMN_NAME = 'book_id'`
    );
    if (!dueCols || dueCols.length === 0) {
      await pool.query(`ALTER TABLE dues ADD COLUMN book_id VARCHAR(64) NULL AFTER user_id`);
      try {
        await pool.query(`CREATE INDEX idx_dues_book ON dues (book_id)`);
      } catch {}
    }

    // 4. Ensure book_id exists on budgets
    const [bgCols]: any = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'budgets' AND COLUMN_NAME = 'book_id'`
    );
    if (!bgCols || bgCols.length === 0) {
      await pool.query(`ALTER TABLE budgets ADD COLUMN book_id VARCHAR(64) NULL AFTER user_id`);
      try {
        await pool.query(`CREATE INDEX idx_budgets_book ON budgets (book_id)`);
      } catch {}
    }

    // 5. Ensure book_id exists on contacts
    const [cntCols]: any = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contacts' AND COLUMN_NAME = 'book_id'`
    );
    if (!cntCols || cntCols.length === 0) {
      await pool.query(`ALTER TABLE contacts ADD COLUMN book_id VARCHAR(64) NULL AFTER user_id`);
      try {
        await pool.query(`CREATE INDEX idx_contacts_book ON contacts (book_id)`);
      } catch {}
    }

    schemaInitialized = true;
  } catch (e: any) {
    console.error('Books schema initialization error:', e);
    schemaInitialized = true;
  }
}
