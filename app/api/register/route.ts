import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { createEmailTransport, sendGeneratedPasswordEmail } from '@/src/lib/email';

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

  const { email, name, password, paymentMethod } = body as {
    email?: unknown;
    name?: unknown;
    password?: unknown;
    paymentMethod?: unknown;
  };

  if (
    typeof email !== 'string' ||
    (name !== undefined && typeof name !== 'string') ||
    (paymentMethod !== 'CASH' && paymentMethod !== 'CARD') ||
    (paymentMethod === 'CASH' && typeof password !== 'string')
  ) {
    return NextResponse.json(
      { error: 'Name, email, payment method, and a password for cash accounts are required' },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    normalizedEmail.length > 254 ||
    normalizedName.length > 100 ||
    (
      paymentMethod === 'CASH' &&
      (typeof password !== 'string' || password.length < 12 || password.length > 128)
    )
  ) {
    return NextResponse.json(
      { error: 'Enter a valid email, a name under 100 characters, and a cash-account password of 12–128 characters' },
      { status: 400 }
    );
  }

  const generatedPassword =
    paymentMethod === 'CARD' ? randomBytes(24).toString('base64url') : null;
  let emailDeliveryFailed = false;

  if (generatedPassword) {
    try {
      createEmailTransport();
    } catch (error) {
      console.error('[REGISTER_EMAIL_CONFIG]', error);
      return NextResponse.json(
        {
          error:
            'Card signup is unavailable because SMTP email is not configured. Set SMTP_HOST, SMTP_PORT, and SMTP_FROM (and SMTP_USER/SMTP_PASS if required), then try again or choose cash.',
        },
        { status: 503 }
      );
    }
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
      email: normalizedEmail,
      name: normalizedName || null,
      password: await bcrypt.hash(generatedPassword ?? (password as string), 12),
      preferredPaymentMethod: paymentMethod,
    });

    if (generatedPassword) {
      try {
        await sendGeneratedPasswordEmail(normalizedEmail, generatedPassword);
      } catch (emailError) {
        emailDeliveryFailed = true;
        try {
          await db.orm.public.User.where({ id: user.id }).delete();
        } catch (rollbackError) {
          console.error('[REGISTER_ROLLBACK]', rollbackError);
        }
        throw emailError;
      }
    }

    return NextResponse.json(
      {
        success: true,
        userId: user.id,
        paymentMethod,
        passwordEmailed: Boolean(generatedPassword),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[REGISTER_POST]', error);
    return NextResponse.json(
      {
        error: generatedPassword
          ? emailDeliveryFailed
            ? 'Your account was not created because the password email could not be delivered. Check SMTP settings and try again.'
            : 'Could not create your account. Please try again.'
          : 'Could not create account',
      },
      { status: 500 }
    );
  }
}
