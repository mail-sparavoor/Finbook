import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM view_user_balances LIMIT 5');

    return NextResponse.json({
      status: 'success',
      message: 'Successfully connected to Aiven Cloud MySQL (myfinbook_db)!',
      data: rows,
    });
  } catch (error: any) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}
