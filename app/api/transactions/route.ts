import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// GET: Fetch transactions for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user-sample';

    const [rows]: any = await pool.query(
      `SELECT 
        id, 
        user_id as userId, 
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
       WHERE user_id = ? 
       ORDER BY date DESC, created_at DESC`,
      [userId]
    );

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
    const body = await request.json();
    const {
      id = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId = 'user-sample',
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
        (id, user_id, date, type, category, amount, payment_mode, person_id, person_name, account_id, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
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
