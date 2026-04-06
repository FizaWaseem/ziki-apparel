import { useState, useEffect } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import Layout from '@/components/Layout'
import OptimizedImage from '@/components/OptimizedImage'

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

interface Category {
  id: string
  name: string
  slug: string
  image: string | null
  description: string | null
  _count: {
    products: number
  }
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

// Default categories with fallback images
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'default-1',
    name: "Men's Jeans",
    slug: 'mens-jeans',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
    description: null,
    _count: { products: 0 }
  },
  {
    id: 'default-2',
    name: "Women's Jeans",
    slug: 'womens-jeans',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',
    description: null,
    _count: { products: 0 }
  },
]

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
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    fetchHeroSlides()
    fetchFeaturedProducts()
    fetchCategories()
  }, [])

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (Array.isArray(data) && data.length > 0) {
        // Take first 2 categories, or use defaults if less than 2
        const categoriesToShow = data.slice(0, 2)
        if (categoriesToShow.length === 2) {
          setCategories(categoriesToShow)
        } else {
          // Fallback: mix fetched with defaults
          setCategories([categoriesToShow[0], DEFAULT_CATEGORIES[1]])
        }
      } else {
        setCategories(DEFAULT_CATEGORIES)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories(DEFAULT_CATEGORIES)
    } finally {
      setCategoriesLoading(false)
    }
  }

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
    <>
      <Head>
        <title>Ziki Apparel | Premium Denim Jeans at Wholesale Prices</title>
        <meta name="description" content="Shop Ziki Apparel for premium quality denim at original prices with no extra charges. High-quality baggy and cargo jeans at affordable prices nationwide." />
        <meta name="keywords" content="denim jeans Pakistan, Ziki Apparel, baggy jeans, cargo denim, wholesale jeans, premium clothing Pakistan" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Ziki Apparel | Premium Denim Jeans & Streetwear" />
        <meta property="og:description" content="Get premium quality denim at original prices. No hidden charges. Shop high-quality jeans with nationwide shipping in Pakistan." />
        <meta property="og:image" content="https://zikiapparel.vercel.app/ziki-apparel-logo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </Head>
      <Layout>
        {/* Hero Section with Video Slider */}
        <section className="relative w-full h-screen md:h-[100vh] overflow-hidden">
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
                    key={`video-${slide.id}`}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={slide.poster}
                    className="w-full h-full object-cover"
                    onError={(e) => console.error(`Video error: ${slide.src}`, e)}
                    style={{ display: index === currentSlide ? 'block' : 'none' }}
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
                <div className="absolute inset-0 bg-black bg-opacity-40" />

                {/* Content */}
                <div className="absolute inset-0 flex items-center justify-center text-white z-10">
                  <div className="text-center max-w-4xl px-4 sm:px-6">
                    <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-3 sm:mb-6 animate-fade-in leading-tight">
                      {slide.title}
                    </h1>
                    <p className="text-sm sm:text-lg md:text-xl lg:text-2xl mb-4 sm:mb-8 max-w-3xl mx-auto animate-fade-in-delayed">
                      {slide.subtitle}
                    </p>
                    <Link
                      href={slide.ctaLink}
                      className="inline-block bg-white text-gray-900 px-4 sm:px-8 py-2 sm:py-4 rounded-lg text-sm sm:text-lg font-semibold hover:bg-gray-100 transition-colors animate-fade-in-delayed-2"
                    >
                      {slide.ctaText}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows - Hidden on very small screens */}
          <button
            onClick={prevSlide}
            className="hidden sm:block absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-20 hover:bg-opacity-30 text-white p-2 sm:p-3 rounded-full transition-all z-20"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="hidden sm:block absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-20 hover:bg-opacity-30 text-white p-2 sm:p-3 rounded-full transition-all z-20"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3 z-20">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`rounded-full transition-all ${index === currentSlide
                  ? 'bg-white scale-110 w-3 h-3 sm:w-3 sm:h-3'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75 w-2 h-2 sm:w-3 sm:h-3'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Scroll Down Indicator - Hidden on mobile */}
          <div className="hidden md:block absolute bottom-8 right-8 text-white animate-bounce z-20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </section>

        {/* Why Ziki Apparel Section */}
        <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 sm:mb-8">Why Choose Ziki Apparel?</h2>

              <div className="space-y-4 sm:space-y-6">
                <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed">
                  At Ziki Apparel, we stand out by offering <span className="font-semibold text-blue-600">original pricing without hidden charges.</span>
                </p>

                <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed">
                  Our mission is to provide <span className="font-semibold text-blue-600">premium quality products at the most affordable prices</span> for our clients.
                </p>
              </div>

              <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                  <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">✓</div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">No Hidden Charges</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">What you see is what you pay. Transparent pricing always.</p>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                  <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">★</div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Premium Quality</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">High-quality denim crafted with attention to detail.</p>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                  <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">💰</div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Best Prices</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">Affordable pricing without compromising on quality.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-8 sm:py-12 md:py-16 bg-white">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
                Featured Products
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
                Explore our most popular denim pieces, loved by customers worldwide
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-gray-200 animate-pulse rounded-lg h-64 sm:h-72 md:h-96"></div>
                ))}
              </div>
            ) : !featuredProducts || featuredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Featured Products</h3>
                <p className="text-gray-600 text-sm sm:text-base">Coming soon new articles</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                {featuredProducts.map(product => (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="relative h-64 sm:h-72 md:h-80 w-full bg-gray-100">
                        {product.images.length > 0 ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">No Image</span>
                          </div>
                        )}
                        {product.comparePrice && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs sm:text-sm font-semibold">
                            Sale
                          </div>
                        )}
                      </div>
                      <div className="p-3 sm:p-4 md:p-6">
                        <h3 className="font-semibold text-base sm:text-lg md:text-lg mb-1 sm:mb-2 text-gray-900 line-clamp-2">
                          {product.name}
                        </h3>
                        {product.category && (
                          <p className="text-xs sm:text-sm text-gray-500 mb-2">
                            {product.category.name}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-base sm:text-lg md:text-lg font-bold text-gray-900">
                              {formatPrice(product.price)}
                            </span>
                            {product.comparePrice && (
                              <span className="text-xs sm:text-sm text-gray-500 line-through ml-2">
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

            <div className="text-center mt-8 sm:mt-10 md:mt-12">
              <Link
                href="/products"
                className="inline-block bg-gray-900 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg text-sm sm:text-base hover:bg-gray-800 transition-colors"
              >
                View All Products
              </Link>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-8 sm:py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Shop by Category
              </h2>
            </div>

            {categoriesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                {[...Array(2)].map((_, index) => (
                  <div key={index} className="relative h-48 sm:h-56 md:h-64 bg-gray-300 animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                {categories.map((category) => (
                  <Link key={category.id} href={`/products?category=${category.slug}`}>
                    <div className="relative h-48 sm:h-56 md:h-64 bg-gray-900 rounded-lg overflow-hidden group cursor-pointer">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105"
                        style={{
                          backgroundImage: category.image ? `url('${category.image}')` : 'url(https://images.unsplash.com/photo-1542272604-787c3835535d?w=800)'
                        }}
                      ></div>
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <div className="text-center text-white">
                          <h3 className="text-xl sm:text-2xl md:text-2xl font-bold mb-2">{category.name}</h3>
                          {category._count?.products > 0 && (
                            <p className="text-base sm:text-lg">{category._count.products} products</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Popular Products */}
        <section className="py-8 sm:py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
                Popular This Week
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
                Discover what&apos;s trending with our most loved products
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {featuredProducts.slice(0, 3).map((product) => (
                <div key={`popular-${product.id}`} className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="relative h-56 sm:h-64 md:h-72 w-full overflow-hidden bg-gray-100">
                    <Link href={`/products/${product.slug}`}>
                      <OptimizedImage
                        src={product.images[0]?.url || '/placeholder-product.jpg'}
                        alt={product.images[0]?.alt || product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </Link>

                    {/* Popular Badge */}
                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded font-semibold">
                      🔥 Popular
                    </div>

                    {product.comparePrice && product.comparePrice > product.price && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded font-semibold">
                        {Math.round((1 - product.price / product.comparePrice) * 100)}% OFF
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 md:p-6">
                    <div className="mb-2 sm:mb-3">
                      {product.category && (
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">{product.category.name}</p>
                      )}
                      <Link
                        href={`/products/${product.slug}`}
                        className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
                      >
                        {product.name}
                      </Link>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                        {product.comparePrice && (
                          <span className="text-xs sm:text-sm text-gray-500 line-through ml-2">
                            {formatPrice(product.comparePrice)}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/products/${product.slug}`}
                        className="bg-gray-900 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold hover:bg-black transition-colors whitespace-nowrap"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8 sm:mt-10 md:mt-12">
              <Link
                href="/products"
                className="bg-gray-200 text-gray-800 px-6 sm:px-8 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-300 transition-colors inline-block"
              >
                View All Products
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-8 sm:py-12 md:py-16 bg-white">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Premium Quality</h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Made with the finest materials and attention to detail for lasting comfort and style.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z"></path>
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Free Shipping</h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Enjoy free shipping on all orders over 5000. Fast and reliable delivery nationwide.
                </p>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </>
  )
}