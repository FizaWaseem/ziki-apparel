import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import Layout from '@/components/Layout'
import ProductRecommendations from '@/components/ProductRecommendations'
import { useCart } from '@/contexts/CartContext'

// Color palette for display (same as admin)
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
  sku: string | null
  images: ProductImage[]
  category: Category | null
  variants: ProductVariant[]
  reviews: Review[]
  avgRating: number
  sizeChartImage: string | null
  _count: {
    reviews: number
  }
}

export default function ProductDetailPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { addToCart: addToCartContext, items, summary } = useCart()
  const { slug } = router.query

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showCartSidebar, setShowCartSidebar] = useState(false)

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
    if (product && product.variants.length > 0) {
      // Get unique colors
      const uniqueColors = Array.from(new Set(product.variants.filter(v => v.color).map(v => v.color)));

      // If no color selected and colors exist, select first color
      if (!selectedColor && uniqueColors.length > 0) {
        setSelectedColor(uniqueColors[0]);
      }

      // If color is selected but no variant is selected, select first variant of that color
      if (selectedColor && !selectedVariant) {
        const variantForColor = product.variants.find(v => v.color === selectedColor);
        if (variantForColor) {
          setSelectedVariant(variantForColor);
        }
      }
    }
  }, [product, selectedColor, selectedVariant])

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

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
        setToast({ message: '✓ Product added to cart!', type: 'success' })
        // Show cart sidebar after a brief delay
        setTimeout(() => setShowCartSidebar(true), 500)
      } else {
        setToast({ message: 'Failed to add product to cart', type: 'error' })
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      setToast({ message: 'Failed to add product to cart', type: 'error' })
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
        className={`text-lg ${index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
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
      <div className="min-h-screen flex flex-col">
        {/* Header Navigation */}
        <div className="border-b border-[#E5E5E5] px-6 py-4">
          <nav>
            <Link href="/products" className="text-sm text-gray-600 hover:text-gray-900">
              ← Back to Products
            </Link>
          </nav>
        </div>

        {/* Split Screen Layout */}
        <div className="grid grid-cols-2 flex-1 overflow-hidden">
          {/* LEFT: Scrolling Image Gallery (60%) */}
          <div className="overflow-y-auto bg-white border-r border-[#E5E5E5]">
            <div className="mb-4">
              {product.images.length > 0 ? (
                <div
                  className="relative h-[600px] bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in group"
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setZoomPosition({ x, y });
                  }}
                  onClick={() => setShowFullscreen(true)}
                >
                  <Image
                    src={product.images[selectedImage].url}
                    alt={product.images[selectedImage].alt || product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    priority
                    className={`object-contain transition-transform duration-300 ease-out ${isZoomed ? 'scale-150' : 'scale-100'
                      }`}
                    style={{
                      transformOrigin: isZoomed ? `${zoomPosition.x}% ${zoomPosition.y}%` : 'center center'
                    }}
                  />

                  {/* Zoom Indicator */}
                  {isZoomed && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      🔍 Zoomed
                    </div>
                  )}

                  {/* Zoom Instructions */}
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    Hover to zoom • Move to pan • Click for fullscreen
                  </div>
                </div>
              ) : (
                <div className="h-[600px] bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">No Image Available</span>
                </div>
              )}
            </div>

            {/* View Full Size Button */}
            {product.images.length > 0 && (
              <div className="mb-4 text-center">
                <button
                  onClick={() => setShowFullscreen(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  <span>View Full Size</span>
                </button>
              </div>
            )}

            {/* Image Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-24 h-24 rounded-md overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${selectedImage === index ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || `${product.name} ${index + 1}`}
                      width={96}
                      height={96}
                      className="object-contain w-full h-full transition-transform duration-200 hover:scale-110 bg-white"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info - Right Sticky Panel */}
          <div className="sticky top-0 h-screen overflow-y-auto bg-white px-6 py-8 space-y-4" style={{fontSize: '11px'}}>
            {/* Product Name - Uppercase */}
            <h1 className="text-xl font-bold text-gray-900 uppercase tracking-widest" style={{fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.05em'}}>
              {product.name}
            </h1>

            {/* Price in PKR */}
            <div className="text-lg font-bold text-gray-900">
              {formatPrice(currentPrice)}
            </div>
            {product.comparePrice && (
              <div className="text-sm text-gray-500 line-through">
                {formatPrice(product.comparePrice)}
              </div>
            )}

            {/* Product Description */}
            {product.description && (
              <p className="text-gray-700 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Horizontal Line */}
            <div className="border-t border-[#E5E5E5] my-3"></div>

            {/* Product SKU/Number */}
            {product.sku && (
              <div className="text-gray-600">
                <span className="font-semibold">SKU:</span> {product.sku}
              </div>
            )}

            {/* Size Selection */}
            {product.variants.length > 0 && (
              <div>
                {selectedColor && (() => {
                  const sizesForColor = product.variants.filter(v => v.color === selectedColor);
                  return sizesForColor.length > 0 ? (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 uppercase tracking-wide">Size</h3>
                      <div className="flex flex-wrap gap-2">
                        {sizesForColor.map(variant => (
                          <button
                            key={variant.id}
                            onClick={() => setSelectedVariant(variant)}
                            disabled={variant.stock === 0}
                            className={`px-3 py-1 border rounded text-xs transition-all ${selectedVariant?.id === variant.id
                                ? 'border-black bg-black text-white'
                                : variant.stock === 0
                                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'border-gray-300 hover:border-black'
                              }`}
                          >
                            {variant.size}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Color Selection */}
            {product.variants.length > 0 && (
              <div>
                {(() => {
                  const uniqueColors = Array.from(new Set(product.variants.filter(v => v.color).map(v => v.color)));
                  return uniqueColors.length > 0 ? (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 uppercase tracking-wide">Color</h3>
                      <div className="flex flex-wrap gap-2">
                        {uniqueColors.map(color => {
                          const colorData = COLOR_PALETTE.find(c => c.name === color);
                          const isSelected = selectedColor === color;
                          const isAvailable = product.variants.some(v => v.color === color && v.stock > 0);

                          return (
                            <button
                              key={color}
                              onClick={() => {
                                setSelectedColor(color);
                                setSelectedVariant(null);
                              }}
                              disabled={!isAvailable}
                              className={`px-3 py-1 rounded-full text-xs transition-all border ${isSelected
                                  ? 'border-black bg-black text-white'
                                  : isAvailable
                                    ? 'border-gray-300 bg-white text-gray-900 hover:border-black'
                                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                              {color}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Size Chart Link */}
            <div>
              <a href="#sizechart" className="text-gray-600 underline hover:text-black text-xs">
                Size Chart
              </a>
            </div>

            {/* Quantity & Add to Cart - Inline */}
            <div className="flex gap-2 items-center">
              <div className="flex items-center border border-gray-300 rounded-full">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 hover:bg-gray-50 text-sm"
                >
                  −
                </button>
                <span className="px-3 py-1 text-sm font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 hover:bg-gray-50 text-sm"
                  disabled={!!(selectedVariant && quantity >= selectedVariant.stock)}
                >
                  +
                </button>
              </div>
              <button
                onClick={addToCart}
                disabled={
                  addingToCart ||
                  !selectedVariant ||
                  selectedVariant.stock === 0 ||
                  quantity > selectedVariant.stock
                }
                className="flex-1 px-4 py-3 border border-gray-900 text-gray-900 font-medium text-sm rounded-full hover:bg-gray-50 transition-colors disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>

            {/* Buy Now Button */}
            <button
              onClick={() => {
                if (selectedVariant) {
                  router.push('/checkout');
                }
              }}
              disabled={!selectedVariant || selectedVariant.stock === 0}
              className="w-full px-4 py-3 bg-gray-900 text-white font-medium text-sm rounded-full hover:bg-black transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Buy Now
            </button>

            {/* Color Variation Disclaimer */}
            <div className="border-t border-[#E5E5E5] pt-3 mt-4 text-gray-500 leading-relaxed">
              Actual colour of the product may vary slightly due to photographic lighting sources or your device.
            </div>

            {/* CARE Section */}
            <div className="border-t border-[#E5E5E5] pt-3">
              <h3 className="font-semibold text-gray-900 mb-2 uppercase tracking-wide">Care</h3>
              <ul className="space-y-1 text-gray-700 list-disc list-inside">
                <li>Machine or handwash upto 30°C/86F</li>
                <li>Gentle cycle</li>
                <li>Do not dry in direct sunlight</li>
                <li>Do not bleach</li>
                <li>Do not iron directly on prints/embroidery</li>
              </ul>
            </div>

            {/* Size Chart Section */}
            {product.sizeChartImage && (
              <div className="border-t border-[#E5E5E5] pt-3">
                <h3 id="sizechart" className="font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                  Size Chart
                </h3>
                <div className="relative w-full bg-gray-50 rounded-lg overflow-hidden">
                  <Image
                    src={product.sizeChartImage}
                    alt="Size Chart"
                    width={400}
                    height={400}
                    className="w-full h-auto object-contain"
                    priority={false}
                  />
                </div>
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

      {/* Fullscreen Image Modal */}
      {showFullscreen && product.images.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullscreen(false)}
        >
          <div className="relative max-w-7xl max-h-full">
            {/* Close Button */}
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation Arrows */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(selectedImage > 0 ? selectedImage - 1 : product.images.length - 1);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(selectedImage < product.images.length - 1 ? selectedImage + 1 : 0);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Main Image */}
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              <Image
                src={product.images[selectedImage].url}
                alt={product.images[selectedImage].alt || product.name}
                width={0}
                height={0}
                sizes="100vw"
                className="max-w-[95vw] max-h-[95vh] w-auto h-auto object-contain"
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: 'auto',
                  height: 'auto',
                }}
              />
            </div>

            {/* Image Counter */}
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                {selectedImage + 1} / {product.images.length}
              </div>
            )}

            {/* Instructions */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
              Full Size View • Click outside to close • Use arrows to navigate
            </div>
          </div>
        </div>
      )}

      {/* Product Recommendations */}
      {product && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <ProductRecommendations
            currentProductId={product.id}
            title="You might also like"
            limit={4}
          />
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-4 z-50 ${toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
          }`}>
          <span>
            {toast.type === 'success' ? '✓' : '✕'}
          </span>
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Cart Sidebar */}
      {showCartSidebar && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 z-40 animate-in fade-in"
            onClick={() => setShowCartSidebar(false)}
          />
          
          {/* Sidebar - Professional Minimalist Design */}
          <div className="fixed right-0 top-0 h-full w-full md:w-[420px] bg-white z-50 overflow-y-auto flex flex-col animate-in slide-in-from-right-96">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-5 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-[18px] font-medium text-black" style={{fontFamily: "'Montserrat', sans-serif", letterSpacing: '-0.02em'}}>Cart</h2>
                <p className="text-xs text-gray-500 mt-1">({items?.length || 0} {items?.length === 1 ? 'item' : 'items'})</p>
              </div>
              <button 
                onClick={() => setShowCartSidebar(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart Items Section */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
              {items && items.length > 0 ? (
                items.map((item) => (
                  <div key={item.id} className="pb-6 border-b border-gray-200 last:border-0">
                    {/* Product Image and Details Row */}
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      {item.product.images?.[0] && (
                        <div className="flex-shrink-0">
                          <div className="relative w-24 h-24 bg-gray-100 rounded">
                            <Image
                              src={item.product.images[0].url}
                              alt={item.product.name}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-semibold tracking-widest uppercase text-gray-900 mb-2 leading-tight">
                          {item.product.name}
                        </h3>
                        
                        {/* Variant Info */}
                        {item.variant && (
                          <div className="flex gap-3 mb-3 text-xs text-gray-600">
                            <span>Size: {item.variant.size}</span>
                          </div>
                        )}
                        
                        {/* Price */}
                        <p className="text-sm font-semibold text-gray-900 mb-3">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'PKR'
                          }).format((item.variant?.price || item.product.price) * item.quantity)}
                        </p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-gray-300 rounded-full">
                            <button 
                              className="px-3 py-1 text-gray-600 hover:text-gray-900 text-sm"
                              onClick={() => {
                                // Quantity decrease logic would go here
                              }}
                            >
                              −
                            </button>
                            <span className="px-2 text-sm font-medium text-gray-900">{item.quantity}</span>
                            <button 
                              className="px-3 py-1 text-gray-600 hover:text-gray-900 text-sm"
                              onClick={() => {
                                // Quantity increase logic would go here
                              }}
                            >
                              +
                            </button>
                          </div>
                          <button className="text-xs text-gray-500 hover:text-gray-900 underline">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              )}
            </div>

            {/* Footer Section */}
            {items && items.length > 0 && (
              <div className="border-t border-gray-200 px-6 py-6 space-y-4">
                {/* Total Summary */}
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-gray-600 uppercase tracking-wider">Subtotal</span>
                    <span className="text-sm text-gray-900 font-medium">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PKR' }).format(summary?.subtotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-gray-600 uppercase tracking-wider">Shipping</span>
                    <span className="text-sm text-gray-900 font-medium">
                      {summary?.shipping === 0 ? 'Free' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PKR' }).format(summary?.shipping || 0)}
                    </span>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-gray-900">
                      PKR {Math.round(summary?.total || 0).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Taxes and shipping calculated at checkout</p>
                </div>

                {/* CTA Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCartSidebar(false)}
                    className="flex-1 px-4 py-3 border border-gray-900 text-gray-900 font-medium text-sm rounded-full hover:bg-gray-50 transition-colors"
                  >
                    View Cart
                  </button>
                  <button
                    onClick={() => {
                      setShowCartSidebar(false)
                      router.push('/checkout')
                    }}
                    className="flex-1 px-4 py-3 bg-gray-900 text-white font-medium text-sm rounded-full hover:bg-black transition-colors"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  )
}