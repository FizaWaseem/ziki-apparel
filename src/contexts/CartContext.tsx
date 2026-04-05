import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

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

interface Product {
  id: string
  name: string
  slug: string
  price: number
  images: ProductImage[]
  category: Category | null
}

interface ProductVariant {
  id: string
  size: string
  color: string | null
  price: number | null
  stock: number
}

interface CartItem {
  id: string
  quantity: number
  productId: string
  variantId?: string | null
  price: number
  product: Product
  variant: ProductVariant | null
}

interface CartSummary {
  subtotal: number
  tax: number
  shipping: number
  total: number
  itemCount: number
}

interface CartContextType {
  items: CartItem[]
  summary: CartSummary | null
  loading: boolean
  refreshCart: () => Promise<void>
  addToCart: (productId: string, variantId?: string, quantity?: number, productSlug?: string) => Promise<boolean>
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>
  removeItem: (itemId: string) => Promise<boolean>
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const { data: session } = useSession()
  const [items, setItems] = useState<CartItem[]>([])
  const [summary, setSummary] = useState<CartSummary | null>(null)
  const [loading, setLoading] = useState(false)

  const refreshCart = useCallback(async () => {
    setLoading(true)
    try {
      // For authenticated users, fetch from API
      if (session?.user?.id) {
        const response = await fetch('/api/cart')
        if (response.ok) {
          const data = await response.json()
          setItems(data.items || [])
          setSummary(data.summary || null)
        }
      } else {
        // For guest users, load from localStorage
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]') as CartItem[]
        setItems(guestCart)
        setSummary(null)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  // Load guest cart on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !session?.user?.id) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]') as CartItem[]
      setItems(guestCart)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addToCart = async (productId: string, variantId?: string, quantity = 1, productSlug?: string): Promise<boolean> => {
    // For authenticated users, use API
    if (session?.user?.id) {
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            variantId: variantId || undefined,
            quantity,
          }),
        })

        if (response.ok) {
          await refreshCart()
          return true
        }
        return false
      } catch (error) {
        console.error('Error adding to cart:', error)
        return false
      }
    } else {
      // For guest users, fetch product details and store in localStorage
      try {
        console.log('Adding to guest cart:', { productId, variantId, quantity, productSlug })
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]') as CartItem[]
        const existingItem = guestCart.find(item => item.productId === productId && item.variantId === variantId)
        
        if (existingItem) {
          existingItem.quantity += quantity
        } else {
          // Fetch product details from API using slug if available, otherwise productId
          const endpoint = productSlug ? `/api/products/${productSlug}` : `/api/products?id=${productId}`
          console.log('Fetching product from:', endpoint)
          const productResponse = await fetch(endpoint)
          if (!productResponse.ok) {
            console.error('Failed to fetch product:', productResponse.status)
            return false
          }
          
          const productData = await productResponse.json()
          console.log('Product data fetched:', productData)
          
          // Find the variant
          let selectedVariant = null
          let productPrice = productData.price
          
          if (variantId && productData.variants) {
            selectedVariant = productData.variants.find((v: ProductVariant) => v.id === variantId)
            if (selectedVariant?.price) {
              productPrice = selectedVariant.price
            }
          }
          
          console.log('Creating cart item with price:', productPrice)
          
          // Create guest cart item with full product data
          guestCart.push({
            id: `guest-${productId}-${variantId}-${Date.now()}`,
            quantity,
            productId,
            variantId: variantId || null,
            price: productPrice,
            product: {
              id: productData.id,
              name: productData.name,
              slug: productData.slug,
              price: productData.price,
              images: productData.images || [],
              category: productData.category || null
            },
            variant: selectedVariant
          })
        }
        
        console.log('Guest cart after adding:', guestCart)
        localStorage.setItem('guestCart', JSON.stringify(guestCart))
        console.log('Saved to localStorage:', localStorage.getItem('guestCart'))
        setItems(guestCart)
        return true
      } catch (error) {
        console.error('Error adding to guest cart:', error)
        return false
      }
    }
  }

  const updateQuantity = async (itemId: string, quantity: number): Promise<boolean> => {
    // For authenticated users, use API
    if (session?.user?.id) {
      try {
        const response = await fetch(`/api/cart?id=${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity }),
        })

        if (response.ok) {
          await refreshCart()
          return true
        }
        return false
      } catch (error) {
        console.error('Error updating cart:', error)
        return false
      }
    } else {
      // For guest users, update localStorage
      try {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]') as CartItem[]
        const item = guestCart.find(i => i.id === itemId)
        if (item) {
          item.quantity = quantity
          localStorage.setItem('guestCart', JSON.stringify(guestCart))
          setItems(guestCart)
          return true
        }
        return false
      } catch (error) {
        console.error('Error updating guest cart:', error)
        return false
      }
    }
  }

  const removeItem = async (itemId: string): Promise<boolean> => {
    // For authenticated users, use API
    if (session?.user?.id) {
      try {
        const response = await fetch(`/api/cart?id=${itemId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await refreshCart()
          return true
        }
        return false
      } catch (error) {
        console.error('Error removing item:', error)
        return false
      }
    } else {
      // For guest users, update localStorage
      try {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]') as CartItem[]
        const filtered = guestCart.filter(i => i.id !== itemId)
        localStorage.setItem('guestCart', JSON.stringify(filtered))
        setItems(filtered)
        return true
      } catch (error) {
        console.error('Error removing from guest cart:', error)
        return false
      }
    }
  }

  const clearCart = () => {
    // Clear both localStorage and state for guests
    if (typeof window !== 'undefined') {
      localStorage.removeItem('guestCart')
    }
    setItems([])
    setSummary(null)
  }

  // Refresh cart when session changes
  useEffect(() => {
    if (session?.user?.id) {
      refreshCart()
    }
    // Don't clear items for guests - they're managed in localStorage
  }, [session?.user?.id, refreshCart])

  const value: CartContextType = {
    items,
    summary,
    loading,
    refreshCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}