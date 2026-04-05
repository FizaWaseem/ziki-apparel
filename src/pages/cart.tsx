import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import Layout from '@/components/Layout'
import { useCart } from '@/contexts/CartContext'

export default function CartPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { items, summary, loading, updateQuantity, removeItem } = useCart()
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  // Allow guests to view cart - removed forced signin
  // Guests can see their items and proceed to checkout

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    setUpdatingItems(prev => new Set(prev).add(itemId))
    
    try {
      const success = await updateQuantity(itemId, newQuantity)
      if (!success) {
        alert('Failed to update quantity')
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      alert('Failed to update quantity')
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId))
    
    try {
      const success = await removeItem(itemId)
      if (!success) {
        alert('Failed to remove item')
      }
    } catch (error) {
      console.error('Error removing item:', error)
      alert('Failed to remove item')
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR'
    }).format(price)
  }

  // Allow guest carts to be shown (authenticated users will have server-side cart, guests have session cart)

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your cart...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!items || items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">Looks like you haven&apos;t added anything to your cart yet.</p>
            <Link
              href="/products"
              className="bg-gray-900 text-white px-8 py-3 rounded-full hover:bg-black transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              {items.map((item) => (
                <div key={item.id} className="p-6 border-b last:border-b-0">
                  <div className="flex items-start space-x-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <Image
                        src={item.product.images[0]?.url || '/placeholder.jpg'}
                        alt={item.product.name}
                        width={80}
                        height={80}
                        className="rounded-md object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.product.slug}`} className="font-semibold text-gray-900 hover:text-blue-600">
                        {item.product.name}
                      </Link>
                      {item.variant && (
                        <div className="text-sm text-gray-600 mt-1">
                          Size: {item.variant.size}
                          {item.variant.color && `, Color: ${item.variant.color}`}
                        </div>
                      )}
                      <div className="text-lg font-semibold text-gray-900 mt-2">
                        {formatPrice(item.variant?.price || item.product.price)}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        disabled={updatingItems.has(item.id) || item.quantity <= 1}
                        className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={updatingItems.has(item.id)}
                        className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={updatingItems.has(item.id)}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({summary?.itemCount} items)</span>
                  <span className="font-semibold">{formatPrice(summary?.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>
                    {summary?.shipping === 0 ? 'FREE' : formatPrice(summary?.shipping || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold">{formatPrice(summary?.tax || 0)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">
                      {formatPrice(summary?.total || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {summary?.shipping === 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    🎉 You qualify for free shipping!
                  </p>
                </div>
              )}

              <Link
                href="/checkout"
                className="w-full mt-6 bg-gray-900 text-white py-3 rounded-full hover:bg-black transition-colors block text-center"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="block w-full mt-3 text-center py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}