import { pool } from './db';

declare global {
  // eslint-disable-next-line no-var
  var booksSchemaInitialized: boolean | undefined;
}

// Helper to ensure books table and foreign/column links exist (runs only once per process)
export async function ensureBooksSchema() {
  if (globalThis.booksSchemaInitialized) return;
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

    // 2. Check and add columns in parallel
    const [cols]: any = await pool.query(`
      SELECT TABLE_NAME, COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND COLUMN_NAME = 'book_id' 
        AND TABLE_NAME IN ('transactions', 'dues', 'budgets', 'contacts')
    `);

    const existingTablesWithBookId = new Set(cols.map((r: any) => r.TABLE_NAME));

    const alterPromises = [];
    if (!existingTablesWithBookId.has('transactions')) {
      alterPromises.push(pool.query(`ALTER TABLE transactions ADD COLUMN book_id VARCHAR(64) NULL AFTER user_id`));
    }
    if (!existingTablesWithBookId.has('dues')) {
      alterPromises.push(pool.query(`ALTER TABLE dues ADD COLUMN book_id VARCHAR(64) NULL AFTER user_id`));
    }
    if (!existingTablesWithBookId.has('budgets')) {
      alterPromises.push(pool.query(`ALTER TABLE budgets ADD COLUMN book_id VARCHAR(64) NULL AFTER user_id`));
    }
    if (!existingTablesWithBookId.has('contacts')) {
      alterPromises.push(pool.query(`ALTER TABLE contacts ADD COLUMN book_id VARCHAR(64) NULL AFTER user_id`));
    }

    if (alterPromises.length > 0) {
      await Promise.allSettled(alterPromises);
    }

    globalThis.booksSchemaInitialized = true;
  } catch (e: any) {
    console.error('Books schema initialization error:', e);
    globalThis.booksSchemaInitialized = true;
  }
}
