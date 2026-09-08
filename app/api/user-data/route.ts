import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { ensureBooksSchema } from '@/lib/books-schema';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Ensure schema in background if not already initialized
    ensureBooksSchema().catch((err) => console.warn('Background books schema init:', err));

    // Run all 6 queries in parallel in a single connection batch
    const [booksRes, txRes, duesRes, budgetsRes, contactsRes, categoriesRes]: any = await Promise.all([
      // 1. Books
      pool.query(
        `SELECT id, user_id as userId, name, description, currency, currency_symbol as currencySymbol, color, icon, is_default as isDefault, created_at as createdAt 
         FROM books WHERE user_id = ? ORDER BY is_default DESC, created_at ASC`,
        [userId]
      ),
      // 2. Transactions
      pool.query(
        `SELECT id, user_id as userId, book_id as bookId, DATE_FORMAT(date, '%Y-%m-%d') as date, type, category, CAST(amount AS DECIMAL(10,2)) as amount, payment_mode as paymentMode, person_id as personId, person_name as personName, account_id as accountId, notes, created_at as createdAt 
         FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC`,
        [userId]
      ),
      // 3. Dues
      pool.query(
        `SELECT id, user_id as userId, book_id as bookId, person_id as personId, person_name as personName, phone, type, original_amount as originalAmount, paid_amount as paidAmount, due_date as dueDate, status, notes, created_at as createdAt 
         FROM dues WHERE user_id = ? ORDER BY due_date ASC, created_at DESC`,
        [userId]
      ),
      // 4. Budgets
      pool.query(
        `SELECT id, user_id as userId, book_id as bookId, category, CAST(monthly_limit AS DECIMAL(10,2)) as monthlyLimit, icon, created_at as createdAt 
         FROM budgets WHERE user_id = ? ORDER BY category ASC`,
        [userId]
      ),
      // 5. Contacts
      pool.query(
        `SELECT id, user_id as userId, book_id as bookId, name, phone, notes, created_at as createdAt 
         FROM contacts WHERE user_id = ? ORDER BY name ASC`,
        [userId]
      ),
      // 6. Categories
      pool.query(
        `SELECT id, user_id as userId, name, type, color, icon, created_at as createdAt 
         FROM categories WHERE user_id = ? ORDER BY name ASC`,
        [userId]
      ),
    ]);

    let books = booksRes[0] || [];
    const transactions = (txRes[0] || []).map((t: any) => ({
      ...t,
      amount: Number(t.amount) || 0,
    }));

    const dues = (duesRes[0] || []).map((r: any) => {
      const orig = Number(r.originalAmount) || 0;
      const paid = Number(r.paidAmount) || 0;
      const rem = Math.max(0, orig - paid);
      return {
        id: r.id,
        userId: r.userId,
        bookId: r.bookId,
        personId: r.personId,
        personName: r.personName,
        phone: r.phone,
        type: r.type,
        originalAmount: orig,
        paidAmount: paid,
        remainingAmount: rem,
        dueDate: r.dueDate ? String(r.dueDate).slice(0, 10) : new Date().toISOString().split('T')[0],
        status: rem === 0 ? 'SETTLED' : (r.status || 'ACTIVE'),
        notes: r.notes || '',
        createdAt: r.createdAt || new Date().toISOString(),
      };
    });

    const budgets = budgetsRes[0] || [];
    const contacts = contactsRes[0] || [];
    const rawCategories = categoriesRes[0] || [];
    const seenCatNames = new Set<string>();
    const categories = rawCategories.filter((c: any) => {
      const key = (c.name || '').trim().toLowerCase();
      if (!key || seenCatNames.has(key)) return false;
      seenCatNames.add(key);
      return true;
    });

    // If user has no book yet, create default book
    if (books.length === 0) {
      const [userRow]: any = await pool.query(
        `SELECT currency, currency_symbol FROM users WHERE id = ?`,
        [userId]
      );
      const userCurrency = userRow[0]?.currency || 'INR';
      const userSymbol = userRow[0]?.currency_symbol || '₹';

      const defaultBookId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await pool.query(
        `INSERT INTO books (id, user_id, name, description, currency, currency_symbol, color, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          defaultBookId,
          userId,
          'Personal Book',
          'Primary personal ledger for day-to-day cashbook and expenses',
          userCurrency,
          userSymbol,
          '#2563eb',
        ]
      );

      books = [
        {
          id: defaultBookId,
          userId,
          name: 'Personal Book',
          description: 'Primary personal ledger for day-to-day cashbook and expenses',
          currency: userCurrency,
          currencySymbol: userSymbol,
          color: '#2563eb',
          icon: 'BookOpen',
          isDefault: true,
          createdAt: new Date().toISOString(),
        },
      ];
    } else {
      books = books.map((b: any) => ({ ...b, isDefault: Boolean(b.isDefault) }));
    }

    return NextResponse.json({
      success: true,
      data: {
        books,
        transactions,
        dues,
        budgets,
        contacts,
        categories,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user bulk data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}
