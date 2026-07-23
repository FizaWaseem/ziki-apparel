import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';

export default function AuthError() {
    const router = useRouter();
    const { error } = router.query;
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Map NextAuth error codes to user-friendly messages
        const errorMessages: Record<string, string> = {
            'Callback': 'An error occurred during authentication. Please try again.',
            'OAuthSignin': 'Error connecting to the authentication provider.',
            'OAuthCallback': 'Error connecting to the authentication provider.',
            'OAuthCreateAccount': 'Could not create account with this provider.',
            'EmailCreateAccount': 'Email authentication failed.',
            'EmailSignin': 'Check your email for a sign in link.',
            'CredentialsSignin': 'Sign in failed. Check that the email and password are correct.',
            'default': 'An authentication error occurred. Please try again.',
        };

        const errorMsg = errorMessages[error as string] || errorMessages['default'];
        setMessage(errorMsg);
    }, [error]);

    return (
        <>
            <Head>
                <title>Authentication Error - Ziki Apparel</title>
                <meta name="robots" content="noindex" />
            </Head>
            <Layout>
                <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
                        {/* Error Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="rounded-full bg-red-100 p-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                            Authentication Error
                        </h1>

                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                            <p className="text-sm">{message}</p>
                        </div>

                        {/* Troubleshooting Tips */}
                        <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-md mb-6">
                            <h3 className="font-medium text-blue-900 mb-2">Troubleshooting Tips:</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>✓ Check that your email and password are correct</li>
                                <li>✓ Make sure you have created an account</li>
                                <li>✓ Try signing in again</li>
                                <li>✓ Clear your browser cookies if problems persist</li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <Link href="/auth/signin" className="block w-full text-center bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition">
                                Try Signing In Again
                            </Link>

                            <Link href="/auth/signup" className="block w-full text-center border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition">
                                Create New Account
                            </Link>

                            <Link href="/auth/forgot-password" className="block w-full text-center text-blue-600 hover:text-blue-700 text-sm">
                                Forgot Your Password?
                            </Link>

                            <Link href="/" className="block w-full text-center text-gray-600 hover:text-gray-900 text-sm">
                                Return to Home
                            </Link>
                        </div>

                        {/* Debug Info (Dev Only) */}
                        {process.env.NODE_ENV === 'development' && error && (
                            <div className="mt-6 p-3 bg-gray-100 rounded-md text-xs text-gray-700 font-mono break-words">
                                <p className="font-bold mb-1">Debug Info (Dev Only):</p>
                                <p>Error: {error}</p>
                            </div>
                        )}
                    </div>
                </div>
            </Layout>
        </>
    );
}
