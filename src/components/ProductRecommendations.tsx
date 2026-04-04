import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  comparePrice: number | null
  avgRating: number
  category: {
    id: string
    name: string
    slug: string
  } | null
  images: Array<{
    id: string
    url: string
    alt: string | null
  }>
  _count: {
    reviews: number
  }
}

interface ProductRecommendationsProps {
  currentProductId: string
  title?: string
  limit?: number
}

export default function ProductRecommendations({ 
  currentProductId, 
  title = "You might also like",
  limit = 4 
}: ProductRecommendationsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/products/${currentProductId}/related`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.slice(0, limit))
        }
      } catch (error) {
        console.error('Error fetching related products:', error)
      } finally {
        setLoading(false)
      }
    }

    if (currentProductId) {
      fetchRelatedProducts()
    }
  }, [currentProductId, limit])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-sm ${
          index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ★
      </span>
    ))
  }

  if (loading) {
    return (
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(limit)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
              <div className="bg-gray-200 h-48"></div>
              <div className="p-4 space-y-3">
                <div className="bg-gray-200 h-4 rounded"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                <div className="bg-gray-200 h-6 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!products.length) {
    return null
  }

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <Link 
          href="/products" 
          className="text-blue-600 hover:text-blue-500 font-medium"
        >
          View All Products →
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            {/* Product Image */}
            <div className="relative h-48 overflow-hidden">
              <Link href={`/products/${product.slug}`}>
                <Image
                  src={product.images[0]?.url || '/placeholder-product.jpg'}
                  alt={product.images[0]?.alt || product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </Link>
              
              {/* Discount Badge */}
              {product.comparePrice && product.comparePrice > product.price && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  {Math.round((1 - product.price / product.comparePrice) * 100)}% OFF
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4">
              <div className="mb-2">
                {product.category && (
                  <p className="text-xs text-gray-500 mb-1">{product.category.name}</p>
                )}
                <Link 
                  href={`/products/${product.slug}`}
                  className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 text-sm"
                >
                  {product.name}
                </Link>
              </div>

              {/* Rating */}
              {product.avgRating > 0 && (
                <div className="flex items-center mb-2">
                  <div className="flex mr-1">
                    {renderStars(product.avgRating)}
                  </div>
                  <span className="text-xs text-gray-500">
                    ({product._count.reviews})
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  {product.comparePrice && (
                    <span className="text-sm text-gray-500 line-through ml-1">
                      {formatPrice(product.comparePrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}