import React from 'react'

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'dark' | 'success'
}

export default function LoadingButton({
  loading = false,
  children,
  disabled = false,
  variant = 'primary',
  className = '',
  ...props
}: LoadingButtonProps) {
  const baseStyles = 'flex items-center justify-center gap-2 font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-200 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white',
    dark: 'bg-gray-900 hover:bg-black disabled:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 disabled:bg-green-500 text-white'
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      <span>{children}</span>
    </button>
  )
}
