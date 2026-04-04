export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images: Array<{ url: string; alt: string }>;
  };
  variant?: {
    id: string;
    size: string;
    color: string;
  };
}

export interface Order {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  shippingAddress: ShippingAddress | string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}