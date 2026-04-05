'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import Image from 'next/image'
import LoadingButton from '../../../components/LoadingButton'

interface HeroSlide {
  id: string
  type: 'image' | 'video'
  src: string
  poster?: string
  title: string
  subtitle?: string
  ctaText: string
  ctaLink: string
  position: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminHeroPage() {
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    type: 'image' as 'image' | 'video',
    src: '',
    poster: '',
    title: '',
    subtitle: '',
    ctaText: 'Shop Now',
    ctaLink: '/products',
    active: true,
  })

  useEffect(() => {
    fetchHeroSlides()
  }, [])

  const fetchHeroSlides = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/hero')
      if (!res.ok) throw new Error('Failed to fetch hero slides')
      const data = await res.json()
      setHeroSlides(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setFormSubmitting(true)

    try {
      if (editingId) {
        // Update existing
        const res = await fetch(`/api/admin/hero/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!res.ok) throw new Error('Failed to update hero slide')
        const data = await res.json()
        setHeroSlides(heroSlides.map((s) => (s.id === editingId ? data.heroSlide : s)))
        setSuccess(`✓ Hero slide "${formData.title}" updated successfully!`)
      } else {
        // Create new
        const res = await fetch('/api/admin/hero', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!res.ok) throw new Error('Failed to create hero slide')
        const data = await res.json()
        setHeroSlides([...heroSlides, data.heroSlide])
        setSuccess(`✓ Hero slide "${formData.title}" created successfully!`)
      }

      // Auto-dismiss success message
      setTimeout(() => setSuccess(''), 3000)

      // Reset form
      setFormData({
        type: 'image',
        src: '',
        poster: '',
        title: '',
        subtitle: '',
        ctaText: 'Shop Now',
        ctaLink: '/products',
        active: true,
      })
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMsg)
      setSuccess('')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleEdit = (slide: HeroSlide) => {
    setFormData({
      type: slide.type,
      src: slide.src,
      poster: slide.poster || '',
      title: slide.title,
      subtitle: slide.subtitle || '',
      ctaText: slide.ctaText,
      ctaLink: slide.ctaLink,
      active: slide.active,
    })
    setEditingId(slide.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hero slide?')) return

    try {
      const res = await fetch(`/api/admin/hero/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete hero slide')
      setHeroSlides(heroSlides.filter((s) => s.id !== id))
      setSuccess('✓ Hero slide deleted successfully!')
      setError('')
      
      // Auto-dismiss success message
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMsg)
      setSuccess('')
    }
  }

  const cancelEdit = () => {
    setFormData({
      type: 'image',
      src: '',
      poster: '',
      title: '',
      subtitle: '',
      ctaText: 'Shop Now',
      ctaLink: '/products',
      active: true,
    })
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hero Slides Management</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-black transition-colors"
          >
            {showForm ? 'Cancel' : 'Add New Slide'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              {editingId ? 'Edit Hero Slide' : 'Add New Hero Slide'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as 'image' | 'video',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {/* Source URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {formData.type === 'image' ? 'Image URL' : 'Video File Path'}
                </label>
                <input
                  type="text"
                  value={formData.src}
                  onChange={(e) =>
                    setFormData({ ...formData, src: e.target.value })
                  }
                  placeholder={
                    formData.type === 'image'
                      ? 'https://example.com/image.jpg or /images/hero-1.jpg'
                      : '/videos/hero-video.mp4'
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.type === 'image'
                    ? 'Use full URL or /images/ path for local files'
                    : 'Use /videos/ path for files in public/videos folder'}
                </p>
              </div>

              {/* Poster Image (for videos) */}
              {formData.type === 'video' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Poster Image (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.poster}
                    onChange={(e) =>
                      setFormData({ ...formData, poster: e.target.value })
                    }
                    placeholder="/images/hero-poster.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Shows before video plays
                  </p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Premium Trouser Collection"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                  placeholder="Crafted for the modern lifestyle..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {/* CTA Text and Link */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) =>
                      setFormData({ ...formData, ctaText: e.target.value })
                    }
                    placeholder="Shop Now"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CTA Link
                  </label>
                  <input
                    type="text"
                    value={formData.ctaLink}
                    onChange={(e) =>
                      setFormData({ ...formData, ctaLink: e.target.value })
                    }
                    placeholder="/products"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                  className="w-4 h-4 text-gray-900 rounded focus:ring-2 focus:ring-gray-900"
                />
                <label htmlFor="active" className="ml-2 text-sm font-semibold text-gray-700">
                  Active (Show on homepage)
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <LoadingButton
                  type="submit"
                  loading={formSubmitting}
                  variant="dark"
                  className="flex-1 rounded-full"
                >
                  {editingId ? 'Update Slide' : 'Create Slide'}
                </LoadingButton>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 border border-gray-900 text-gray-900 px-6 py-2 rounded-full hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Hero Slides List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading hero slides...</p>
          </div>
        ) : heroSlides.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500 mb-4">No hero slides yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-black transition-colors"
            >
              Create First Slide
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-block bg-gray-900 text-white px-3 py-1 rounded text-sm font-semibold">
                          #{index + 1}
                        </span>
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-semibold">
                          {slide.type.toUpperCase()}
                        </span>
                        {!slide.active && (
                          <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm font-semibold">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{slide.title}</h3>
                      {slide.subtitle && (
                        <p className="text-gray-600 text-sm mt-1">{slide.subtitle}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(slide)}
                        className="px-4 py-2 border border-gray-900 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(slide.id)}
                        className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Preview:</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-gray-700">Source:</p>
                        <p className="text-gray-600 break-all">{slide.src}</p>
                      </div>
                      {slide.poster && (
                        <div>
                          <p className="font-semibold text-gray-700">Poster:</p>
                          <p className="text-gray-600 break-all">{slide.poster}</p>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-700">CTA:</p>
                        <p className="text-gray-600">
                          {slide.ctaText} → {slide.ctaLink}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">Updated:</p>
                        <p className="text-gray-600">
                          {new Date(slide.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
