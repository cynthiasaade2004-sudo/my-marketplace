'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type PaymentMethod = 'CASH' | 'CARD';

export default function LoginPage() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');

    try {
      if (isRegistering) {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.get('name'),
            email,
            ...(paymentMethod === 'CASH' ? { password } : {}),
            paymentMethod,
          }),
        });
        const result = (await response.json()) as {
          error?: string;
          passwordEmailed?: boolean;
        };
        if (!response.ok) {
          setError(result.error ?? 'Could not create your account.');
          return;
        }

        if (result.passwordEmailed) {
          setSuccessMessage(
            `Your account is ready. A generated password was sent to ${email}. Sign in with that password to continue.`
          );
          setIsRegistering(false);
          return;
        }
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (!result || result.error) {
        setError(
          isRegistering
            ? 'Account created, but sign-in failed. Please sign in.'
            : 'Invalid email or password.'
        );
        setIsRegistering(false);
        return;
      }

      router.push('/cart');
      router.refresh();
    } catch (submitError) {
      console.error('[AUTH_FORM]', submitError);
      setError('Could not complete your request. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16 w-full">
      <h1 className="text-3xl font-bold mb-6">
        {isRegistering ? 'Create an account' : 'Sign in'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegistering && (
          <label className="block">
            <span className="block text-sm font-medium mb-1">Name</span>
            <input
              name="name"
              maxLength={100}
              className="w-full border rounded-lg px-3 py-2"
            />
          </label>
        )}
        <label className="block">
          <span className="block text-sm font-medium mb-1">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full border rounded-lg px-3 py-2"
          />
        </label>

        {isRegistering && (
          <fieldset className="space-y-2">
            <legend className="block text-sm font-medium mb-1">
              Preferred payment method
            </legend>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentMethod"
                value="CASH"
                checked={paymentMethod === 'CASH'}
                onChange={() => setPaymentMethod('CASH')}
              />
              Cash on delivery
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentMethod"
                value="CARD"
                checked={paymentMethod === 'CARD'}
                onChange={() => {
                  setPaymentMethod('CARD');
                  setPassword('');
                }}
              />
              Card
            </label>
          </fieldset>
        )}

        {(!isRegistering || paymentMethod === 'CASH') ? (
          <label className="block">
            <span className="block text-sm font-medium mb-1">Password</span>
            <input
              name="password"
              type="password"
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              minLength={isRegistering ? 12 : undefined}
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
            {isRegistering && (
              <span className="text-xs text-gray-600">Use 12 to 128 characters.</span>
            )}
          </label>
        ) : null}
        {successMessage && (
          <p role="status" className="text-sm text-green-700">{successMessage}</p>
        )}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded-lg py-3 disabled:opacity-50"
        >
          {loading ? 'Please wait...' : isRegistering ? 'Create account' : 'Sign in'}
        </button>
      </form>
      <button
        type="button"
        onClick={() => {
          setIsRegistering((value) => !value);
          setPaymentMethod('CASH');
          setPassword('');
          setError('');
          setSuccessMessage('');
        }}
        className="mt-4 text-sm underline"
      >
        {isRegistering ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </button>
      <p className="mt-6 text-center text-sm text-gray-600">
        Just browsing?{' '}
        <button
          type="button"
          onClick={() => router.push('/')}
          className="underline"
        >
          Continue as guest
        </button>
      </p>
    </main>
  );
}
