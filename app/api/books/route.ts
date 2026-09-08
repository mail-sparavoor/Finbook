import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { ensureBooksSchema } from '@/lib/books-schema';

export const dynamic = 'force-dynamic';

// Helper: Ensure a default book exists for a user and link any unassigned records
async function ensureUserDefaultBook(userId: string) {
  try {
    const [existingBooks]: any = await pool.query(
      `SELECT * FROM books WHERE user_id = ? ORDER BY is_default DESC, created_at ASC`,
      [userId]
    );

    let defaultBookId = existingBooks[0]?.id;

    if (!defaultBookId) {
      // Get user's preferred currency if available
      const [userRow]: any = await pool.query(
        `SELECT currency, currency_symbol FROM users WHERE id = ?`,
        [userId]
      );
      const userCurrency = userRow[0]?.currency || 'INR';
      const userSymbol = userRow[0]?.currency_symbol || '₹';

      defaultBookId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
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
    }

    // Backfill any orphaned user data where book_id is NULL
    if (defaultBookId) {
      await pool.query(`UPDATE transactions SET book_id = ? WHERE user_id = ? AND (book_id IS NULL OR book_id = '')`, [defaultBookId, userId]);
      await pool.query(`UPDATE dues SET book_id = ? WHERE user_id = ? AND (book_id IS NULL OR book_id = '')`, [defaultBookId, userId]);
      await pool.query(`UPDATE budgets SET book_id = ? WHERE user_id = ? AND (book_id IS NULL OR book_id = '')`, [defaultBookId, userId]);
      await pool.query(`UPDATE contacts SET book_id = ? WHERE user_id = ? AND (book_id IS NULL OR book_id = '')`, [defaultBookId, userId]);
    }

    return defaultBookId;
  } catch (err) {
    console.error('Error ensuring default book:', err);
    return null;
  }
}

// GET: Fetch all books for a user
export async function GET(request: Request) {
  try {
    await ensureBooksSchema();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    await ensureUserDefaultBook(userId);

    const [rows]: any = await pool.query(
      `SELECT 
        id, 
        user_id as userId, 
        name, 
        description, 
        currency, 
        currency_symbol as currencySymbol, 
        color, 
        icon, 
        is_default as isDefault, 
        created_at as createdAt 
       FROM books 
       WHERE user_id = ? 
       ORDER BY is_default DESC, created_at ASC`,
      [userId]
    );

    const formatted = rows.map((r: any) => ({
      ...r,
      isDefault: Boolean(r.isDefault),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch books' },
      { status: 500 }
    );
  }
}

// POST: Create a new book
export async function POST(request: Request) {
  try {
    await ensureBooksSchema();
    const body = await request.json();
    const {
      userId,
      name,
      description = '',
      currency = 'INR',
      currencySymbol = '₹',
      color = '#2563eb',
      icon = 'BookOpen',
      isDefault = false,
    } = body;

    if (!userId || !name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'User ID and Book name are required' },
        { status: 400 }
      );
    }

    const bookId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // If marked as default, clear default on other books
    if (isDefault) {
      await pool.query(`UPDATE books SET is_default = FALSE WHERE user_id = ?`, [userId]);
    }

    await pool.query(
      `INSERT INTO books (id, user_id, name, description, currency, currency_symbol, color, icon, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookId,
        userId,
        name.trim(),
        description ? description.trim() : null,
        currency.trim().toUpperCase(),
        currencySymbol.trim(),
        color || '#2563eb',
        icon || 'BookOpen',
        Boolean(isDefault),
      ]
    );

    const newBook = {
      id: bookId,
      userId,
      name: name.trim(),
      description: description ? description.trim() : '',
      currency: currency.trim().toUpperCase(),
      currencySymbol: currencySymbol.trim(),
      color: color || '#2563eb',
      icon: icon || 'BookOpen',
      isDefault: Boolean(isDefault),
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: newBook });
  } catch (error: any) {
    console.error('Error creating book:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create book' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing book
export async function PUT(request: Request) {
  try {
    await ensureBooksSchema();
    const body = await request.json();
    const { id, userId, name, description, currency, currencySymbol, color, icon, isDefault } = body;

    if (!id || !userId) {
      return NextResponse.json(
        { success: false, error: 'Book ID and User ID are required' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description ? description.trim() : null);
    }
    if (currency !== undefined) {
      updates.push('currency = ?');
      values.push(currency.trim().toUpperCase());
    }
    if (currencySymbol !== undefined) {
      updates.push('currency_symbol = ?');
      values.push(currencySymbol.trim());
    }
    if (color !== undefined) {
      updates.push('color = ?');
      values.push(color);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon);
    }
    if (isDefault !== undefined) {
      if (isDefault) {
        await pool.query(`UPDATE books SET is_default = FALSE WHERE user_id = ?`, [userId]);
      }
      updates.push('is_default = ?');
      values.push(Boolean(isDefault));
    }

    if (updates.length > 0) {
      values.push(id, userId);
      await pool.query(
        `UPDATE books SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        values
      );
    }

    return NextResponse.json({ success: true, message: 'Book updated successfully' });
  } catch (error: any) {
    console.error('Error updating book:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update book' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a book and its associated data
export async function DELETE(request: Request) {
  try {
    await ensureBooksSchema();
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!bookId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Book ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify user has more than 1 book
    const [books]: any = await pool.query(`SELECT id FROM books WHERE user_id = ?`, [userId]);
    if (books.length <= 1) {
      return NextResponse.json(
        { success: false, error: 'You must have at least one active book.' },
        { status: 400 }
      );
    }

    // Delete associated book records
    await pool.query(`DELETE FROM transactions WHERE book_id = ? AND user_id = ?`, [bookId, userId]);
    await pool.query(`DELETE FROM dues WHERE book_id = ? AND user_id = ?`, [bookId, userId]);
    await pool.query(`DELETE FROM budgets WHERE book_id = ? AND user_id = ?`, [bookId, userId]);
    await pool.query(`DELETE FROM contacts WHERE book_id = ? AND user_id = ?`, [bookId, userId]);
    await pool.query(`DELETE FROM books WHERE id = ? AND user_id = ?`, [bookId, userId]);

    // Ensure there is at least one default book
    const [remaining]: any = await pool.query(
      `SELECT id, is_default FROM books WHERE user_id = ? ORDER BY is_default DESC, created_at ASC`,
      [userId]
    );
    if (remaining.length > 0 && !remaining.some((b: any) => Boolean(b.is_default))) {
      await pool.query(`UPDATE books SET is_default = TRUE WHERE id = ?`, [remaining[0].id]);
    }

    return NextResponse.json({ success: true, message: 'Book deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete book' },
      { status: 500 }
    );
  }
}
