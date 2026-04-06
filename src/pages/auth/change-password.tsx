import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Layout from '@/components/Layout'

export default function CustomerChangePasswordPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <>
        <Head>
          <title>Change Password - Ziki Apparel</title>
          <meta name="description" content="Change your Ziki Apparel account password. Update your password to keep your account secure." />
          <meta name="robots" content="noindex" />
        </Head>
        <Layout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </Layout>
      </>
    )
  }

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Password changed successfully! Please sign in again.'
        })
        setForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })

        // Redirect to signin after 2 seconds
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to change password'
        })
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Change Password - Ziki Apparel</title>
        <meta name="description" content="Change your Ziki Apparel account password. Update your password to keep your account secure." />
        <meta name="robots" content="noindex" />
      </Head>
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h1>

            {message && (
              <div className={`mb-4 p-4 rounded-md ${message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

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
                />
                <p className="text-sm text-gray-500 mt-1">At least 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-600 text-white font-medium py-2 rounded-md transition-colors"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
              You will be redirected to sign in after successful password change.
            </p>
          </div>
        </div>
      </Layout>
    </>
  )
}
