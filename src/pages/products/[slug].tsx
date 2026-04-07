import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import Layout from '@/components/Layout'
import OptimizedImage from '@/components/OptimizedImage'
import FormattedDescription from '@/components/FormattedDescription'
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
  const [cartSummary, setCartSummary] = useState<{ subtotal: number; tax: number; shipping: number; total: number } | null>(null)

  // Calculate cart summary when items change (for guests)
  useEffect(() => {
    if (items && items.length > 0) {
      const subtotal = items.reduce((sum, item) => {
        const itemPrice = item.variant?.price || item.product?.price || item.price || 0
        return sum + (itemPrice * item.quantity)
      }, 0)
      const tax = subtotal * 0.17
      const shipping = subtotal > 5000 ? 0 : 300
      setCartSummary({
        subtotal,
        tax,
        shipping,
        total: subtotal + tax + shipping
      })
    } else {
      setCartSummary(null)
    }
  }, [items])

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
    if (!product || !selectedVariant) return

    setAddingToCart(true)
    try {
      // Both authenticated and guest users can add to cart
      // Pass productSlug for guests to fetch product details
      const success = await addToCartContext(product.id, selectedVariant.id, quantity, product.slug)
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
      <>
        <Head>
          <title>Ziki Apparel Premium Denim</title>
          <meta name="description" content="Shop premium denim at Ziki Apparel" />
          <meta name="robots" content="noindex" />
        </Head>
        <Layout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </Layout>
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Head>
          <title>Product not found - Ziki Apparel</title>
          <meta name="description" content="The product you're looking for could not be found" />
          <meta name="robots" content="noindex" />
        </Head>
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
      </>
    )
  }

  const currentPrice = selectedVariant?.price || product.price

  const salePercentage = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  const metaDescription = product.description
    ? product.description.substring(0, 160)
    : `Shop ${product.name} at Ziki Apparel. Premium denim with quality craftsmanship.`

  return (
    <>
      <Head>
        <title>{product.name} - Ziki Apparel Premium Denim</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={`${product.name}, denim, ${product.category?.name || 'apparel'}, Ziki Apparel`} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={product.images[0]?.url} />
      </Head>
      <Layout>
        <div className="min-h-screen flex flex-col bg-white">
          {/* Header Navigation */}
          <div className="border-b border-[#E5E5E5] px-4 md:px-6 py-3 md:py-4 sticky top-0 bg-white z-10">
            <nav>
              <Link href="/products" className="text-xs md:text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                <span>←</span> Back to Products
              </Link>
            </nav>
          </div>

          {/* Responsive Layout: Mobile (flex-col) → Landscape (grid-cols-1.5) → Desktop (grid-cols-2) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">

            {/* LEFT: Image Gallery - Mobile Full Width, Landscape 40%, Desktop 50% */}
            <div className="overflow-y-auto order-1 lg:order-1 bg-white lg:border-r border-[#E5E5E5]">
              <div className="p-3 md:p-6 bg-white">
                {/* Main Product Image */}
                {product.images.length > 0 ? (
                  <div
                    className="relative w-full aspect-square md:aspect-auto rounded-lg overflow-hidden cursor-zoom-in group bg-gray-100 mb-4"
                    style={{ height: 'min(90vw, 500px)' }}
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
                    <OptimizedImage
                      src={product.images[selectedImage].url}
                      alt={product.images[selectedImage].alt || product.name}
                      fill
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

                    {/* Zoom Instructions - Hidden on Mobile */}
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                      Hover to zoom • Move to pan • Click for fullscreen
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-gray-200 flex items-center justify-center mb-4">
                    <span className="text-gray-400">No Image Available</span>
                  </div>
                )}

                {/* View Full Size Button - Mobile Friendly */}
                {product.images.length > 0 && (
                  <div className="mb-4 text-center">
                    <button
                      onClick={() => setShowFullscreen(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-xs md:text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                      <span>View Full Size</span>
                    </button>
                  </div>
                )}

                {/* Image Thumbnails - Horizontal Scroll */}
                {product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 md:-mx-0 md:mx-0 px-3 md:px-0 md:gap-3">
                    {product.images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-16 h-16 md:w-24 md:h-24 rounded-md overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${selectedImage === index ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <OptimizedImage
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
            </div>

            {/* RIGHT: Product Info Panel */}
            <div className="order-2 lg:order-2 overflow-y-auto bg-white">
              <div className="p-4 md:p-6 lg:p-8 space-y-3 md:space-y-4">
                {/* Product Name */}
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 uppercase tracking-widest" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.05em' }}>
                  {product.name}
                </h1>

                {/* Price */}
                <div>
                  <div className="text-base md:text-lg font-bold text-gray-900">
                    {formatPrice(currentPrice)}
                  </div>
                  {product.comparePrice && (
                    <div className="text-xs md:text-sm text-gray-500 line-through">
                      {formatPrice(product.comparePrice)}
                    </div>
                  )}
                  {salePercentage > 0 && (
                    <div className="text-xs md:text-sm font-semibold text-red-600 mt-1">
                      Save {salePercentage}%
                    </div>
                  )}
                </div>

                {/* Product Description */}
                {product.description && (
                  <FormattedDescription
                    text={product.description}
                    className="text-xs md:text-sm text-gray-700"
                  />
                )}

                {/* Divider */}
                <div className="border-t border-[#E5E5E5]"></div>

                {/* SKU */}
                {product.sku && (
                  <div className="text-xs md:text-sm text-gray-600">
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
                          <h3 className="font-semibold text-gray-900 mb-2 uppercase tracking-wide text-xs md:text-sm">Size</h3>
                          <div className="flex flex-wrap gap-2">
                            {sizesForColor.map(variant => (
                              <button
                                key={variant.id}
                                onClick={() => setSelectedVariant(variant)}
                                disabled={variant.stock === 0}
                                className={`px-2 py-1.5 md:px-3 md:py-2 border rounded text-xs transition-all ${selectedVariant?.id === variant.id
                                  ? 'border-black bg-black text-white'
                                  : variant.stock === 0
                                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'border-gray-300 hover:border-black'
                                  }`}
                              >
                                {variant.size}
                                {variant.stock === 0 && <span className="text-xs ml-1">OOS</span>}
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
                          <h3 className="font-semibold text-gray-900 mb-2 uppercase tracking-wide text-xs md:text-sm">Color</h3>
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
                                  className={`px-2 py-1.5 md:px-3 md:py-2 rounded-full text-xs transition-all border ${isSelected
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
                {product.sizeChartImage && (
                  <div>
                    <a href="#sizechart" className="text-xs md:text-sm text-gray-600 underline hover:text-black">
                      📏 Size Chart
                    </a>
                  </div>
                )}

                {/* Quantity & Add to Cart - Mobile Optimized */}
                <div className="space-y-2 pt-2">
                  <div className="flex gap-2 items-center">
                    <div className="flex items-center border border-gray-300 rounded-full flex-shrink-0">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-2 md:px-3 py-1.5 md:py-2 hover:bg-gray-50 text-sm font-medium"
                      >
                        −
                      </button>
                      <span className="px-2 md:px-3 py-1.5 md:py-2 text-sm font-semibold min-w-[2rem] text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-2 md:px-3 py-1.5 md:py-2 hover:bg-gray-50 text-sm font-medium"
                        disabled={!!(selectedVariant && quantity >= selectedVariant.stock)}
                      >
                        +
                      </button>
                    </div>
                    {selectedVariant && selectedVariant.stock > 0 && (
                      <span className="text-xs text-gray-500">{selectedVariant.stock} in stock</span>
                    )}
                  </div>

                  {/* Add to Cart Button - Full Width on Mobile */}
                  <button
                    onClick={addToCart}
                    disabled={
                      addingToCart ||
                      !selectedVariant ||
                      selectedVariant.stock === 0 ||
                      quantity > selectedVariant.stock
                    }
                    className="w-full px-4 py-3 border border-gray-900 text-gray-900 font-medium text-sm rounded-full hover:bg-gray-50 transition-colors disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed active:bg-gray-100"
                  >
                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                  </button>

                  {/* Buy Now Button */}
                  <button
                    onClick={() => {
                      if (selectedVariant) {
                        if (session?.user?.id) {
                          setAddingToCart(true)
                          addToCartContext(product.id, selectedVariant.id, quantity, product.slug).then(success => {
                            if (success) {
                              router.push('/checkout')
                            } else {
                              setToast({ message: 'Error adding to cart', type: 'error' })
                              setAddingToCart(false)
                            }
                          }).catch(error => {
                            console.error('Error adding to cart:', error)
                            setToast({ message: 'Error adding to cart', type: 'error' })
                            setAddingToCart(false)
                          })
                        } else {
                          router.push({
                            pathname: '/checkout',
                            query: {
                              productSlug: product.slug,
                              productId: product.id,
                              variantId: selectedVariant.id,
                              quantity: quantity
                            }
                          })
                        }
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-900 text-white font-medium text-sm rounded-full hover:bg-black transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed active:bg-gray-800"
                  >
                    Buy Now
                  </button>
                </div>

                {/* Reviews Summary - Mobile Friendly */}
                {product.reviews && product.reviews.length > 0 && (
                  <div className="pt-3 border-t border-[#E5E5E5]">
                    <div className="text-xs md:text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-0.5">
                          {renderStars(product.avgRating)}
                        </div>
                        <span className="font-semibold">({product._count?.reviews || 0})</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Toast Notification */}
                {toast && (
                  <div className={`fixed bottom-4 left-4 right-4 md:bottom-6 md:right-6 p-3 md:p-4 rounded-lg text-white text-sm ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                    {toast.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Size Chart - Below Product (Mobile Friendly) */}
        {product.sizeChartImage && (
          <div id="sizechart" className="bg-gray-50 border-t border-[#E5E5E5] p-4 md:p-8">
            <h2 className="text-lg md:text-2xl font-bold mb-4">Size Chart</h2>
            <div className="relative w-full h-auto">
              <OptimizedImage
                src={product.sizeChartImage}
                alt="Size Chart"
                width={1000}
                height={600}
                className="w-full h-auto"
              />
            </div>
          </div>
        )}
        {/* Reviews Section */}
        < div className="mt-12" >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Customer Reviews ({product._count.reviews})
          </h2>

          {
            product.reviews.length > 0 ? (
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
            )
          }
        </div >

        {/* Product Recommendations */}
        <ProductRecommendations currentProductId={product.id} />
      </Layout>
      {/* Toast Notification */}
      {
        toast && (
          <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-4 z-50 ${toast.type === 'success'
            ? 'bg-green-300 text-white'
            : 'bg-red-400 text-white'
            }`}>
            <span>
              {toast.type === 'success' ? '✓' : '✕'}
            </span>
            <span className="font-medium">{toast.message}</span>
          </div>
        )
      }

      {/* Cart Sidebar */}
      {
        showCartSidebar && (
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
                  <h2 className="text-[18px] font-medium text-black" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '-0.02em' }}>Cart</h2>
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
                              <OptimizedImage
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
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PKR' }).format(cartSummary?.subtotal || summary?.subtotal || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-gray-600 uppercase tracking-wider">Shipping</span>
                      <span className="text-sm text-gray-900 font-medium">
                        {(cartSummary?.shipping || summary?.shipping) === 0 ? 'Free' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PKR' }).format(cartSummary?.shipping || summary?.shipping || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-base font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-gray-900">
                        PKR {Math.round(cartSummary?.total || summary?.total || 0).toLocaleString()}
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

    </>
  )
}


export async function getServerSideProps({ params }: { params: { slug: string } }) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    return {
      props: {}
    }
  } catch (error) {
    return {
      notFound: true
    }
  }
}