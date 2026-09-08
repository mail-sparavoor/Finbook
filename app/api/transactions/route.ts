import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { ensureBooksSchema } from '@/lib/books-schema';

export const dynamic = 'force-dynamic';

// GET: Fetch transactions for a user (and optional bookId)
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
        DATE_FORMAT(date, '%Y-%m-%d') as date, 
        type, 
        category, 
        CAST(amount AS DECIMAL(10,2)) as amount, 
        payment_mode as paymentMode, 
        person_id as personId, 
        person_name as personName, 
        account_id as accountId, 
        notes, 
        created_at as createdAt 
       FROM transactions 
       WHERE user_id = ?`;
    const params: any[] = [userId];

    if (bookId) {
      query += ` AND (book_id = ? OR book_id IS NULL)`;
      params.push(bookId);
    }

    query += ` ORDER BY date DESC, created_at DESC`;

    const [rows]: any = await pool.query(query, params);

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST: Create a new transaction
export async function POST(request: Request) {
  try {
    await ensureBooksSchema();
    const body = await request.json();
    const {
      id = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId = 'user-sample',
      bookId = null,
      date = new Date().toISOString().split('T')[0],
      type,
      category,
      amount,
      paymentMode = 'Online / UPI',
      personId = null,
      personName = null,
      accountId = null,
      notes = '',
    } = body;

    if (!type || !category || amount === undefined || isNaN(Number(amount))) {
      return NextResponse.json(
        { success: false, error: 'Type, category, and valid amount are required' },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO transactions 
        (id, user_id, book_id, date, type, category, amount, payment_mode, person_id, person_name, account_id, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        bookId,
        date,
        type,
        category,
        Number(amount),
        paymentMode,
        personId,
        personName,
        accountId,
        notes,
      ]
    );

    const newTx = {
      id,
      userId,
      bookId,
      date,
      type,
      category,
      amount: Number(amount),
      paymentMode,
      personId,
      personName,
      accountId,
      notes,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: newTx }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create transaction' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing transaction
export async function PUT(request: Request) {
  try {
    await ensureBooksSchema();
    const body = await request.json();
    const {
      id,
      bookId,
      date,
      type,
      category,
      amount,
      paymentMode,
      personId,
      personName,
      accountId,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (bookId !== undefined) {
      updates.push('book_id = ?');
      values.push(bookId);
    }
    if (date !== undefined) {
      updates.push('date = ?');
      values.push(date);
    }
    if (type !== undefined) {
      updates.push('type = ?');
      values.push(type);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (amount !== undefined && !isNaN(Number(amount))) {
      updates.push('amount = ?');
      values.push(Number(amount));
    }
    if (paymentMode !== undefined) {
      updates.push('payment_mode = ?');
      values.push(paymentMode);
    }
    if (personId !== undefined) {
      updates.push('person_id = ?');
      values.push(personId);
    }
    if (personName !== undefined) {
      updates.push('person_name = ?');
      values.push(personName);
    }
    if (accountId !== undefined) {
      updates.push('account_id = ?');
      values.push(accountId);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields provided to update' },
        { status: 400 }
      );
    }

    values.push(id);

    await pool.query(
      `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [rows]: any = await pool.query(
      `SELECT 
        id, 
        user_id as userId, 
        book_id as bookId,
        DATE_FORMAT(date, '%Y-%m-%d') as date, 
        type, 
        category, 
        CAST(amount AS DECIMAL(10,2)) as amount, 
        payment_mode as paymentMode, 
        person_id as personId, 
        person_name as personName, 
        account_id as accountId, 
        notes, 
        created_at as createdAt 
       FROM transactions 
       WHERE id = ?`,
      [id]
    );

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a transaction
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    if (userId) {
      await pool.query('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, userId]);
    } else {
      await pool.query('DELETE FROM transactions WHERE id = ?', [id]);
    }

    return NextResponse.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
