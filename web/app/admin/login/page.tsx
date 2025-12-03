'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:6060';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${apiBase}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Invalid credentials');
      }

      const { token } = await res.json();
      localStorage.setItem('adminToken', token);
      router.push('/admin');
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Login failed. Please try again.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-tealSoft/20 to-brand-pinkSoft/20 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-white border-2 border-brand-tealSoft flex items-center justify-center">
            <Image
              src="/logo-tender-touch.png"
              alt="Tender Touch Pediatrics logo"
              width={64}
              height={64}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
        <h1 className="tt-h2 text-center mb-2 text-brand-tealDark">Admin Login</h1>
        <p className="tt-small text-center text-slate-600 mb-6">Tender Touch Pediatric Clinic</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="tt-small text-slate-700 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-teal"
              placeholder="admin@tendertouchpediatrics.in"
            />
          </div>

          <div>
            <label className="tt-small text-slate-700 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="tt-small text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-brand-pink px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-pink/90 disabled:opacity-60"
          >
            {isSubmitting ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}


