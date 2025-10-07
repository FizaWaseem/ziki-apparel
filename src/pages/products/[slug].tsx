import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { useCart } from '@/contexts/CartContext'

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
  price: number | null
}

interface Review {
  id: string
  rating: number
  title: string | null
  comment: string | null
  verified: boolean
  createdAt: string
  user: {
    name: string | null
    email: string
  }
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
  reviews: Review[]
  avgRating: number
  _count: {
    reviews: number
  }
}

export default function ProductDetailPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { addToCart: addToCartContext } = useCart()
  const { slug } = router.query
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    if (slug) {
      const fetchProductData = async () => {
        try {
          const response = await fetch(`/api/products/${slug}`)
          if (response.ok) {
            const data = await response.json()
            setProduct(data)
          } else {
            router.push('/404')
          }
        } catch (error) {
          console.error('Error fetching product:', error)
          router.push('/404')
        } finally {
          setLoading(false)
        }
      }
      
      fetchProductData()
    }
  }, [slug, router])

  useEffect(() => {
    if (product && product.variants.length > 0 && !selectedVariant) {
      setSelectedVariant(product.variants[0])
    }
  }, [product, selectedVariant])

  const addToCart = async () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!product || !selectedVariant) return

    setAddingToCart(true)
    try {
      const success = await addToCartContext(product.id, selectedVariant.id, quantity)
      if (success) {
        alert('Product added to cart!')
      } else {
        alert('Failed to add product to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add product to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR'
    }).format(price)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-lg ${
          index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ★
      </span>
    ))
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!product) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
            <Link href="/products" className="text-blue-600 hover:text-blue-500">
              Browse our products
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const currentPrice = selectedVariant?.price || product.price

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
      <nav className="mb-8">
        <Link href="/products" className="text-blue-600 hover:text-blue-500">
          ← Back to Products
        </Link>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <div className="mb-4">
            {product.images.length > 0 ? (
              <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={product.images[selectedImage].url}
                  alt={product.images[selectedImage].alt || product.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No Image Available</span>
              </div>
            )}
          </div>
          
          {/* Image Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                    selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={image.alt || `${product.name} ${index + 1}`}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="mb-4">
            {product.category && (
              <p className="text-sm text-gray-500 mb-2">{product.category.name}</p>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            
            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex mr-2">
                {renderStars(product.avgRating)}
              </div>
              <span className="text-sm text-gray-600">
                ({product._count.reviews} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(currentPrice)}
              </span>
              {product.comparePrice && (
                <span className="text-xl text-gray-500 line-through ml-3">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
            </div>
          </div>

          {/* Variants */}
          {product.variants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    disabled={variant.stock === 0}
                    className={`px-4 py-2 border rounded-md ${
                      selectedVariant?.id === variant.id
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : variant.stock === 0
                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {variant.size}
                    {variant.stock === 0 && ' (Out of Stock)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Quantity</h3>
            <div className="flex items-center">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 border border-gray-300 rounded-l-md hover:bg-gray-50"
              >
                -
              </button>
              <span className="px-4 py-1 border-t border-b border-gray-300 bg-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-1 border border-gray-300 rounded-r-md hover:bg-gray-50"
                disabled={!!(selectedVariant && quantity >= selectedVariant.stock)}
              >
                +
              </button>
            </div>
            {selectedVariant && (
              <p className="text-sm text-gray-500 mt-1">
                {selectedVariant.stock} in stock
              </p>
            )}
          </div>

          {/* Add to Cart */}
          <button
            onClick={addToCart}
            disabled={
              addingToCart || 
              !selectedVariant || 
              selectedVariant.stock === 0 ||
              quantity > selectedVariant.stock
            }
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-4"
          >
            {addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
          </button>

          {/* Description */}
          {product.description && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Customer Reviews ({product._count.reviews})
        </h2>
        
        {product.reviews.length > 0 ? (
          <div className="space-y-6">
            {product.reviews.map(review => (
              <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="flex mr-2">
                        {renderStars(review.rating)}
                      </div>
                      {review.verified && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900">
                      {review.user.name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {review.title && (
                  <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                )}
                {review.comment && (
                  <p className="text-gray-700">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
        )}
      </div>
      </div>
    </Layout>
  )
}