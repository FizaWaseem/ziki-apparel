import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import Layout from '@/components/Layout'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    slug: string
    images: Array<{
      url: string
      alt: string | null
    }>
  }
  variant: {
    id: string
    size: string
    color: string | null
  } | null
}

interface Order {
  id: string
  status: string
  total: number
  subtotal: number
  tax: number
  shipping: number
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  shippingAddress: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  items: OrderItem[]
}

export default function OrderPage() {
  const router = useRouter()
  const { orderId, success } = router.query
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        try {
          const response = await fetch(`/api/orders/${orderId}`)
          if (response.ok) {
            const orderData = await response.json()
            setOrder(orderData)
          } else {
            router.push('/orders')
          }
        } catch (error) {
          console.error('Error fetching order:', error)
          router.push('/orders')
        } finally {
          setLoading(false)
        }
      }

      fetchOrder()
    }
  }, [orderId, router])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800'
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Order not found</h1>
            <Link href="/orders" className="text-blue-600 hover:text-blue-800">
              View all orders
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <>
      <Head>
        <title>Order Details - Ziki Apparel</title>
        <meta name="description" content="View your Ziki Apparel order details, including status, items, and shipping information." />
        <meta name="robots" content="noindex" />
      </Head>
      <Layout>
        <div className="bg-gray-50 min-h-screen py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* Success Message */}
              {success === 'true' && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">🎉</div>
                    <div>
                      <h3 className="font-bold">Order Placed Successfully!</h3>
                      <p>Thank you for your order. We&apos;ll send you updates via email.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Order #{order.id.slice(-8).toUpperCase()}</h1>
                    <p className="text-gray-600">Placed on {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Items */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-4">Order Items</h2>
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <Image
                            src={item.product.images[0]?.url || '/placeholder.jpg'}
                            alt={item.product.name}
                            width={80}
                            height={80}
                            className="rounded object-cover"
                          />
                          <div className="flex-1">
                            <Link
                              href={`/products/${item.product.slug}`}
                              className="font-semibold text-gray-900 hover:text-blue-600"
                            >
                              {item.product.name}
                            </Link>
                            {item.variant && (
                              <div className="text-sm text-gray-600 mt-1">
                                Size: {item.variant.size}
                                {item.variant.color && `, Color: ${item.variant.color}`}
                              </div>
                            )}
                            <div className="text-sm text-gray-600">
                              Quantity: {item.quantity}
                            </div>
                          </div>
                          <div className="font-semibold">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Order Summary & Details */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Order Summary */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span>{formatPrice(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span>{order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax</span>
                        <span>{formatPrice(order.tax)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-blue-600">{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
                    <div className="text-gray-600 space-y-1">
                      <p className="font-medium text-gray-900">
                        {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                      </p>
                      <p>{order.shippingAddress.address}</p>
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                      <p className="pt-2">
                        <span className="text-gray-500">Phone:</span> {order.shippingAddress.phone}
                      </p>
                      <p>
                        <span className="text-gray-500">Email:</span> {order.shippingAddress.email}
                      </p>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method</span>
                        <span className="capitalize">
                          {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit Card'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                            order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
                    <div className="space-y-3">
                      <Link
                        href="/contact"
                        className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Contact Support
                      </Link>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}