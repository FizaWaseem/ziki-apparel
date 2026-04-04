'use client'

import React, { useState, useEffect } from 'react'
import AdminLayout from '../../../components/AdminLayout'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  productCount: number
  createdAt: string
}

interface CategoryFormData {
  name: string
  slug: string
  description: string
  image: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    image: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleInputChange = (field: keyof CategoryFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'name' && { slug: generateSlug(value) }),
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const formDataImg = new FormData()
      formDataImg.append('image', file)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formDataImg,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      setFormData((prev) => ({
        ...prev,
        image: data.url,
      }))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories'
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || 'Failed to save category')
      }

      const message = editingCategory 
        ? `✓ Category "${formData.name}" updated successfully!`
        : `✓ Category "${formData.name}" created successfully!`
      
      setSuccess(message)
      setError('')
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
      
      await fetchCategories()
      handleCloseForm()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error saving category'
      setError(errorMsg)
      setSuccess('')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
    })
    setShowForm(true)
    setError('')
  }

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || 'Failed to delete category')
      }

      setSuccess(`✓ Category "${category.name}" deleted successfully!`)
      setError('')
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
      
      await fetchCategories()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error deleting category'
      setError(errorMsg)
      setSuccess('')
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCategory(null)
    setFormData({ name: '', slug: '', description: '', image: '' })
    setError('')
    setSuccess('')
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Categories</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-black transition-colors"
          >
            Add Category
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
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Men's Jeans"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Slug (Auto-generated)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="mens-jeans"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Used in URLs</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of this category..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Image
                </label>
                <div className="space-y-4">
                  {/* Image Preview */}
                  {formData.image && (
                    <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-gray-300">
                      <Image
                        src={formData.image}
                        alt="Category preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* File Input */}
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-black"
                    />
                    {uploading && <span className="text-sm text-gray-600">Uploading...</span>}
                  </div>

                  {/* URL Input */}
                  <div>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => handleInputChange('image', e.target.value)}
                      placeholder="https://example.com/image.jpg or /uploads/image.jpg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Or paste image URL directly
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-black transition-colors font-semibold"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 border border-gray-900 text-gray-900 px-6 py-2 rounded-full hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500 mb-4">No categories yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gray-900 text-white px-6 py-2 rounded-full hover:bg-black transition-colors"
            >
              Create First Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                {category.image && (
                  <div className="relative w-full h-48 bg-gray-100">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {category.name}
                  </h3>

                  {category.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {category.description}
                    </p>
                  )}

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-200">
                    <div>
                      <p className="font-semibold text-gray-700">Products</p>
                      <p>{category.productCount}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Slug</p>
                      <p className="truncate">{category.slug}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="flex-1 px-3 py-2 border border-gray-900 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="flex-1 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold text-sm"
                    >
                      Delete
                    </button>
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