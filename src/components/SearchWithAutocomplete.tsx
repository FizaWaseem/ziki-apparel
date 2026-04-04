import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'

interface SearchSuggestion {
  type: 'product' | 'category' | 'search'
  id: string
  name: string
  slug?: string
  price?: number
  image?: string
  category?: string
  url: string
}

interface SearchWithAutocompleteProps {
  className?: string
  placeholder?: string
  onSearch?: (query: string) => void
}

export default function SearchWithAutocomplete({ 
  className = '', 
  placeholder = 'Search products...',
  onSearch 
}: SearchWithAutocompleteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions(query)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = async (searchQuery: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data)
        setShowSuggestions(true)
        setSelectedIndex(-1)
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      performSearch(query.trim())
    }
  }

  const performSearch = (searchQuery: string) => {
    setShowSuggestions(false)
    setSelectedIndex(-1)
    
    if (onSearch) {
      onSearch(searchQuery)
    } else {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          const suggestion = suggestions[selectedIndex]
          router.push(suggestion.url)
        } else if (query.trim()) {
          performSearch(query.trim())
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder={placeholder}
          className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <Link
              key={`${suggestion.type}-${suggestion.id}`}
              href={suggestion.url}
              className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => {
                setShowSuggestions(false)
                setSelectedIndex(-1)
              }}
            >
              <div className="flex items-center space-x-3">
                {/* Icon/Image */}
                <div className="flex-shrink-0">
                  {suggestion.type === 'product' && suggestion.image ? (
                    <div className="relative w-10 h-10">
                      <Image
                        src={suggestion.image}
                        alt={suggestion.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded flex items-center justify-center text-lg ${
                      suggestion.type === 'product' ? 'bg-blue-100' : 
                      suggestion.type === 'category' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {suggestion.type === 'product' ? '🛍️' : 
                       suggestion.type === 'category' ? '📁' : '🔍'}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.name}
                      </p>
                      {suggestion.category && (
                        <p className="text-xs text-gray-500">{suggestion.category}</p>
                      )}
                    </div>
                    {suggestion.price && (
                      <p className="text-sm font-semibold text-gray-900">
                        {formatPrice(suggestion.price)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* No results */}
      {showSuggestions && suggestions.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-center text-gray-500">
            <p>No products found for &quot;{query}&quot;</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        </div>
      )}
    </div>
  )
}