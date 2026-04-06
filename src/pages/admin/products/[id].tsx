import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import Image from 'next/image';
import LoadingButton from '../../../components/LoadingButton';

// Predefined color palette for Ziki Apparel
const COLOR_PALETTE = [
  { name: 'Black', value: '#000000' },
  { name: 'Grey', value: '#808080' },
  { name: 'Dark Grey', value: '#404040' },
  { name: 'Denim Blue', value: '#1560BD' },
  { name: 'Sky Blue', value: '#87CEEB' },
  { name: 'Classic Blue', value: '#0F4C75' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Mid Blue', value: '#4169E1' },
  { name: 'Olive', value: '#808000' },
  { name: 'Brown', value: '#A52A2A' },
  { name: 'Chocolate Brown', value: '#D2691E' },
  { name: 'Light Brown', value: '#CD853F' },
];

// Predefined size options
const SIZE_OPTIONS = {
  CLOTHING: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  NUMERIC: ['30', '32', '34', '36', '38', '40', '42', '44', '46', '48']
};

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  price: number;
  status: string;
  categoryId: string;
  sizeChartImage: string;
  images: Array<{
    url: string;
    alt: string;
    position: number;
  }>;
  variants: Array<{
    size: string;
    color: string;
    stock: number;
    price: number;
  }>;
}

interface Category {
  id: string;
  name: string;
}

export default function ProductForm() {
  const router = useRouter();
  const { id } = router.query;
  const isEditing = !!id;

  const [form, setForm] = useState<ProductForm>({
    name: '',
    slug: '',
    description: '',
    price: 0,
    status: 'DRAFT',
    categoryId: '',
    sizeChartImage: '',
    images: [],
    variants: [{ size: '', color: '', stock: 0, price: 0 }],
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategories();

    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/admin/products/${id}`);
        if (response.ok) {
          const product = await response.json();
          setForm({
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: product.price,
            status: product.status,
            categoryId: product.categoryId,
            sizeChartImage: product.sizeChartImage || '',
            images: product.images || [],
            variants: product.variants || [{ size: '', color: '', stock: 0, price: 0 }],
          });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };

    if (isEditing) {
      fetchProduct();
    }
  }, [id, isEditing]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleInputChange = (
    field: keyof ProductForm,
    value: string | number | Array<{ url: string; alt: string; position: number }> | Array<{ size: string; color: string; stock: number; price: number }>
  ) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'name' ? { slug: generateSlug(value as string) } : {}),
    }));
  };

  const handleVariantChange = (index: number, field: string, value: string | number) => {
    const newVariants = [...form.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setForm(prev => ({ ...prev, variants: newVariants }));
  };

  const addVariant = () => {
    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, { size: '', color: '', stock: 0, price: form.price }],
    }));
  };

  const removeVariant = (index: number) => {
    if (form.variants.length > 1) {
      const newVariants = form.variants.filter((_, i) => i !== index);
      setForm(prev => ({ ...prev, variants: newVariants }));
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setImageUploading(true);
    setError('');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          const newImage = {
            url: result.url,
            alt: form.name || 'Product image',
            position: form.images.length,
          };

          setForm(prev => ({
            ...prev,
            images: [...prev.images, newImage],
          }));
        }
      }
      setSuccess('✓ Image(s) uploaded successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error uploading images';
      setError(errorMsg);
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = form.images.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, images: newImages }));
  };

  const handleSizeChartUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setForm(prev => ({
          ...prev,
          sizeChartImage: result.url,
        }));
        setSuccess('✓ Size chart uploaded successfully!');
        setTimeout(() => setSuccess(''), 2000);
      } else {
        setError('Error uploading size chart');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error uploading size chart';
      setError(errorMsg);
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = isEditing ? `/api/admin/products/${id}` : '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        const message = isEditing
          ? `✓ Product "${form.name}" updated successfully!`
          : `✓ Product "${form.name}" created successfully!`;
        setSuccess(message);

        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/admin/products');
        }, 2000);
      } else {
        const error = await response.json();
        setError(error.message || 'Error saving product');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error saving product';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title={isEditing ? 'Edit Product' : 'Add Product'}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="product-slug"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Product description..."
              />

              {/* Formatting Help Section */}
              <div className="mt-3 p-4 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-semibold text-blue-900">📝 Formatting Guide</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const descTextarea = document.querySelector('textarea[placeholder="Product description..."]') as HTMLTextAreaElement;
                      if (descTextarea) {
                        descTextarea.focus();
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Focus field
                  </button>
                </div>

                {/* Formatting Syntax Examples */}
                <div className="space-y-2 text-sm text-blue-800 mb-4 bg-white p-2 rounded border border-blue-100">
                  <div>
                    <strong>Bold Text:</strong>
                    <code className="bg-gray-100 mx-1 px-2 py-0.5 rounded text-xs">**bold text**</code>
                    → <strong>bold text</strong>
                  </div>
                  <div>
                    <strong>Ordered List:</strong>
                    <code className="bg-gray-100 mx-1 px-2 py-0.5 rounded text-xs">1. Item 1</code>
                    <br className="ml-16" />
                    <code className="bg-gray-100 mx-1 px-2 py-0.5 rounded text-xs">2. Item 2</code>
                  </div>
                  <div>
                    <strong>Bullet List:</strong>
                    <code className="bg-gray-100 mx-1 px-2 py-0.5 rounded text-xs">• Item 1</code>
                    <br className="ml-16" />
                    <code className="bg-gray-100 mx-1 px-2 py-0.5 rounded text-xs">• Item 2</code>
                  </div>
                  <div>
                    <strong>New Line:</strong>
                    <code className="bg-gray-100 mx-1 px-2 py-0.5 rounded text-xs">Press Enter twice</code>
                    → (Creates paragraph break)
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.querySelector('textarea[placeholder="Product description..."]') as HTMLTextAreaElement;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const selectedText = textarea.value.substring(start, end);
                        const beforeText = textarea.value.substring(0, start);
                        const afterText = textarea.value.substring(end);
                        const newText = selectedText ? `${beforeText}**${selectedText}**${afterText}` : `${beforeText}**bold text**${afterText}`;
                        handleInputChange('description', newText);
                        textarea.focus();
                      }
                    }}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded"
                  >
                    <strong>Bold</strong> Selected Text
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const orderedList = `1. First item\n2. Second item\n3. Third item`;
                      const currentDesc = form.description;
                      const newDesc = currentDesc ? `${currentDesc}\n\n${orderedList}` : orderedList;
                      handleInputChange('description', newDesc);
                    }}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded"
                  >
                    Insert Ordered List
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const bulletList = `• Feature 1\n• Feature 2\n• Feature 3`;
                      const currentDesc = form.description;
                      const newDesc = currentDesc ? `${currentDesc}\n\n${bulletList}` : bulletList;
                      handleInputChange('description', newDesc);
                    }}
                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded"
                  >
                    Insert Bullet List
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const careText = `**Care Instructions:**\n• Machine wash cold\n• Do not bleach\n• Lay flat to dry`;
                      const currentDesc = form.description;
                      const newDesc = currentDesc ? `${currentDesc}\n\n${careText}` : careText;
                      handleInputChange('description', newDesc);
                    }}
                    className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded"
                  >
                    Add Care Instructions
                  </button>
                </div>
              </div>

              {/* Available Colors Summary */}
              <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Available Colors:
                  <span className="text-xs text-gray-500 ml-1">
                    ({form.variants.filter(v => v.color && v.color.trim() !== '').length} colors defined out of {form.variants.length} variants)
                  </span>
                </h4>

                {/* Debug Info */}
                <div className="text-xs text-gray-600 mb-2">
                  <p>Total variants: {form.variants.length}</p>
                  <p>Variants with colors: {form.variants.filter(v => v.color && v.color.trim() !== '').map(v => `"${v.color}"`).join(', ') || 'None'}</p>
                </div>

                {form.variants.filter(v => v.color && v.color.trim() !== '').length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Array.from(new Set(form.variants.filter(v => v.color && v.color.trim() !== '').map(v => v.color))).map((color) => {
                        const colorData = COLOR_PALETTE.find(c => c.name === color);
                        return (
                          <div key={color} className="flex items-center space-x-1 px-2 py-1 bg-white rounded-md border">
                            {colorData ? (
                              <div
                                className="w-3 h-3 rounded-full border border-gray-300"
                                style={{ backgroundColor: colorData.value }}
                                title={`${color} - ${colorData.value}`}
                              ></div>
                            ) : (
                              <div className="w-3 h-3 rounded-full border border-gray-300 bg-gray-200" title={`${color} - Custom color`}></div>
                            )}
                            <span className="text-xs font-medium text-gray-700">{color}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick color description helper */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const availableColors = Array.from(new Set(form.variants.filter(v => v.color && v.color.trim() !== '').map(v => v.color)));
                          if (availableColors.length > 0) {
                            const colorText = `Available in ${availableColors.join(', ')}.`;
                            const currentDesc = form.description;
                            const newDesc = currentDesc ? `${currentDesc}\n\n${colorText}` : colorText;
                            handleInputChange('description', newDesc);
                          }
                        }}
                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                      >
                        Add Color Info to Description
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const availableColors = Array.from(new Set(form.variants.filter(v => v.color && v.color.trim() !== '').map(v => v.color)));
                          if (availableColors.length > 0) {
                            const colorText = `Colors: ${availableColors.join(' | ')}`;
                            const currentDesc = form.description;
                            const newDesc = currentDesc ? `${currentDesc}\n${colorText}` : colorText;
                            handleInputChange('description', newDesc);
                          }
                        }}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                      >
                        Add Color List
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 italic">No colors defined yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Add variants below and select colors using the color palette.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images
              </label>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="mt-4">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        {imageUploading ? 'Uploading...' : 'Upload images'}
                      </span>
                      <input
                        id="image-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={imageUploading}
                        className="sr-only"
                      />
                    </label>
                    <p className="mt-2 text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                  </div>
                </div>
              </div>

              {/* Image Preview */}
              {form.images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {form.images.map((image, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        width={200}
                        height={200}
                        className="h-32 w-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Size Chart Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size Chart Image
              </label>

              <div className="space-y-4">
                {/* Size Chart Preview */}
                {form.sizeChartImage && (
                  <div className="relative w-full max-w-sm">
                    <Image
                      src={form.sizeChartImage}
                      alt="Size chart"
                      width={300}
                      height={300}
                      className="w-full h-auto rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, sizeChartImage: '' }))}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="mt-4">
                      <label htmlFor="size-chart-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          {imageUploading ? 'Uploading...' : 'Upload size chart'}
                        </span>
                        <input
                          id="size-chart-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleSizeChartUpload}
                          disabled={imageUploading}
                          className="sr-only"
                        />
                      </label>
                      <p className="mt-2 text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>

                {/* URL Input */}
                <div>
                  <input
                    type="text"
                    value={form.sizeChartImage}
                    onChange={(e) => setForm(prev => ({ ...prev, sizeChartImage: e.target.value }))}
                    placeholder="Or paste image URL directly"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Displaying size chart on product page for customers</p>
                </div>
              </div>
            </div>

            {/* Variants */}
            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-lg font-medium text-gray-900">Product Variants</h3>
                <div className="flex flex-wrap gap-2">
                  {/* Quick Variant Generators */}
                  <button
                    type="button"
                    onClick={() => {
                      // Add all clothing sizes
                      const newVariants = SIZE_OPTIONS.CLOTHING.map(size => ({
                        size,
                        color: '',
                        stock: 0,
                        price: form.price
                      }));
                      setForm(prev => ({ ...prev, variants: [...prev.variants, ...newVariants] }));
                    }}
                    className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                  >
                    + All Clothing Sizes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Add all numeric sizes
                      const newVariants = SIZE_OPTIONS.NUMERIC.map(size => ({
                        size,
                        color: '',
                        stock: 0,
                        price: form.price
                      }));
                      setForm(prev => ({ ...prev, variants: [...prev.variants, ...newVariants] }));
                    }}
                    className="bg-gray-900 text-white px-3 py-1 rounded-full text-sm hover:bg-black transition-colors"
                  >
                    + All Numeric Sizes
                  </button>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700"
                  >
                    + Single Variant
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {form.variants.map((variant, index) => (
                  <div key={index} className="grid grid-cols-1 gap-4 sm:grid-cols-5 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                      <div className="space-y-2">
                        {/* Size Input */}
                        <input
                          type="text"
                          value={variant.size}
                          onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="S, M, L, XL or 30, 32, 34..."
                        />

                        {/* Size Options */}
                        <div className="space-y-2">
                          {/* Clothing Sizes */}
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Clothing Sizes:</p>
                            <div className="flex flex-wrap gap-1">
                              {SIZE_OPTIONS.CLOTHING.map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => handleVariantChange(index, 'size', size)}
                                  className={`px-2 py-1 text-xs border rounded transition-colors ${variant.size === size
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:text-indigo-600'
                                    }`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Numeric Sizes */}
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Numeric Sizes:</p>
                            <div className="flex flex-wrap gap-1">
                              {SIZE_OPTIONS.NUMERIC.map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => handleVariantChange(index, 'size', size)}
                                  className={`px-2 py-1 text-xs border rounded transition-colors ${variant.size === size
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:text-indigo-600'
                                    }`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <div className="space-y-2">
                        {/* Color Input */}
                        <input
                          type="text"
                          value={variant.color}
                          onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Blue, Black, etc."
                        />

                        {/* Color Palette */}
                        <div className="grid grid-cols-5 gap-1 p-2 bg-white border border-gray-200 rounded-md">
                          {COLOR_PALETTE.map((color) => (
                            <button
                              key={color.name}
                              type="button"
                              onClick={() => handleVariantChange(index, 'color', color.name)}
                              className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${variant.color === color.name
                                  ? 'border-gray-900 ring-2 ring-indigo-500'
                                  : 'border-gray-300 hover:border-gray-400'
                                }`}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            >
                              {color.value === '#FFFFFF' && (
                                <div className="w-full h-full rounded-full border border-gray-200"></div>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Selected Color Preview */}
                        {variant.color && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>Selected:</span>
                            <div className="flex items-center space-x-1">
                              {COLOR_PALETTE.find(c => c.name === variant.color) && (
                                <div
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: COLOR_PALETTE.find(c => c.name === variant.color)?.value }}
                                ></div>
                              )}
                              <span className="font-medium">{variant.color}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(index, 'price', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex items-end">
                      {form.variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/admin/products')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <LoadingButton
                type="submit"
                loading={loading}
              >
                {isEditing ? 'Update Product' : 'Create Product'}
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}