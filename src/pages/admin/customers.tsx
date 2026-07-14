import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

type Customer = {
    id: string;
    name: string | null;
    email: string;
    role: string;
    image: string | null;
    createdAt: string;
    updatedAt: string;
};

export default function CustomersAdminPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCustomers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/admin/customers');
            if (!response.ok) {
                throw new Error('Failed to fetch customers');
            }

            const data = await response.json();

            // API returns Date objects serialized by Next/Node as strings, but keep safe.
            const rawCustomers: Array<{
                id: string;
                name: string | null;
                email: string;
                role: string;
                image: string | null;
                createdAt: string | Date;
                updatedAt: string | Date;
            }> = data || [];

            setCustomers(
                rawCustomers.map((c) => ({
                    id: c.id,
                    name: c.name ?? null,
                    email: c.email,
                    role: c.role,
                    image: c.image ?? null,
                    createdAt: new Date(c.createdAt).toISOString(),
                    updatedAt: new Date(c.updatedAt).toISOString(),
                }))
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (value: string) => {
        try {
            return new Date(value).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return value;
        }
    };

    return (
        <AdminLayout title="Customers">
            <div className="space-y-6">
                <div className="mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
                    <p className="mt-1 text-gray-600">All registered customer accounts</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-700 border border-red-200 rounded-md p-4">
                        {error}
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Total Customers: {customers.length}
                                </h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Created
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Updated
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {customers.map((c) => (
                                            <tr key={c.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                                                            {c.image ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={c.image} alt={c.name || 'Customer'} className="h-10 w-10 object-cover" />
                                                            ) : (
                                                                <span className="text-gray-500 text-sm">👤</span>
                                                            )}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {c.name || 'Unknown'}
                                                            </div>
                                                            <div className="text-sm text-gray-500">{c.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {c.role}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(c.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(c.updatedAt)}
                                                </td>
                                            </tr>
                                        ))}

                                        {customers.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                                    No customers found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

