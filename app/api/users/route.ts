import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { name, email, password } = body as {
    name?: unknown;
    email?: unknown;
    password?: unknown;
  };

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    (name !== undefined && typeof name !== 'string')
  ) {
    return NextResponse.json(
      { error: 'Name, email, and password must be valid text values' },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    normalizedEmail.length > 254 ||
    normalizedName.length > 100 ||
    password.length < 12 ||
    password.length > 128
  ) {
    return NextResponse.json(
      { error: 'Enter a valid email, a name under 100 characters, and a password of 12–128 characters' },
      { status: 400 }
    );
  }

  try {
    const existingUser = await db.orm.public.User
      .select('id')
      .where({ email: normalizedEmail })
      .first();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const user = await db.orm.public.User.create({
      name: normalizedName || null,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      preferredPaymentMethod: 'CASH',
    });

    return NextResponse.json(
      { success: true, userId: user.id, paymentMethod: user.preferredPaymentMethod },
      { status: 201 }
    );
  } catch (error) {
    console.error('[USERS_POST]', error);
    return NextResponse.json({ error: 'Could not create account' }, { status: 500 });
  }
}
