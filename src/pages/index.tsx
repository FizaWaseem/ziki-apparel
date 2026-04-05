import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Layout from '@/components/Layout'

interface ProductImage {
  id: string
  url: string
  alt: string | null
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  comparePrice: number | null
  images: ProductImage[]
  category: Category | null
  featured: boolean
}

interface HeroSlide {
  id: string
  type: 'video' | 'image'
  src: string
  poster?: string
  title: string
  subtitle?: string
  ctaText: string
  ctaLink: string
}

// Fallback hero slides (used if database is empty)
const FALLBACK_HERO_SLIDES: HeroSlide[] = [
  {
    id: '1',
    type: 'video',
    src: '/videos/video0.mp4',
    poster: '/images/hero-poster-1.jpg',
    title: 'Premium Trouser Collection',
    subtitle: 'Crafted for the modern lifestyle with uncompromising quality',
    ctaText: 'Shop Now',
    ctaLink: '/products'
  },
  {
    id: '2',
    type: 'video',
    src: '/videos/hero-video-2.mp4',
    poster: '/images/hero-poster-2.jpg',
    title: 'Sustainable Fashion',
    subtitle: 'Eco-friendly denim for a better tomorrow',
    ctaText: 'Learn More',
    ctaLink: '/products?sustainable=true'
  },
  {
    id: '3',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200',
    title: 'Raw Selvedge Denim',
    subtitle: 'Authentic Japanese denim with timeless appeal',
    ctaText: 'Explore Raw Denim',
    ctaLink: '/products?category=raw-denim'
  },
  {
    id: '4',
    type: 'image',
    src: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200',
    title: 'Women\'s Skinny Fit',
    subtitle: 'Perfect fit meets contemporary style',
    ctaText: 'Shop Women\'s',
    ctaLink: '/products?category=womens-jeans'
  }
]

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(FALLBACK_HERO_SLIDES)
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    fetchHeroSlides()
    fetchFeaturedProducts()
  }, [])

  // Fetch hero slides from database
  const fetchHeroSlides = async () => {
    try {
      const response = await fetch('/api/hero')
      const data = await response.json()
      // Use fetched slides if available, otherwise use fallback
      if (data.length > 0) {
        setHeroSlides(data)
      }
    } catch (error) {
      console.error('Error fetching hero slides:', error)
      // Keep using fallback slides on error
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 8000) // Change slide every 8 seconds

    return () => clearInterval(interval)
  }, [heroSlides.length])

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/products?featured=true&limit=6')
      const data = await response.json()
      setFeaturedProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching featured products:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR'
    }).format(price)
  }

  return (
    <Layout>
      {/* Hero Section with Video Slider */}
      <section className="relative h-[100vh] overflow-hidden">
        {/* Slides Container */}
        <div className="relative w-full h-full">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
            >
              {slide.type === 'video' ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={slide.poster} // Add poster image
                  className="w-full h-full object-cover"
                  onError={(e) => console.error(`Video error: ${slide.src}`, e)}
                >
                  <source src={slide.src} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url('${slide.src}')` }}
                />
              )}

              {/* Overlay */}
              <div className="absolute inset-0  bg-opacity-40" />

              {/* Content */}
              <div className="absolute inset-0 flex items-center justify-center text-white z-10">
                <div className="text-center max-w-4xl px-4">
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
                    {slide.title}
                  </h1>
                  <p className="text-lg md:text-xl lg:text-2xl mb-8 max-w-3xl mx-auto animate-fade-in-delayed">
                    {slide.subtitle}
                  </p>
                  <Link
                    href={slide.ctaLink}
                    className="inline-block bg-white text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors animate-fade-in-delayed-2"
                  >
                    {slide.ctaText}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all z-20"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all z-20"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${index === currentSlide
                  ? 'bg-white scale-110'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-8 right-8 text-white animate-bounce z-20">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our most popular denim pieces, loved by customers worldwide
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-gray-200 animate-pulse rounded-lg h-96"></div>
              ))}
            </div>
          ) : !featuredProducts || featuredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Featured Products</h3>
              <p className="text-gray-600">Coming soon new articles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map(product => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="relative h-64">
                      {product.images.length > 0 ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.images[0].alt || product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      )}
                      {product.comparePrice && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
                          Sale
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-lg mb-2 text-gray-900">
                        {product.name}
                      </h3>
                      {product.category && (
                        <p className="text-sm text-gray-500 mb-2">
                          {product.category.name}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-gray-900">
                            {formatPrice(product.price)}
                          </span>
                          {product.comparePrice && (
                            <span className="text-sm text-gray-500 line-through ml-2">
                              {formatPrice(product.comparePrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-block bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link href="/products?category=mens-jeans">
              <div className="relative h-64 bg-gray-900 rounded-lg overflow-hidden group cursor-pointer">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105"
                  style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1542272604-787c3835535d?w=800')"
                  }}
                ></div>
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-center text-white">
                    <h3 className="text-2xl font-bold mb-2">Men&apos;s Jeans</h3>
                    <p className="text-lg">Classic & Modern Styles</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/products?category=womens-jeans">
              <div className="relative h-64 bg-gray-900 rounded-lg overflow-hidden group cursor-pointer">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105"
                  style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800')"
                  }}
                ></div>
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-center text-white">
                    <h3 className="text-2xl font-bold mb-2">Women&apos;s Jeans</h3>
                    <p className="text-lg">Trendy & Comfortable</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular This Week
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover what&apos;s trending with our most loved products
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.slice(0, 3).map((product) => (
              <div key={`popular-${product.id}`} className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                <div className="relative h-64 overflow-hidden">
                  <Link href={`/products/${product.slug}`}>
                    <Image
                      src={product.images[0]?.url || '/placeholder-product.jpg'}
                      alt={product.images[0]?.alt || product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </Link>

                  {/* Popular Badge */}
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                    🔥 Popular
                  </div>

                  {product.comparePrice && product.comparePrice > product.price && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      {Math.round((1 - product.price / product.comparePrice) * 100)}% OFF
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="mb-3">
                    {product.category && (
                      <p className="text-sm text-gray-500 mb-1">{product.category.name}</p>
                    )}
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {product.name}
                    </Link>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                      {product.comparePrice && (
                        <span className="text-lg text-gray-500 line-through ml-2">
                          {formatPrice(product.comparePrice)}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/products/${product.slug}`}
                      className="bg-gray-900 text-white px-4 py-3 rounded-full font-semibold hover:bg-black transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/products"
              className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
              <p className="text-gray-600">
                Made with the finest materials and attention to detail for lasting comfort and style.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Free Shipping</h3>
              <p className="text-gray-600">
                Enjoy free shipping on all orders over $100. Fast and reliable delivery worldwide.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Returns</h3>
              <p className="text-gray-600">
                Not satisfied? Return your purchase within 30 days for a full refund.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}