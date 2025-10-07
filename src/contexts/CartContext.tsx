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
  addToCart: (productId: string, variantId?: string, quantity?: number) => Promise<boolean>
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>
  removeItem: (itemId: string) => Promise<boolean>
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
    if (!session?.user?.id) {
      setItems([])
      setSummary(null)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
        setSummary(data.summary || null)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  const addToCart = async (productId: string, variantId?: string, quantity = 1): Promise<boolean> => {
    if (!session?.user?.id) return false

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
  }

  const updateQuantity = async (itemId: string, quantity: number): Promise<boolean> => {
    if (!session?.user?.id) return false

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
  }

  const removeItem = async (itemId: string): Promise<boolean> => {
    if (!session?.user?.id) return false

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
  }

  // Refresh cart when session changes
  useEffect(() => {
    if (session?.user?.id) {
      refreshCart()
    } else {
      setItems([])
      setSummary(null)
    }
  }, [session?.user?.id, refreshCart])

  const value: CartContextType = {
    items,
    summary,
    loading,
    refreshCart,
    addToCart,
    updateQuantity,
    removeItem,
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