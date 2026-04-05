import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import LoadingButton from '@/components/LoadingButton'

interface UserSettings {
  name: string
  email: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (session?.user) {
      setSettings({
        name: session.user.name || '',
        email: session.user.email || ''
      })
    }
  }, [session])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Settings updated successfully!'
        })
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to update settings'
        })
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout title="Settings">
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Settings</h1>

        {/* Settings Sections */}
        <div className="space-y-8">
          {/* Profile Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>

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
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={settings.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={settings.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <LoadingButton
                type="submit"
                loading={loading}
                className="w-full"
              >
                Save Changes
              </LoadingButton>
            </form>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Security</h2>

            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Manage your account security settings here.
              </p>

              <Link
                href="/admin/change-password"
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors text-center"
              >
                Change Password
              </Link>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Email Address</p>
                <p className="text-lg font-medium text-gray-900">{settings.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="text-lg font-medium text-gray-900">{settings.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Account Status</p>
                <p className="text-lg font-medium text-green-600">✓ Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
