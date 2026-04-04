import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '@/components/Layout'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { token } = router.query
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      setMessage({
        type: 'error',
        text: 'Invalid reset link'
      })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Password reset successfully! Redirecting to sign in...'
        })
        
        // Redirect to signin after 2 seconds
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to reset password'
        })
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12 px-4">
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
              Invalid reset link. Please request a new password reset.
            </div>
            <div className="mt-6 text-center">
              <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-500">
                Request New Reset Link
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Reset Password</h1>

          {message && (
            <div className={`mb-4 p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-600 text-white font-medium py-2 rounded-md transition-colors"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
