import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch all contacts for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user-sample';

    const [rows]: any = await pool.query(
      `SELECT 
        id, 
        user_id as userId, 
        name, 
        phone, 
        notes, 
        created_at as createdAt 
       FROM contacts 
       WHERE user_id = ? 
       ORDER BY name ASC`,
      [userId]
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

// POST: Add new contact
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id = `contact-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId = 'user-sample',
      name,
      phone = null,
      notes = '',
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Contact name is required' },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO contacts (id, user_id, name, phone, notes) VALUES (?, ?, ?, ?, ?)`,
      [id, userId, name.trim(), phone, notes]
    );

    const newContact = {
      id,
      userId,
      name: name.trim(),
      phone,
      notes,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: newContact }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create contact' },
      { status: 500 }
    );
  }
}

// PUT: Update contact
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, phone, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Contact ID is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No fields provided to update' }, { status: 400 });
    }

    values.push(id);

    await pool.query(`UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`, values);

    return NextResponse.json({ success: true, message: 'Contact updated successfully' });
  } catch (error: any) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update contact' },
      { status: 500 }
    );
  }
}

// DELETE: Remove contact
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Contact ID is required' }, { status: 400 });
    }

    await pool.query('DELETE FROM contacts WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
