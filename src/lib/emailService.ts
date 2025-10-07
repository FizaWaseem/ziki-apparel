import nodemailer from 'nodemailer';

// Types for order data
interface OrderProduct {
  id: string;
  name: string;
  price: number;
}

interface OrderItemWithProduct {
  id: string;
  quantity: number;
  price: number;
  size: string;
  product: OrderProduct;
}

interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

interface OrderWithItems {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  shippingAddress: ShippingAddress | string;
  createdAt: Date;
  items: OrderItemWithProduct[];
}

interface BasicOrder {
  id: string;
  total: number;
  status: string;
  paymentMethod: string;
  shippingAddress: ShippingAddress | string;
  createdAt: Date;
}

// Create reusable transporter object using the default SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Email templates
const generateOrderConfirmationHTML = (order: OrderWithItems) => {
  const shippingAddress = typeof order.shippingAddress === 'string' 
    ? JSON.parse(order.shippingAddress) 
    : order.shippingAddress;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - Ziki Apparel</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .item:last-child { border-bottom: none; }
        .total { font-weight: bold; font-size: 1.2em; color: #667eea; padding-top: 10px; }
        .address { background: #f0f0f0; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .footer { text-align: center; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        .status-badge { background: #4CAF50; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Order Confirmed!</h1>
        <p>Thank you for your order from Ziki Apparel</p>
      </div>
      
      <div class="content">
        <h2>Order Details</h2>
        <div class="order-details">
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Status:</strong> <span class="status-badge">${order.status}</span></p>
          
          <h3>Items Ordered:</h3>
          ${order.items.map((item: OrderItemWithProduct) => `
            <div class="item">
              <div>
                <strong>${item.product.name}</strong><br>
                <small>Size: ${item.size} | Quantity: ${item.quantity}</small>
              </div>
              <div>$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          `).join('')}
          
          <div class="total">
            Total: $${order.total.toFixed(2)}
          </div>
        </div>
        
        <h3>Shipping Address</h3>
        <div class="address">
          ${shippingAddress.fullName}<br>
          ${shippingAddress.address}<br>
          ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}<br>
          ${shippingAddress.country}<br>
          Phone: ${shippingAddress.phone}
        </div>
        
        <h3>Payment Method</h3>
        <p>${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit/Debit Card'}</p>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0;">📦 What's Next?</h4>
          <p style="margin: 0;">We're preparing your order for shipment. You'll receive another email with tracking information once your order is shipped.</p>
        </div>
      </div>
      
      <div class="footer">
        <p>Thank you for choosing Ziki Apparel!</p>
        <p>If you have any questions, please contact us at support@zikiapparel.com</p>
      </div>
    </body>
    </html>
  `;
};

const generateOrderStatusUpdateHTML = (order: BasicOrder, newStatus: string) => {
  const statusMessages = {
    'processing': '📋 Your order is being processed',
    'shipped': '🚚 Your order has been shipped',
    'delivered': '✅ Your order has been delivered',
    'cancelled': '❌ Your order has been cancelled'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Update - Ziki Apparel</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .status-update { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .footer { text-align: center; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Order Update</h1>
        <p>Ziki Apparel</p>
      </div>
      
      <div class="content">
        <div class="status-update">
          <h2>${statusMessages[newStatus as keyof typeof statusMessages] || 'Order Status Updated'}</h2>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>New Status:</strong> ${newStatus.toUpperCase()}</p>
        </div>
        
        ${newStatus === 'shipped' ? `
          <div style="background: #e8f5e8; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0;">🚚 Tracking Information</h4>
            <p style="margin: 0;">Your order is on its way! Tracking details will be available shortly.</p>
          </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <p>Thank you for choosing Ziki Apparel!</p>
        <p>If you have any questions, please contact us at support@zikiapparel.com</p>
      </div>
    </body>
    </html>
  `;
};

// Email sending functions
export const sendOrderConfirmationEmail = async (
  customerEmail: string,
  order: OrderWithItems
) => {
  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: customerEmail,
      subject: `Order Confirmation - ${order.id} | Ziki Apparel`,
      html: generateOrderConfirmationHTML(order),
    });
    
    console.log('Order confirmation email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error };
  }
};

export const sendOrderStatusUpdateEmail = async (
  customerEmail: string,
  order: BasicOrder,
  newStatus: string
) => {
  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: customerEmail,
      subject: `Order Update - ${order.id} | Ziki Apparel`,
      html: generateOrderStatusUpdateHTML(order, newStatus),
    });
    
    console.log('Order status update email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending order status update email:', error);
    return { success: false, error };
  }
};