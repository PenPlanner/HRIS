'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/hooks';

export default function UnauthorizedPage() {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Otillåten åtkomst
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          Du har inte behörighet att komma åt den här sidan.
        </p>

        {/* User info */}
        {user && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
            <p className="text-sm text-gray-700">
              <strong>Inloggad som:</strong> {profile?.email || user.email}
            </p>
            {profile?.full_name && (
              <p className="text-sm text-gray-700 mt-1">
                <strong>Namn:</strong> {profile.full_name}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition"
          >
            Gå till startsidan
          </Link>

          <Link
            href="/admin"
            className="block w-full bg-white text-gray-700 py-3 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition"
          >
            Kontakta administratör
          </Link>
        </div>

        {/* Help text */}
        <p className="mt-6 text-sm text-gray-500">
          Kontakta din systemadministratör om du tror att detta är ett misstag.
        </p>
      </div>
    </div>
  );
}
