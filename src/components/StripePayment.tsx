import { useState, useEffect } from 'react'
import { loadStripe, PaymentIntent } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { STRIPE_PUBLISHABLE_KEY } from '@/lib/stripe-client'

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY || '')

interface PaymentFormProps {
  amount: number
  onSuccess: (paymentIntent: PaymentIntent) => void
  onError: (error: string) => void
  disabled?: boolean
}

const PaymentForm = ({ amount, onSuccess, onError, disabled }: PaymentFormProps) => {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [clientSecret, setClientSecret] = useState('')

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            currency: 'usd',
          }),
        })

        const data = await response.json()
        if (response.ok) {
          setClientSecret(data.clientSecret)
        } else {
          onError(data.message || 'Failed to create payment intent')
        }
      } catch (error) {
        onError('Failed to initialize payment')
      }
    }

    if (amount > 0) {
      createPaymentIntent()
    }
  }, [amount, onError])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setIsProcessing(true)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setIsProcessing(false)
      return
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      })

      if (error) {
        onError(error.message || 'Payment failed')
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent)
      }
    } catch (error) {
      onError('Payment processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#374151',
        '::placeholder': {
          color: '#9CA3AF',
        },
      },
      invalid: {
        color: '#EF4444',
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white p-4 border border-gray-300 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <CardElement options={cardElementOptions} />
      </div>

      <button
        type="submit"
        disabled={!stripe || !clientSecret || isProcessing || disabled}
        className="w-full bg-gray-900 text-white py-3 px-4 rounded-full font-semibold hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  )
}

interface StripePaymentProps {
  amount: number
  onSuccess: (paymentIntent: PaymentIntent) => void
  onError: (error: string) => void
  disabled?: boolean
}

export default function StripePayment({ amount, onSuccess, onError, disabled }: StripePaymentProps) {
  if (!STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          Stripe is not configured. Please add your Stripe publishable key to complete payment setup.
        </p>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
        disabled={disabled}
      />
    </Elements>
  )
}