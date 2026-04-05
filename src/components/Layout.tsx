import { ReactNode, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useCart } from '@/contexts/CartContext'
import SearchWithAutocomplete from './SearchWithAutocomplete'
import WhatsAppButton from './WhatsAppButton'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { summary, items } = useCart()
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Get item count for both authenticated and guest users
  const itemCount = summary?.itemCount || items?.length || 0

  const handleSignOut = async () => {
    setShowProfileMenu(false)
    await signOut({ redirect: false })
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/ziki-apparel-logo.png"
                alt="Ziki Apparel Logo"
                width={50}
                height={50}
                className="object-contain"
              />
              <span className="text-2xl font-bold text-gray-900 hidden sm:block">Ziki Apparel</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link href="/products" className="text-gray-600 hover:text-gray-900">
                Products
              </Link>
            </nav>

            {/* Search */}
            <div className="flex-1 max-w-lg mx-8 hidden lg:block">
              <SearchWithAutocomplete placeholder="Search products..." />
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Cart Icon - Show for both authenticated and guest users */}
              <Link href="/cart" className="relative text-gray-600 hover:text-gray-900">
                Cart
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>

              {session ? (
                <>
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    >
                      {session.user?.name || 'Account'}
                      <span className={`transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                    {showProfileMenu && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-[98]"
                          onClick={() => setShowProfileMenu(false)}
                        />
                        {/* Dropdown Menu */}
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-[99]">
                          <div className="py-1">
                            <Link
                              href="/orders/tracking"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setShowProfileMenu(false)}
                            >
                              Order Tracking
                            </Link>
                            <Link
                              href="/orders"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setShowProfileMenu(false)}
                            >
                              My Orders
                            </Link>
                            {session.user.role === 'admin' && (
                              <Link
                                href="/admin/orders"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => setShowProfileMenu(false)}
                              >
                                Admin Orders
                              </Link>
                            )}
                            <button
                              onClick={handleSignOut}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 border-t border-gray-200 font-medium"
                            >
                              Logout
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="text-gray-600 hover:text-gray-900">
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-black transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Ziki Apparel</h3>
              <p className="text-gray-300">
                Premium denim jeans for the modern lifestyle. Quality craftsmanship meets contemporary style.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/products?category=mens-jeans" className="hover:text-white">Men&apos;s Jeans</Link></li>
                <li><Link href="/products?category=womens-jeans" className="hover:text-white">Women&apos;s Jeans</Link></li>
                <li><Link href="/products" className="hover:text-white">All Products</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Customer Service</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Size Guide</a></li>
                <li><a href="#" className="hover:text-white">Shipping Info</a></li>
                <li><a href="#" className="hover:text-white">Returns</a></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="https://www.instagram.com/zikiapparel12/" target="_blank" className="hover:text-white">Instagram</a></li>
                <li><a href="https://www.facebook.com/p/Ziki-Apparel-61562549624637/" target="_blank" className="hover:text-white">Facebook</a></li>
                <li><a href="https://www.tiktok.com/@ziki.apparel?is_from_webapp=1&sender_device=pc" target="_blank" className="hover:text-white">Tiktok</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2025 Ziki Apparel. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Button */}
      <WhatsAppButton />
    </div>
  )
}