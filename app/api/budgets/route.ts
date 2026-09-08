import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch budgets for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user-sample';

    const [rows]: any = await pool.query(
      `SELECT 
        id, 
        user_id as userId, 
        category, 
        CAST(monthly_limit AS DECIMAL(10,2)) as monthlyLimit, 
        icon, 
        created_at as createdAt 
       FROM budgets 
       WHERE user_id = ? 
       ORDER BY category ASC`,
      [userId]
    );

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
    const body = await request.json();
    const {
      id = `bg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId = 'user-sample',
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

    await pool.query(
      `INSERT INTO budgets (id, user_id, category, monthly_limit, icon) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit), icon = COALESCE(VALUES(icon), icon)`,
      [id, userId, category, limit, icon]
    );

    const [rows]: any = await pool.query(
      `SELECT 
        id, 
        user_id as userId, 
        category, 
        CAST(monthly_limit AS DECIMAL(10,2)) as monthlyLimit, 
        icon, 
        created_at as createdAt 
       FROM budgets 
       WHERE user_id = ? AND category = ?`,
      [userId, category]
    );

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error: any) {
    console.error('Error saving budget:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save budget' },
      { status: 500 }
    );
  }
}
