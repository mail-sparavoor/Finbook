import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envCheck = {
    hasDBHost: !!process.env.DB_HOST,
    hasDBPort: !!process.env.DB_PORT,
    hasDBUser: !!process.env.DB_USER,
    hasDBPassword: !!process.env.DB_PASSWORD,
    hasDBName: !!process.env.DB_NAME,
    hostTarget: process.env.DB_HOST || 'mysql-1a238f5c-mail-ffb3.i.aivencloud.com (fallback)',
  };

  try {
    const [rows] = await pool.query('SELECT * FROM users LIMIT 5');

    return NextResponse.json({
      status: 'success',
      message: 'Successfully connected to Aiven Cloud MySQL database!',
      envDiagnostics: envCheck,
      usersFound: (rows as any[]).length,
    });
  } catch (error: any) {
    console.error('Database connection error in Vercel function:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
        code: error.code,
        envDiagnostics: envCheck,
        tip: !process.env.DB_PASSWORD
          ? 'DB_PASSWORD environment variable is missing in your Vercel Project Settings.'
          : 'Check if Aiven MySQL service is running and SSL is enabled.',
      },
      { status: 500 }
    );
  }
}
