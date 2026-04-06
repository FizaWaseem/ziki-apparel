import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface ShippingAddress {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      images: Array<{ url: string }>;
    };
    variant?: {
      size: string;
    };
  }>;
}

const statusSteps = [
  { key: 'PENDING', label: 'Order Placed', icon: '📋' },
  { key: 'PROCESSING', label: 'Processing', icon: '⚙️' },
  { key: 'SHIPPED', label: 'Shipped', icon: '🚚' },
  { key: 'DELIVERED', label: 'Delivered', icon: '✅' },
];

const OrderTracking = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchOrders();
  }, [session, status, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status: string) => {
    return statusSteps.findIndex(step => step.key === status);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600';
      case 'PROCESSING':
        return 'text-blue-600';
      case 'SHIPPED':
        return 'text-purple-600';
      case 'DELIVERED':
        return 'text-green-600';
      case 'CANCELLED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your orders...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-red-600">Error: {error}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Order Tracking - Ziki Apparel</title>
        <meta name="description" content="Track your Ziki Apparel order status and shipping information in real-time." />
        <meta name="robots" content="noindex" />
      </Head>
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
              <p className="mt-2 text-gray-600">Track the status of your orders</p>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📦</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600 mb-6">You haven&#39;t placed any orders yet.</p>
                <button
                  onClick={() => router.push('/products')}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6">
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Placed on {formatDate(order.createdAt)}
                          </p>
                          {order.trackingNumber && (
                            <p className="text-sm text-gray-600 mt-1">
                              Tracking: <span className="font-mono">{order.trackingNumber}</span>
                            </p>
                          )}
                        </div>
                        <div className="mt-4 sm:mt-0">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <p className="text-lg font-bold text-gray-900 mt-2">
                            {order.total.toFixed(2)} Rs
                          </p>
                        </div>
                      </div>

                      {/* Progress Tracker */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between">
                          {statusSteps.map((step, index) => {
                            const currentStatusIndex = getStatusIndex(order.status);
                            const isActive = index <= currentStatusIndex;
                            const isCurrent = index === currentStatusIndex;

                            return (
                              <div key={step.key} className="flex flex-col items-center flex-1">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isActive
                                    ? isCurrent
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                  }`}>
                                  {isActive && index < currentStatusIndex ? '✓' : step.icon}
                                </div>
                                <p className={`text-xs mt-2 text-center ${isActive ? 'text-gray-900 font-medium' : 'text-gray-500'
                                  }`}>
                                  {step.label}
                                </p>
                                {index < statusSteps.length - 1 && (
                                  <div className={`hidden sm:block absolute h-0.5 w-16 mt-5 ${index < currentStatusIndex ? 'bg-green-500' : 'bg-gray-200'
                                    }`} style={{ left: `${(index + 1) * 25 - 8}%` }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="border-t pt-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Order Items</h4>
                        <div className="space-y-4">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center space-x-4">
                              <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                                {item.product.images[0] && (
                                  <img
                                    src={item.product.images[0].url}
                                    alt={item.product.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                )}
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{item.product.name}</h5>
                                <p className="text-sm text-gray-600">
                                  {item.variant?.size && `Size: ${item.variant.size} • `}
                                  Quantity: {item.quantity}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">
                                  {(item.price * item.quantity).toFixed(2)} Rs
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="border-t pt-6 mt-6">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => router.push(`/orders/${order.id}`)}
                            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            View Details
                          </button>
                          {order.status === 'DELIVERED' && (
                            <button className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                              Reorder
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default OrderTracking;