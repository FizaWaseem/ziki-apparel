import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Layout from '@/components/Layout'
import OptimizedImage from '@/components/OptimizedImage'
import LoadingButton from '@/components/LoadingButton'
import { useCart } from '@/contexts/CartContext'

interface ShippingAddress {
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

interface PaymentMethod {
  type: 'cod' | 'jazzcash' | 'bank'
  // Jazz Cash fields
  jazzCashTransactionId?: string
  jazzCashScreenshot?: File | null
  // Bank Account fields
  bankAccountNumber?: string
  bankAccountName?: string
  bankName?: string
}

interface CartSummary {
  subtotal: number
  tax: number
  shipping: number
  total: number
  itemCount: number
}

export default function CheckoutPage() {
  return (
    <>
      <Head>
        <title>Secure Checkout - Ziki Apparel</title>
        <meta name="description" content="Complete your purchase at Ziki Apparel. Secure checkout with multiple payment options including card, Jazz Cash, and bank transfer." />
        <meta name="robots" content="noindex" />
      </Head>
      <CheckoutPageContent />
    </>
  )
}

function CheckoutPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { items, summary, loading, addToCart: addToCartContext, clearCart } = useCart()
  const formContainerRef = useRef<HTMLDivElement>(null)

  const [step, setStep] = useState(1) // 1: Shipping, 2: Payment, 3: Review
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: session?.user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Pakistan'
  })

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    type: 'cod'
  })

  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [itemsProcessed, setItemsProcessed] = useState(false)
  const [displaySummary, setDisplaySummary] = useState<CartSummary | null>(null)

  // Calculate display summary when items change
  useEffect(() => {
    if (items && items.length > 0) {
      console.log('Items for summary calculation:', items)
      const subtotal = items.reduce((sum, item) => {
        const itemPrice = item.variant?.price || item.product?.price || item.price || 0
        console.log(`Item ${item.productId}: variant.price=${item.variant?.price}, product.price=${item.product?.price}, item.price=${item.price}, calculated=${itemPrice}`)
        return sum + (itemPrice * item.quantity)
      }, 0)
      const tax = subtotal * 0.17 // 17% tax
      const shipping = subtotal > 5000 ? 0 : 300 // Free shipping over 5000
      console.log('Summary calculated - subtotal:', subtotal, 'tax:', tax, 'shipping:', shipping)
      setDisplaySummary({
        subtotal,
        tax,
        shipping,
        total: subtotal + tax + shipping,
        itemCount: items.length
      })
    } else if (summary) {
      setDisplaySummary(summary)
    }
  }, [items, summary])

  // Handle "Buy Now" product parameters for guests
  useEffect(() => {
    const processProductParams = async () => {
      if (router.isReady && !itemsProcessed) {
        const { productId, productSlug, variantId, quantity } = router.query

        if (productId && variantId && !loading) {
          // Guest "Buy Now" - add product to cart
          const qty = parseInt(quantity as string) || 1
          await addToCartContext(productId as string, variantId as string, qty, productSlug as string)

          // Clear the query params
          router.replace('/checkout', undefined, { shallow: true })
          setItemsProcessed(true)
        } else if (!productId && !variantId && !loading) {
          // No product params, check if we should redirect
          if ((!items || items.length === 0)) {
            router.push('/cart')
          }
          setItemsProcessed(true)
        }
      }
    }

    processProductParams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query, loading, itemsProcessed, addToCartContext])

  // Scroll to form when step changes
  useEffect(() => {
    if (formContainerRef.current) {
      formContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [step])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR'
    }).format(price)
  }

  const validateShippingForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!shippingAddress.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!shippingAddress.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!shippingAddress.email.trim()) newErrors.email = 'Email is required'
    if (!shippingAddress.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!shippingAddress.address.trim()) newErrors.address = 'Address is required'
    if (!shippingAddress.city.trim()) newErrors.city = 'City is required'
    if (!shippingAddress.state.trim()) newErrors.state = 'State is required'
    if (!shippingAddress.zipCode.trim()) newErrors.zipCode = 'ZIP code is required'

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (shippingAddress.email && !emailRegex.test(shippingAddress.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Phone validation
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/
    if (shippingAddress.phone && !phoneRegex.test(shippingAddress.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePaymentForm = () => {
    if (paymentMethod.type === 'cod') return true

    if (paymentMethod.type === 'jazzcash') {
      const hasTransactionId = paymentMethod.jazzCashTransactionId?.trim()
      const hasScreenshot = paymentMethod.jazzCashScreenshot

      if (!hasTransactionId && !hasScreenshot) {
        alert('Please provide either a Transaction ID or a screenshot of the transaction')
        return false
      }
      return true
    }

    if (paymentMethod.type === 'bank') {
      if (!paymentMethod.bankName?.trim()) {
        alert('Please enter your bank name')
        return false
      }
      if (!paymentMethod.bankAccountNumber?.trim()) {
        alert('Please enter your account number')
        return false
      }
      if (!paymentMethod.bankAccountName?.trim()) {
        alert('Please enter the account holder name')
        return false
      }
      return true
    }

    return false
  }

  const handleNextStep = () => {
    if (step === 1 && validateShippingForm()) {
      setStep(2)
    } else if (step === 2 && validatePaymentForm()) {
      setStep(3)
    }
  }

  const handlePlaceOrder = async () => {
    // Validate items exist
    if (!items || items.length === 0) {
      alert('Your cart is empty. Please add items before placing an order.')
      return
    }

    setProcessing(true)

    try {
      // Calculate summary for guests if not available from API
      let orderSummary = summary
      if (!orderSummary && items.length > 0) {
        const subtotal = items.reduce((sum, item) => {
          const itemPrice = item.variant?.price || item.product?.price || item.price || 0
          return sum + (itemPrice * item.quantity)
        }, 0)
        const tax = subtotal * 0.17 // 17% tax
        const shipping = subtotal > 5000 ? 0 : 300 // Free shipping over 5000
        orderSummary = {
          subtotal,
          tax,
          shipping,
          total: subtotal + tax + shipping,
          itemCount: items.length
        }
      }

      // Handle file conversion for Jazz Cash screenshot
      let screenshotPath: string | undefined
      if (paymentMethod.type === 'jazzcash' && paymentMethod.jazzCashScreenshot) {
        const file = paymentMethod.jazzCashScreenshot
        const reader = new FileReader()

        screenshotPath = await new Promise((resolve) => {
          reader.onload = () => {
            resolve(reader.result as string)
          }
          reader.readAsDataURL(file)
        })
      }

      const orderData = {
        shippingAddress,
        paymentMethod: {
          type: paymentMethod.type,
          ...(paymentMethod.type === 'jazzcash' && {
            jazzCashTransactionId: paymentMethod.jazzCashTransactionId,
            jazzCashScreenshotPath: screenshotPath,
          }),
          ...(paymentMethod.type === 'bank' && {
            bankName: paymentMethod.bankName,
            bankAccountNumber: paymentMethod.bankAccountNumber,
            bankAccountName: paymentMethod.bankAccountName,
          }),
        },
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.variant?.price || item.product?.price || item.price || 0
        })),
        summary: orderSummary
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const order = await response.json()
        // Clear guest cart on successful order
        clearCart()
        router.push(`/orders/${order.id}?success=true`)
      } else {
        const error = await response.json()
        alert(`Order failed: ${error.message}`)
      }
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading checkout...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* User Status Banner */}
            <div className="mb-6">
              {session ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-blue-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Logged in as <span className="font-semibold">{session.user?.name || session.user?.email}</span>
                      </p>
                      <p className="text-xs text-blue-700">{session.user?.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-amber-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">
                        Checking out as a guest
                      </p>
                      <p className="text-xs text-amber-700">Email and phone number are required</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/auth/signin?callbackUrl=/checkout')}
                    className="text-sm text-amber-700 hover:text-amber-900 font-semibold underline"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4">
                {[1, 2, 3].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= stepNumber
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-300 text-gray-600'
                      }`}>
                      {stepNumber}
                    </div>
                    <span className={`ml-2 text-sm ${step >= stepNumber ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                      {stepNumber === 1 ? 'Shipping' : stepNumber === 2 ? 'Payment' : 'Review'}
                    </span>
                    {stepNumber < 3 && (
                      <div className={`w-12 h-px mx-4 ${step > stepNumber ? 'bg-gray-900' : 'bg-gray-300'
                        }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm p-6" ref={formContainerRef}>
                  {/* Step 1: Shipping Information */}
                  {step === 1 && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
                      <form className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              First Name *
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.firstName}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, firstName: e.target.value })}
                              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'
                                }`}
                              placeholder="Enter your first name"
                            />
                            {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Last Name *
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.lastName}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, lastName: e.target.value })}
                              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300'
                                }`}
                              placeholder="Enter your last name"
                            />
                            {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email Address *
                            </label>
                            <input
                              type="email"
                              value={shippingAddress.email}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                                }`}
                              placeholder="Enter your email"
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              value={shippingAddress.phone}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                }`}
                              placeholder="Enter your phone number"
                            />
                            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address *
                          </label>
                          <input
                            type="text"
                            value={shippingAddress.address}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.address ? 'border-red-500' : 'border-gray-300'
                              }`}
                            placeholder="Enter your full address"
                          />
                          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              City *
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.city}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.city ? 'border-red-500' : 'border-gray-300'
                                }`}
                              placeholder="City"
                            />
                            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              State/Province *
                            </label>
                            <select
                              value={shippingAddress.state}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.state ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                              <option value="">-- Select Province --</option>
                              <option value="Punjab">Punjab</option>
                              <option value="Sindh">Sindh</option>
                              <option value="KPK">KPK</option>
                              <option value="Balochistan">Balochistan</option>
                            </select>
                            {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ZIP/Postal Code *
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.zipCode}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.zipCode ? 'border-red-500' : 'border-gray-300'
                                }`}
                              placeholder="ZIP Code"
                            />
                            {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country
                          </label>
                          <select
                            value={shippingAddress.country}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="Pakistan">Pakistan</option>
                            <option value="India">India</option>
                            <option value="Bangladesh">Bangladesh</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Step 2: Payment Method */}
                  {step === 2 && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6">Payment Method & Delivery</h2>

                      <div className="space-y-4">
                        {/* Cash on Delivery */}
                        <div className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
                          onClick={() => setPaymentMethod({ type: 'cod' })}>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cod"
                              checked={paymentMethod.type === 'cod'}
                              onChange={() => setPaymentMethod({ type: 'cod' })}
                              className="mr-3"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold">Cash on Delivery (Default)</h3>
                              <p className="text-gray-600 text-sm">Pay when your order is delivered to your address</p>
                            </div>
                            <div className="text-2xl">🚚</div>
                          </label>
                        </div>

                        {/* Jazz Cash */}
                        <div className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
                          onClick={() => setPaymentMethod({ ...paymentMethod, type: 'jazzcash' })}>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="jazzcash"
                              checked={paymentMethod.type === 'jazzcash'}
                              onChange={() => setPaymentMethod({ ...paymentMethod, type: 'jazzcash' })}
                              className="mr-3"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold">Jazz Cash</h3>
                              <p className="text-gray-600 text-sm">Pay using your Jazz Cash account</p>
                            </div>
                            <div className="text-2xl">📱</div>
                          </label>
                        </div>

                        {/* Jazz Cash Details */}
                        {paymentMethod.type === 'jazzcash' && (
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-4">
                            {/* Account Information */}
                            <div className="bg-white p-3 rounded border border-blue-300">
                              <p className="text-sm text-gray-600 mb-2">Send payment to:</p>
                              <div className="space-y-1">
                                <p className="font-semibold text-lg text-gray-800">03225653586</p>
                                <p className="text-sm text-gray-700">Account Name: <span className="font-medium">Zohaib zahid</span></p>
                              </div>
                            </div>

                            {/* Instructions */}
                            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                              <p className="text-sm text-yellow-800">
                                <span className="font-medium">📝 Instructions:</span> Send the amount to the Jazz Cash number above, then provide either the Transaction ID or a screenshot of the transaction below.
                              </p>
                            </div>

                            {/* Transaction ID */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Transaction ID (Optional)
                              </label>
                              <input
                                type="text"
                                value={paymentMethod.jazzCashTransactionId || ''}
                                onChange={(e) => setPaymentMethod({ ...paymentMethod, jazzCashTransactionId: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., TXN123456789"
                              />
                              <p className="text-xs text-gray-500 mt-1">The transaction ID from your Jazz Cash receipt</p>
                            </div>

                            {/* Screenshot Upload */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Transaction Screenshot (Optional)
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setPaymentMethod({ ...paymentMethod, jazzCashScreenshot: e.target.files?.[0] || null })}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">Upload a screenshot of your transaction confirmation</p>
                              {paymentMethod.jazzCashScreenshot && (
                                <p className="text-xs text-green-600 mt-1">✓ File selected: {paymentMethod.jazzCashScreenshot.name}</p>
                              )}
                            </div>

                            <p className="text-xs text-blue-700">ℹ️ At least one of Transaction ID or Screenshot is required</p>
                          </div>
                        )}

                        {/* Bank Account */}
                        <div className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
                          onClick={() => setPaymentMethod({ ...paymentMethod, type: 'bank' })}>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="bank"
                              checked={paymentMethod.type === 'bank'}
                              onChange={() => setPaymentMethod({ ...paymentMethod, type: 'bank' })}
                              className="mr-3"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold">Bank Transfer</h3>
                              <p className="text-gray-600 text-sm">Pay directly from your bank account</p>
                            </div>
                            <div className="text-2xl">🏦</div>
                          </label>
                        </div>

                        {/* Bank Account Details */}
                        {paymentMethod.type === 'bank' && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bank Name *
                              </label>
                              <input
                                type="text"
                                value={paymentMethod.bankName || ''}
                                onChange={(e) => setPaymentMethod({ ...paymentMethod, bankName: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., HBL, UBL, Habib Bank"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Number *
                              </label>
                              <input
                                type="text"
                                value={paymentMethod.bankAccountNumber || ''}
                                onChange={(e) => setPaymentMethod({ ...paymentMethod, bankAccountNumber: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter your account number"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Holder Name *
                              </label>
                              <input
                                type="text"
                                value={paymentMethod.bankAccountName || ''}
                                onChange={(e) => setPaymentMethod({ ...paymentMethod, bankAccountName: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter the account holder name"
                              />
                            </div>
                            <p className="text-sm text-green-700 font-medium">⚠️ Your account information will be securely stored</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Order Review */}
                  {step === 3 && (
                    <div>
                      <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>

                      {/* Shipping Details */}
                      <div className="border rounded-lg p-4 mb-6">
                        <h3 className="font-semibold mb-3">Shipping Address</h3>
                        <div className="text-gray-600">
                          <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                          <p>{shippingAddress.address}</p>
                          <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
                          <p>{shippingAddress.country}</p>
                          <p>{shippingAddress.phone}</p>
                          <p>{shippingAddress.email}</p>
                        </div>
                        <button
                          onClick={() => setStep(1)}
                          className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                        >
                          Edit
                        </button>
                      </div>

                      {/* Payment Details */}
                      <div className="border rounded-lg p-4 mb-6">
                        <h3 className="font-semibold mb-3">Payment Method</h3>
                        <div className="text-gray-600">
                          {paymentMethod.type === 'cod' && (
                            <p className="font-medium">💚 Cash on Delivery</p>
                          )}
                          {paymentMethod.type === 'jazzcash' && (
                            <div>
                              <p className="font-medium">📱 Jazz Cash</p>
                              {paymentMethod.jazzCashTransactionId && (
                                <p className="text-sm">Transaction ID: {paymentMethod.jazzCashTransactionId}</p>
                              )}
                              {paymentMethod.jazzCashScreenshot && (
                                <p className="text-sm">Screenshot: {paymentMethod.jazzCashScreenshot.name}</p>
                              )}
                            </div>
                          )}
                          {paymentMethod.type === 'bank' && (
                            <div>
                              <p className="font-medium">🏦 Bank Transfer</p>
                              <p className="text-sm">Bank: {paymentMethod.bankName}</p>
                              <p className="text-sm">Account: {paymentMethod.bankAccountNumber?.slice(-4) && `****${paymentMethod.bankAccountNumber.slice(-4)}`}</p>
                            </div>
                          )}

                        </div>
                        <button
                          onClick={() => setStep(2)}
                          className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                        >
                          Edit
                        </button>
                      </div>

                      {/* Order Items */}
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Order Items</h3>
                        <div className="space-y-3">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center space-x-3">
                              <OptimizedImage
                                src={item.product?.images?.[0]?.url || '/placeholder.jpg'}
                                alt={item.product?.name || 'Product'}
                                width={60}
                                height={60}
                                className="rounded object-cover"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium">{item.product?.name || 'Product'}</h4>
                                {item.variant && (
                                  <p className="text-sm text-gray-600">
                                    Size: {item.variant.size}
                                    {item.variant.color && `, Color: ${item.variant.color}`}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                              </div>
                              <div className="font-semibold">
                                {formatPrice((item.variant?.price || item.product?.price || item.price || 0) * item.quantity)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8">
                    <div>
                      {step > 1 && (
                        <button
                          onClick={() => setStep(step - 1)}
                          className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Back
                        </button>
                      )}
                    </div>

                    <div>
                      {step < 3 ? (
                        <button
                          onClick={handleNextStep}
                          className="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-black transition-colors"
                        >
                          Continue
                        </button>
                      ) : (
                        <LoadingButton
                          onClick={handlePlaceOrder}
                          loading={processing}
                          variant="success"
                          className="px-8 py-3"
                        >
                          Place Order
                        </LoadingButton>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                  <h3 className="text-xl font-semibold mb-4">Order Summary</h3>

                  {/* Items */}
                  <div className="space-y-3 mb-6">
                    {items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <OptimizedImage
                          src={item.product?.images?.[0]?.url || '/placeholder.jpg'}
                          alt={item.product?.name || 'Product'}
                          width={40}
                          height={40}
                          className="rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product?.name || 'Product'}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          {formatPrice((item.variant?.price || item.product?.price || item.price || 0) * item.quantity)}
                        </div>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <p className="text-sm text-gray-600">
                        +{items.length - 3} more items
                      </p>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>{formatPrice(displaySummary?.subtotal || summary?.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span>{(displaySummary?.shipping || summary?.shipping) === 0 ? 'FREE' : formatPrice(displaySummary?.shipping || summary?.shipping || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span>{formatPrice(displaySummary?.tax || summary?.tax || 0)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total</span>
                      <span className="text-blue-600">{formatPrice(displaySummary?.total || summary?.total || 0)}</span>
                    </div>
                  </div>

                  {/* Security Info */}
                  <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <div className="text-green-600">🔒</div>
                      <p className="text-sm text-green-800">
                        Your information is secure and encrypted
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
