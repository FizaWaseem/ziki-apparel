import nodemailer from 'nodemailer';
import type { ShippingAddress } from '@/types/order';

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

// Generic sendEmail function for contact forms and other general emails
export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: options.from || `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

export const sendOrderConfirmationEmail = async (
  email: string,
  order: OrderWithItems
) => {
  const transporter = createTransporter();

  // Generate HTML for order items
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e9ecef;">${item.product.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e9ecef; text-align: center;">${item.size}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e9ecef; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e9ecef; text-align: right;">${item.price.toFixed(2)} Rs</td>
    </tr>
  `).join('');

  // Generate shipping address HTML
  let addressHtml = '';
  if (order.shippingAddress && typeof order.shippingAddress === 'object') {
    const addr = order.shippingAddress;
    addressHtml = `
      <div style="margin: 15px 0;">
        <h4 style="margin-bottom: 10px;">Shipping Address:</h4>
        <p style="margin: 5px 0;">${addr.firstName}</p>
        <p style="margin: 5px 0;">${addr.addressLine1}</p>
        <p style="margin: 5px 0;">${addr.city}, ${addr.state} ${addr.zipCode}</p>
        <p style="margin: 5px 0;">${addr.country}</p>
        ${addr.phone ? `<p style="margin: 5px 0;">Phone: ${addr.phone}</p>` : ''}
      </div>
    `;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Order Confirmation</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Thank you for your order!</p>
      </div>
      
      <div style="padding: 30px; background: #ffffff;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Hi there! Your order has been confirmed and will be processed soon.
        </p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Order Details</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Order Date:</strong> ${order.createdAt.toLocaleDateString()}</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>
        
        ${addressHtml}
        
        <div style="margin: 20px 0;">
          <h3 style="color: #333; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Product</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Size</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Quantity</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr style="background: #f8f9fa; font-weight: bold;">
                <td colspan="3" style="padding: 15px; text-align: right; border-top: 2px solid #dee2e6;">Total:</td>
                <td style="padding: 15px; text-align: right; border-top: 2px solid #dee2e6;">${order.total.toFixed(2)} Rs</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1976d2;">What's Next?</h4>
          <p style="margin-bottom: 0;">We'll send you a shipping confirmation email with tracking information once your order ships.</p>
        </div>
        
        <p style="margin-top: 30px;">
          Thank you for choosing Ziki Apparel! If you have any questions, please don't hesitate to contact us.
        </p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Ziki Apparel. All rights reserved.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Order Confirmation - Order #${order.id}`,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export async function sendOrderStatusUpdateEmail(
  email: string,
  order: BasicOrder,
  status: string
) {
  const transporter = createTransporter();

  // Generate shipping address HTML
  let addressHtml = '';
  if (order.shippingAddress && typeof order.shippingAddress === 'object') {
    const addr = order.shippingAddress;
    addressHtml = `
      <div style="margin: 15px 0;">
        <h4 style="margin-bottom: 10px;">Shipping Address:</h4>
        <p style="margin: 5px 0;">${addr.lastName}</p>
        <p style="margin: 5px 0;">${addr.addressLine1}</p>
        <p style="margin: 5px 0;">${addr.city}, ${addr.state} ${addr.zipCode}</p>
        <p style="margin: 5px 0;">${addr.country}</p>
        ${addr.phone ? `<p style="margin: 5px 0;">Phone: ${addr.phone}</p>` : ''}
      </div>
    `;
  }

  const statusColors: { [key: string]: string } = {
    pending: '#ffc107',
    processing: '#17a2b8',
    shipped: '#28a745',
    delivered: '#28a745',
    cancelled: '#dc3545',
  };

  const statusColor = statusColors[status.toLowerCase()] || '#6c757d';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Order Update</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Your order status has been updated</p>
      </div>
      
      <div style="padding: 30px; background: #ffffff;">
        <div style="text-align: center; margin: 20px 0;">
          <div style="display: inline-block; background: ${statusColor}; color: white; padding: 10px 20px; border-radius: 25px; font-weight: bold; text-transform: uppercase;">
            ${status}
          </div>
        </div>
        
        <p style="font-size: 16px; margin-bottom: 20px; text-align: center;">
          Your order status has been updated to <strong>${status.toUpperCase()}</strong>.
        </p>
      </div>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Details</h3>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Total:</strong> ${order.total.toFixed(2)} Rs</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        <p><strong>Order Date:</strong> ${order.createdAt.toLocaleDateString()}</p>
        ${addressHtml}
      </div>
      
      <p>Thank you for shopping with Ziki Apparel!</p>
      
      <p style="color: #6b7280; font-size: 14px;">
        If you have any questions, please contact our support team.
      </p>
    </div>
  `;

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `Order Update: ${status.toUpperCase()} - Order #${order.id}`,
    html,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendAdminNewOrderNotification(
  order: OrderWithItems,
  paymentDetails?: {
    type: string;
    transactionId?: string;
    bankName?: string;
    bankAccountNumber?: string;
  }
) {
  const transporter = createTransporter();
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not set in environment variables');
    return;
  }

  // Generate shipping address HTML
  let addressHtml = '';
  if (order.shippingAddress && typeof order.shippingAddress === 'object') {
    const addr = order.shippingAddress as ShippingAddress;
    addressHtml = `
      <div style="margin: 15px 0; padding: 15px; background: #f3f4f6; border-radius: 8px;">
        <h4 style="margin-bottom: 10px; color: #333;">Customer Address:</h4>
        <p style="margin: 5px 0;"><strong>${addr.lastName}, ${addr.firstName}</strong></p>
        <p style="margin: 5px 0;">${(addr as unknown as { address?: string }).address ?? ''}</p>
        <p style="margin: 5px 0;">${addr.city}, ${addr.state} ${addr.zipCode}</p>
        <p style="margin: 5px 0;">${addr.country}</p>
        <p style="margin: 5px 0;">📞 ${addr.phone}</p>
        <p style="margin: 5px 0;">📧 ${addr.email}</p>
      </div>
    `;
  }

  // Generate payment details HTML
  let paymentHtml = '';
  if (paymentDetails) {
    if (paymentDetails.type === 'cod') {
      paymentHtml = `
        <div style="margin: 15px 0; padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
          <h4 style="margin-bottom: 10px; color: #155724;">Payment: Cash on Delivery</h4>
          <p style="margin: 5px 0; color: #155724;">Customer will pay when order is delivered</p>
        </div>
      `;
    } else if (paymentDetails.type === 'jazzcash') {
      paymentHtml = `
        <div style="margin: 15px 0; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
          <h4 style="margin-bottom: 10px; color: #856404;">🔔 Payment Pending Verification: Jazz Cash</h4>
          ${paymentDetails.transactionId ? `<p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${paymentDetails.transactionId}</p>` : ''}
          <p style="margin: 5px 0; color: #856404;">⚠️ Verify payment before processing order</p>
        </div>
      `;
    } else if (paymentDetails.type === 'bank') {
      paymentHtml = `
        <div style="margin: 15px 0; padding: 15px; background: #d1ecf1; border-radius: 8px; border-left: 4px solid #17a2b8;">
          <h4 style="margin-bottom: 10px; color: #0c5460;">🔔 Payment Pending Verification: Bank Transfer</h4>
          <p style="margin: 5px 0;"><strong>Bank:</strong> ${paymentDetails.bankName}</p>
          <p style="margin: 5px 0;"><strong>Account:</strong> ****${paymentDetails.bankAccountNumber?.slice(-4)}</p>
          <p style="margin: 5px 0; color: #0c5460;">⚠️ Verify payment before processing order</p>
        </div>
      `;
    }
  }

  // Generate order items HTML
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: left;">${item.product.name}</td>
      <td style="padding: 12px; text-align: center;">${item.size}</td>
      <td style="padding: 12px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right;">Rs ${item.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">🛍️ New Order Received!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Order #${order.id.substring(0, 8).toUpperCase()}</p>
      </div>
      
      <div style="padding: 30px; background: #ffffff;">
        <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Order Details</h2>
        
        <div style="margin: 20px 0;">
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Order Date:</strong> ${order.createdAt.toLocaleString()}</p>
          <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
          <p><strong>Total Amount:</strong> <span style="font-size: 18px; color: #28a745; font-weight: bold;">Rs ${order.total.toFixed(2)}</span></p>
        </div>

        ${paymentHtml}
        ${addressHtml}

        <div style="margin: 20px 0;">
          <h3 style="color: #333;">Order Items:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left; font-weight: bold;">Product</th>
                <th style="padding: 12px; text-align: center; font-weight: bold;">Size</th>
                <th style="padding: 12px; text-align: center; font-weight: bold;">Qty</th>
                <th style="padding: 12px; text-align: right; font-weight: bold;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; border-left: 4px solid #667eea;">
          <h4 style="margin-top: 0; color: #333;">⚡ Action Required:</h4>
          <p>1. Verify payment status (if applicable)</p>
          <p>2. Confirm inventory availability</p>
          <p>3. Process and ship order</p>
          <p style="margin-bottom: 0;"><strong><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/admin/orders" style="color: #667eea;">View in Admin Dashboard →</a></strong></p>
        </div>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
        <p style="margin: 5px 0;">Ziki Apparel Admin Notification</p>
        <p style="margin: 5px 0;">Do not reply to this email</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to: adminEmail,
    subject: `🛍️ New Order #${order.id.substring(0, 8).toUpperCase()} - Rs ${order.total.toFixed(2)}`,
    html,
  };

  await transporter.sendMail(mailOptions);
}