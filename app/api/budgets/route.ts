import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { ensureBooksSchema } from '@/lib/books-schema';

export const dynamic = 'force-dynamic';

// GET: Fetch budgets for a user (and optional bookId)
export async function GET(request: Request) {
  try {
    await ensureBooksSchema();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user-sample';
    const bookId = searchParams.get('bookId');

    let query = `
      SELECT 
        id, 
        user_id as userId, 
        book_id as bookId,
        category, 
        CAST(monthly_limit AS DECIMAL(10,2)) as monthlyLimit, 
        icon, 
        created_at as createdAt 
       FROM budgets 
       WHERE user_id = ?`;
    const params: any[] = [userId];

    if (bookId) {
      query += ` AND (book_id = ? OR book_id IS NULL)`;
      params.push(bookId);
    }

    query += ` ORDER BY category ASC`;

    const [rows]: any = await pool.query(query, params);

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

// POST: Upsert (insert or update) category monthly budget limit
export async function POST(request: Request) {
  try {
    await ensureBooksSchema();
    const body = await request.json();
    const {
      id = `bg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId = 'user-sample',
      bookId = null,
      category,
      monthlyLimit,
      icon = null,
    } = body;

    if (!category || monthlyLimit === undefined || isNaN(Number(monthlyLimit))) {
      return NextResponse.json(
        { success: false, error: 'Category and valid monthlyLimit are required' },
        { status: 400 }
      );
    }

    const limit = Number(monthlyLimit);

    // Check if budget already exists for this bookId / userId / category
    const [existing]: any = await pool.query(
      `SELECT id FROM budgets WHERE user_id = ? AND category = ? ${bookId ? 'AND (book_id = ? OR book_id IS NULL)' : ''}`,
      bookId ? [userId, category, bookId] : [userId, category]
    );

    if (existing && existing.length > 0) {
      const existingId = existing[0].id;
      await pool.query(
        `UPDATE budgets SET monthly_limit = ?, icon = COALESCE(?, icon), book_id = COALESCE(?, book_id) WHERE id = ?`,
        [limit, icon, bookId, existingId]
      );
    } else {
      await pool.query(
        `INSERT INTO budgets (id, user_id, book_id, category, monthly_limit, icon) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, userId, bookId, category, limit, icon]
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: existing && existing.length > 0 ? existing[0].id : id,
        userId,
        bookId,
        category,
        monthlyLimit: limit,
        icon,
      },
    });
  } catch (error: any) {
    console.error('Error saving budget:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save budget' },
      { status: 500 }
    );
  }
}
