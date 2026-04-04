import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import Layout from '@/components/Layout'
import SearchWithAutocomplete from '@/components/SearchWithAutocomplete'

interface ProductImage {
  id: string
  url: string
  alt: string | null
  position: number
}

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductVariant {
  id: string
  size: string
  color: string | null
  stock: number
}

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  comparePrice: number | null
  images: ProductImage[]
  category: Category | null
  variants: ProductVariant[]
  _count: {
    reviews: number
  }
}

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface ProductsResponse {
  products: Product[]
  pagination: PaginationInfo
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: 'createdAt',
    order: 'desc'
  })
  const [inStockOnly, setInStockOnly] = useState(false)
  const [outOfStockOnly, setOutOfStockOnly] = useState(false)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [expandedSections, setExpandedSections] = useState({
    availability: true,
    price: true,
    category: false,
    size: false,
    sort: false
  })
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null)

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchProductsData = async () => {
      setLoading(true)
      try {
        const queryParams = new URLSearchParams()
        
        Object.entries(router.query).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            queryParams.append(key, value)
          }
        })

        const response = await fetch(`/api/products?${queryParams.toString()}`)
        const data: ProductsResponse = await response.json()
        
        setProducts(data.products)
        setPagination(data.pagination)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProductsData()
  }, [router.query])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sort: 'createdAt',
      order: 'desc'
    })
    setInStockOnly(false)
    setOutOfStockOnly(false)
    setSelectedSizes([])
  }

  // Get available sizes with counts from products
  const getAvailableSizes = () => {
    const sizeMap = new Map<string, number>()
    products.forEach(product => {
      product.variants?.forEach(variant => {
        if (variant.size) {
          sizeMap.set(variant.size, (sizeMap.get(variant.size) || 0) + 1)
        }
      })
    })
    return Array.from(sizeMap.entries())
      .sort((a, b) => {
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        return sizeOrder.indexOf(a[0]) - sizeOrder.indexOf(b[0])
      })
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    const query: Record<string, string> = {}
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        query[key] = value
      }
    })

    router.push({
      pathname: router.pathname,
      query
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR'
    }).format(price)
  }

  return (
    <Layout>
      <div className="min-h-screen bg-white">
        {/* Top Controls */}
        <div className="border-b border-[#E5E5E5]">
          <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilterDrawer(true)}
              className="flex items-center gap-2 text-gray-900 font-medium uppercase tracking-wide hover:text-gray-600 transition-colors"
            >
              <span>Filter +</span>
            </button>

            {/* Product Counter & Sort */}
            <div className="flex items-center gap-6">
              {pagination && (
                <p className="text-xs text-gray-600 uppercase tracking-wide">
                  Showing {products.length} of {pagination.totalCount} products
                </p>
              )}
              
              {/* Sort Dropdown */}
              <select
                value={`${filters.sort}-${filters.order}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-')
                  handleFilterChange('sort', sort)
                  handleFilterChange('order', order)
                  applyFilters()
                }}
                className="text-xs uppercase tracking-wide border border-[#E5E5E5] px-3 py-2 rounded-full focus:outline-none cursor-pointer"
              >
                <option value="createdAt-desc">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="space-y-4">
                  <div className="bg-gray-200 animate-pulse aspect-[3/4] rounded-lg"></div>
                  <div className="bg-gray-200 animate-pulse h-4 w-3/4 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map(product => (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <div
                      className="group cursor-pointer"
                      onMouseEnter={() => setHoveredProductId(product.id)}
                      onMouseLeave={() => setHoveredProductId(null)}
                    >
                      {/* Product Image - 3:4 Aspect Ratio */}
                      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden rounded-sm mb-4">
                        {product.images.length > 0 ? (
                          <>
                            {/* First Image */}
                            <Image
                              src={product.images[0].url}
                              alt={product.images[0].alt || product.name}
                              fill
                              className={`object-cover transition-opacity duration-300 ${
                                hoveredProductId === product.id && product.images.length > 1
                                  ? 'opacity-0'
                                  : 'opacity-100'
                              }`}
                            />
                            {/* Second Image on Hover */}
                            {product.images.length > 1 && (
                              <Image
                                src={product.images[1].url}
                                alt={product.images[1].alt || `${product.name} - Image 2`}
                                fill
                                className={`object-cover absolute inset-0 transition-opacity duration-300 ${
                                  hoveredProductId === product.id ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-gray-400 text-sm">No Image</span>
                          </div>
                        )}
                        {product.comparePrice && (
                          <div className="absolute top-3 right-3 bg-gray-900 text-white text-xs px-2 py-1 z-10">
                            SALE
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="space-y-2">
                        {/* Product Name - Uppercase */}
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest leading-tight">
                          {product.name}
                        </h3>

                        {/* Price */}
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-gray-900">
                            PKR {Math.round(product.price).toLocaleString()}
                          </span>
                          {product.comparePrice && (
                            <span className="text-xs text-gray-500 line-through">
                              PKR {Math.round(product.comparePrice).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center mt-12 gap-3">
                  {pagination.hasPrevPage && (
                    <button
                      onClick={() => router.push({
                        pathname: router.pathname,
                        query: { ...router.query, page: pagination.page - 1 }
                      })}
                      className="px-4 py-2 border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
                    >
                      Previous
                    </button>
                  )}
                  
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => router.push({
                        pathname: router.pathname,
                        query: { ...router.query, page }
                      })}
                      className={`px-3 py-2 text-sm rounded-full transition-colors ${
                        page === pagination.page
                          ? 'bg-gray-900 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  {pagination.hasNextPage && (
                    <button
                      onClick={() => router.push({
                        pathname: router.pathname,
                        query: { ...router.query, page: pagination.page + 1 }
                      })}
                      className="px-4 py-2 border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
                    >
                      Next
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Filter Drawer - Slide-out from Right */}
      {showFilterDrawer && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40 transition-opacity"
            onClick={() => setShowFilterDrawer(false)}
          />
          
          {/* Drawer Panel */}
          <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white z-50 overflow-y-auto shadow-lg animate-in slide-in-from-right">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E5E5E5]">
              <h2 className="text-lg font-semibold uppercase tracking-widest">Filter</h2>
              <button
                onClick={() => setShowFilterDrawer(false)}
                className="text-gray-500 hover:text-gray-900 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Filter Content */}
            <div className="p-6 space-y-0">
              {/* Availability */}
              <div className="border-b border-[#E5E5E5]">
                <button
                  onClick={() => toggleSection('availability')}
                  className="w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-900">Availability</h3>
                  <span className="text-lg text-gray-400">{expandedSections.availability ? '−' : '+'}</span>
                </button>
                {expandedSections.availability && (
                  <div className="pb-4 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">In Stock (123)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={outOfStockOnly}
                        onChange={(e) => setOutOfStockOnly(e.target.checked)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">Out of Stock (45)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Price Range */}
              <div className="border-b border-[#E5E5E5]">
                <button
                  onClick={() => toggleSection('price')}
                  className="w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-900">Price</h3>
                  <span className="text-lg text-gray-400">{expandedSections.price ? '−' : '+'}</span>
                </button>
                {expandedSections.price && (
                  <div className="pb-4 space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-2 uppercase tracking-widest">From</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-2 uppercase tracking-widest">To</label>
                      <input
                        type="number"
                        placeholder="999999"
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="border-b border-[#E5E5E5]">
                <button
                  onClick={() => toggleSection('category')}
                  className="w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-900">Category</h3>
                  <span className="text-lg text-gray-400">{expandedSections.category ? '−' : '+'}</span>
                </button>
                {expandedSections.category && (
                  <div className="pb-4">
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Size */}
              <div className="border-b border-[#E5E5E5]">
                <button
                  onClick={() => toggleSection('size')}
                  className="w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-900">Size</h3>
                  <span className="text-lg text-gray-400">{expandedSections.size ? '−' : '+'}</span>
                </button>
                {expandedSections.size && (
                  <div className="pb-4 space-y-3">
                    {getAvailableSizes().map(([size, count]) => (
                      <label key={size} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSizes.includes(size)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSizes([...selectedSizes, size])
                            } else {
                              setSelectedSizes(selectedSizes.filter(s => s !== size))
                            }
                          }}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 uppercase tracking-wide">{size} ({count})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort By */}
              <div>
                <button
                  onClick={() => toggleSection('sort')}
                  className="w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-900">Sort By</h3>
                  <span className="text-lg text-gray-400">{expandedSections.sort ? '−' : '+'}</span>
                </button>
                {expandedSections.sort && (
                  <div className="pb-4">
                    <select
                      value={`${filters.sort}-${filters.order}`}
                      onChange={(e) => {
                        const [sort, order] = e.target.value.split('-')
                        handleFilterChange('sort', sort)
                        handleFilterChange('order', order)
                      }}
                      className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none"
                    >
                      <option value="createdAt-desc">Featured</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="name-asc">Name: A to Z</option>
                      <option value="name-desc">Name: Z to A</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-[#E5E5E5] p-6 space-y-3">
              <button
                onClick={clearFilters}
                className="w-full px-6 py-3 border border-gray-900 text-gray-900 font-medium uppercase tracking-wide rounded-full hover:bg-gray-50 transition-colors text-sm"
              >
                Clear all
              </button>
              <button
                onClick={() => {
                  applyFilters()
                  setShowFilterDrawer(false)
                }}
                className="w-full px-6 py-3 bg-gray-900 text-white font-medium uppercase tracking-wide rounded-full hover:bg-black transition-colors text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}