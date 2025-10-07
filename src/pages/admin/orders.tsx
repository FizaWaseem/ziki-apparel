import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
    };
    variant?: {
      size: string;
    };
  }>;
}

const AdminOrders = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (session.user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchOrders();
  }, [session, status, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders?all=true');
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

  const updateOrderStatus = async (orderId: string, newStatus: string, trackingNumber?: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          ...(trackingNumber && { trackingNumber }),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      // Refresh orders
      await fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading orders...</p>
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
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="mt-2 text-gray-600">Manage customer orders and update their status</p>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {orders.map((order) => (
                <li key={order.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-medium text-gray-900 truncate">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Customer: {order.user.name} ({order.user.email})
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(order.createdAt)} • ${order.total.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="bg-indigo-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Items: {order.items.map(item => `${item.product.name} (${item.quantity})`).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Order Management Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Manage Order #{selectedOrder.id.slice(-8).toUpperCase()}
                    </h2>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Customer Info */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Customer Information</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p><strong>Name:</strong> {selectedOrder.user.name}</p>
                        <p><strong>Email:</strong> {selectedOrder.user.email}</p>
                        <p><strong>Phone:</strong> {selectedOrder.shippingAddress.phone}</p>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Shipping Address</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p>{selectedOrder.shippingAddress.fullName}</p>
                        <p>{selectedOrder.shippingAddress.address}</p>
                        <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}</p>
                        <p>{selectedOrder.shippingAddress.country}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Order Items</h3>
                      <div className="space-y-3">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{item.product.name}</p>
                              <p className="text-sm text-gray-600">
                                {item.variant?.size && `Size: ${item.variant.size} • `}
                                Quantity: {item.quantity}
                              </p>
                            </div>
                            <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                        <div className="text-right pt-3 border-t">
                          <p className="text-lg font-bold">Total: ${selectedOrder.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status Update */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Update Order Status</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                          <p className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                            {selectedOrder.status}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                            <button
                              key={status}
                              onClick={() => updateOrderStatus(selectedOrder.id, status)}
                              disabled={isUpdating || selectedOrder.status === status}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedOrder.status === status
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                              }`}
                            >
                              {isUpdating ? 'Updating...' : `Mark as ${status}`}
                            </button>
                          ))}
                        </div>

                        {selectedOrder.status === 'SHIPPED' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tracking Number
                            </label>
                            <input
                              type="text"
                              placeholder="Enter tracking number"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const trackingNumber = (e.target as HTMLInputElement).value;
                                  updateOrderStatus(selectedOrder.id, 'SHIPPED', trackingNumber);
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminOrders;