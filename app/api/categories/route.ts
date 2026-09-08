import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { ensureBooksSchema } from '@/lib/books-schema';

export const dynamic = 'force-dynamic';

// GET /api/categories?userId=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    await ensureBooksSchema();

    const [rows]: any = await pool.query(
      `SELECT id, user_id as userId, name, type, color, icon, created_at as createdAt 
       FROM categories 
       WHERE user_id = ? 
       ORDER BY name ASC`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      categories: rows || [],
    });
  } catch (error: any) {
    console.error('Fetch categories error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/categories
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, type, color, icon } = body;

    if (!userId || !name || !type) {
      return NextResponse.json({ success: false, error: 'User ID, name, and type are required' }, { status: 400 });
    }

    await ensureBooksSchema();

    const trimmedName = name.trim();
    const categoryId = body.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const catColor = color || (type === 'EXPENSE' ? '#ef4444' : '#10b981');
    const catIcon = icon || 'Tag';

    // Insert or ignore if duplicate
    await pool.query(
      `INSERT INTO categories (id, user_id, name, type, color, icon)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
      [categoryId, userId, trimmedName, type, catColor, catIcon]
    );

    const [rows]: any = await pool.query(
      `SELECT id, user_id as userId, name, type, color, icon, created_at as createdAt 
       FROM categories 
       WHERE user_id = ? AND type = ? AND name = ?`,
      [userId, type, trimmedName]
    );

    return NextResponse.json({
      success: true,
      category: rows[0] || {
        id: categoryId,
        userId,
        name: trimmedName,
        type,
        color: catColor,
        icon: catIcon,
      },
    });
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/categories
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, userId, name, oldName, type, color, icon } = body;

    if (!id || !userId || !name) {
      return NextResponse.json({ success: false, error: 'ID, userId, and new name are required' }, { status: 400 });
    }

    await ensureBooksSchema();

    const trimmedName = name.trim();

    // 1. Update the category record
    await pool.query(
      `UPDATE categories 
       SET name = ?, color = COALESCE(?, color), icon = COALESCE(?, icon) 
       WHERE id = ? AND user_id = ?`,
      [trimmedName, color || null, icon || null, id, userId]
    );

    // 2. If oldName was provided and differs, update all existing transactions and budgets
    if (oldName && oldName !== trimmedName) {
      await Promise.allSettled([
        pool.query(
          `UPDATE transactions SET category = ? WHERE user_id = ? AND category = ?`,
          [trimmedName, userId, oldName]
        ),
        pool.query(
          `UPDATE budgets SET category = ? WHERE user_id = ? AND category = ?`,
          [trimmedName, userId, oldName]
        ),
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/categories?id=...&userId=...
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id || !userId) {
      return NextResponse.json({ success: false, error: 'Category ID and user ID are required' }, { status: 400 });
    }

    await ensureBooksSchema();

    await pool.query(
      `DELETE FROM categories WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete category error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
