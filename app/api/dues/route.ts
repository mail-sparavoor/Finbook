import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { ensureBooksSchema } from '@/lib/books-schema';

export const dynamic = 'force-dynamic';

// GET: Fetch dues for a user (and optional bookId)
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
        person_id as personId, 
        person_name as personName, 
        phone, 
        type, 
        original_amount as originalAmount, 
        paid_amount as paidAmount, 
        due_date as dueDate, 
        status, 
        notes, 
        created_at as createdAt 
       FROM dues 
       WHERE user_id = ?`;
    const params: any[] = [userId];

    if (bookId) {
      query += ` AND (book_id = ? OR book_id IS NULL)`;
      params.push(bookId);
    }

    query += ` ORDER BY due_date ASC, created_at DESC`;

    const [rows]: any = await pool.query(query, params);

    const formattedRows = rows.map((r: any) => {
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

    return NextResponse.json({ success: true, data: formattedRows });
  } catch (error: any) {
    console.error('Error fetching dues:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dues' },
      { status: 500 }
    );
  }
}

// POST: Create a new due
export async function POST(request: Request) {
  try {
    await ensureBooksSchema();
    const body = await request.json();
    const {
      id = `due-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId = 'user-sample',
      bookId = null,
      personId = null,
      personName,
      phone = null,
      type, // 'I_LENT' | 'I_BORROWED'
      originalAmount,
      paidAmount = 0,
      dueDate = new Date().toISOString().split('T')[0],
      notes = '',
    } = body;

    if (!personName || !type || originalAmount === undefined || isNaN(Number(originalAmount))) {
      return NextResponse.json(
        { success: false, error: 'Person name, type, and valid amount are required' },
        { status: 400 }
      );
    }

    const orig = Number(originalAmount);
    const paid = Number(paidAmount) || 0;
    const status = paid >= orig ? 'SETTLED' : 'ACTIVE';

    await pool.query(
      `INSERT INTO dues 
        (id, user_id, book_id, person_id, person_name, phone, type, original_amount, paid_amount, due_date, status, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, bookId, personId, personName, phone, type, orig, paid, dueDate, status, notes]
    );

    const newDue = {
      id,
      userId,
      bookId,
      personId,
      personName,
      phone,
      type,
      originalAmount: orig,
      paidAmount: paid,
      remainingAmount: Math.max(0, orig - paid),
      dueDate,
      status,
      notes,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: newDue }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating due:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create due' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing due
export async function PUT(request: Request) {
  try {
    await ensureBooksSchema();
    const body = await request.json();
    const {
      id,
      bookId,
      personId,
      personName,
      phone,
      type,
      originalAmount,
      paidAmount,
      dueDate,
      notes,
      status,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Due ID is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (bookId !== undefined) {
      updates.push('book_id = ?');
      values.push(bookId);
    }
    if (personId !== undefined) {
      updates.push('person_id = ?');
      values.push(personId);
    }
    if (personName !== undefined) {
      updates.push('person_name = ?');
      values.push(personName.trim());
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (type !== undefined) {
      updates.push('type = ?');
      values.push(type);
    }
    if (originalAmount !== undefined && !isNaN(Number(originalAmount))) {
      updates.push('original_amount = ?');
      values.push(Number(originalAmount));
    }
    if (paidAmount !== undefined && !isNaN(Number(paidAmount))) {
      updates.push('paid_amount = ?');
      values.push(Number(paidAmount));
    }
    if (dueDate !== undefined) {
      updates.push('due_date = ?');
      values.push(dueDate);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);

    await pool.query(
      `UPDATE dues SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [rows]: any = await pool.query(
      `SELECT 
        id, 
        user_id as userId, 
        book_id as bookId,
        person_id as personId, 
        person_name as personName, 
        phone, 
        type, 
        CAST(original_amount AS DECIMAL(10,2)) as originalAmount, 
        CAST(paid_amount AS DECIMAL(10,2)) as paidAmount, 
        DATE_FORMAT(due_date, '%Y-%m-%d') as dueDate, 
        status, 
        notes, 
        created_at as createdAt 
       FROM dues 
       WHERE id = ?`,
      [id]
    );

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error: any) {
    console.error('Error updating due:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update due' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a due
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Due ID is required' }, { status: 400 });
    }

    await pool.query('DELETE FROM dues WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Due deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting due:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete due' },
      { status: 500 }
    );
  }
}
