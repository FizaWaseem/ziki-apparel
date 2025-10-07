import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Layout from '@/components/Layout'
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
  type: 'card' | 'cod'
  cardNumber?: string
  expiryDate?: string
  cvv?: string
  cardholderName?: string
}

export default function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { items, summary, loading } = useCart()
  
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
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  useEffect(() => {
    if (session === null) {
      router.push('/auth/signin?callbackUrl=/checkout')
    }
  }, [session, router])

  useEffect(() => {
    if (!loading && (!items || items.length === 0)) {
      router.push('/cart')
    }
  }, [items, loading, router])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PKR'
    }).format(price)
  }

  const validateShippingForm = () => {
    const newErrors: {[key: string]: string} = {}
    
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
    
    const newErrors: {[key: string]: string} = {}
    
    if (!paymentMethod.cardNumber?.trim()) newErrors.cardNumber = 'Card number is required'
    if (!paymentMethod.expiryDate?.trim()) newErrors.expiryDate = 'Expiry date is required'
    if (!paymentMethod.cvv?.trim()) newErrors.cvv = 'CVV is required'
    if (!paymentMethod.cardholderName?.trim()) newErrors.cardholderName = 'Cardholder name is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (step === 1 && validateShippingForm()) {
      setStep(2)
    } else if (step === 2 && validatePaymentForm()) {
      setStep(3)
    }
  }

  const handlePlaceOrder = async () => {
    setProcessing(true)
    
    try {
      const orderData = {
        shippingAddress,
        paymentMethod,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.variant?.price || item.product.price
        })),
        summary
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

  if (!session || loading) {
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
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4">
                {[1, 2, 3].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNumber 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {stepNumber}
                    </div>
                    <span className={`ml-2 text-sm ${
                      step >= stepNumber ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {stepNumber === 1 ? 'Shipping' : stepNumber === 2 ? 'Payment' : 'Review'}
                    </span>
                    {stepNumber < 3 && (
                      <div className={`w-12 h-px mx-4 ${
                        step > stepNumber ? 'bg-blue-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm p-6">
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
                              onChange={(e) => setShippingAddress({...shippingAddress, firstName: e.target.value})}
                              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.firstName ? 'border-red-500' : 'border-gray-300'
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
                              onChange={(e) => setShippingAddress({...shippingAddress, lastName: e.target.value})}
                              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.lastName ? 'border-red-500' : 'border-gray-300'
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
                              onChange={(e) => setShippingAddress({...shippingAddress, email: e.target.value})}
                              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.email ? 'border-red-500' : 'border-gray-300'
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
                              onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.phone ? 'border-red-500' : 'border-gray-300'
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
                            onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.address ? 'border-red-500' : 'border-gray-300'
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
                              onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.city ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="City"
                            />
                            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              State/Province *
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.state}
                              onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.state ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="State/Province"
                            />
                            {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ZIP/Postal Code *
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.zipCode}
                              onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                              className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.zipCode ? 'border-red-500' : 'border-gray-300'
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
                            onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
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
                      <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
                      
                      <div className="space-y-4">
                        {/* Cash on Delivery */}
                        <div className="border rounded-lg p-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cod"
                              checked={paymentMethod.type === 'cod'}
                              onChange={() => setPaymentMethod({type: 'cod'})}
                              className="mr-3"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold">Cash on Delivery</h3>
                              <p className="text-gray-600 text-sm">Pay when your order is delivered</p>
                            </div>
                            <div className="text-2xl">📦</div>
                          </label>
                        </div>

                        {/* Credit Card */}
                        <div className="border rounded-lg p-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="card"
                              checked={paymentMethod.type === 'card'}
                              onChange={() => setPaymentMethod({type: 'card', cardNumber: '', expiryDate: '', cvv: '', cardholderName: ''})}
                              className="mr-3"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold">Credit/Debit Card</h3>
                              <p className="text-gray-600 text-sm">Pay securely with your card</p>
                            </div>
                            <div className="text-2xl">💳</div>
                          </label>
                        </div>

                        {/* Card Details */}
                        {paymentMethod.type === 'card' && (
                          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cardholder Name *
                              </label>
                              <input
                                type="text"
                                value={paymentMethod.cardholderName || ''}
                                onChange={(e) => setPaymentMethod({...paymentMethod, cardholderName: e.target.value})}
                                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  errors.cardholderName ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Name on card"
                              />
                              {errors.cardholderName && <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Card Number *
                              </label>
                              <input
                                type="text"
                                value={paymentMethod.cardNumber || ''}
                                onChange={(e) => setPaymentMethod({...paymentMethod, cardNumber: e.target.value})}
                                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="1234 5678 9012 3456"
                              />
                              {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Expiry Date *
                                </label>
                                <input
                                  type="text"
                                  value={paymentMethod.expiryDate || ''}
                                  onChange={(e) => setPaymentMethod({...paymentMethod, expiryDate: e.target.value})}
                                  className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                  placeholder="MM/YY"
                                />
                                {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  CVV *
                                </label>
                                <input
                                  type="text"
                                  value={paymentMethod.cvv || ''}
                                  onChange={(e) => setPaymentMethod({...paymentMethod, cvv: e.target.value})}
                                  className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.cvv ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                  placeholder="123"
                                />
                                {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
                              </div>
                            </div>
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
                          {paymentMethod.type === 'cod' ? (
                            <p>Cash on Delivery</p>
                          ) : (
                            <p>Credit/Debit Card ending in {paymentMethod.cardNumber?.slice(-4)}</p>
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
                              <Image
                                src={item.product.images[0]?.url || '/placeholder.jpg'}
                                alt={item.product.name}
                                width={60}
                                height={60}
                                className="rounded object-cover"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium">{item.product.name}</h4>
                                {item.variant && (
                                  <p className="text-sm text-gray-600">
                                    Size: {item.variant.size}
                                    {item.variant.color && `, Color: ${item.variant.color}`}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                              </div>
                              <div className="font-semibold">
                                {formatPrice((item.variant?.price || item.product.price) * item.quantity)}
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
                          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Continue
                        </button>
                      ) : (
                        <button
                          onClick={handlePlaceOrder}
                          disabled={processing}
                          className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {processing ? 'Processing...' : 'Place Order'}
                        </button>
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
                        <Image
                          src={item.product.images[0]?.url || '/placeholder.jpg'}
                          alt={item.product.name}
                          width={40}
                          height={40}
                          className="rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-sm font-semibold">
                          {formatPrice((item.variant?.price || item.product.price) * item.quantity)}
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
                      <span>{formatPrice(summary?.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span>{summary?.shipping === 0 ? 'FREE' : formatPrice(summary?.shipping || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span>{formatPrice(summary?.tax || 0)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total</span>
                      <span className="text-blue-600">{formatPrice(summary?.total || 0)}</span>
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