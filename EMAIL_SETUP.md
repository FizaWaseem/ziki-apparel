# Email Notifications & Order Tracking Setup

## Overview
This guide explains how to set up email notifications and order tracking for the Ziki Apparel ecommerce application.

## Features Implemented

### 1. Email Notifications
- **Order Confirmation**: Sent automatically when a customer places an order
- **Order Status Updates**: Sent when admin updates order status (processing, shipped, delivered, cancelled)
- **Professional Email Templates**: HTML templates with order details, customer information, and branding

### 2. Order Tracking
- **Customer Order Tracking**: Visual progress tracker showing order status
- **Admin Order Management**: Complete interface for managing all orders
- **Status Updates**: Real-time status updates with email notifications

## Email Configuration

### Environment Variables
Add these variables to your `.env.local` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@zikiapparel.com
EMAIL_FROM_NAME=Ziki Apparel
```

### Gmail Setup (Recommended)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `EMAIL_PASS`

### Alternative Email Providers
You can use other SMTP providers by updating the configuration:

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

#### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-username
EMAIL_PASS=your-password
```

## Order Status Flow

1. **PENDING** → Order placed, payment pending
2. **PROCESSING** → Payment confirmed, preparing for shipment
3. **SHIPPED** → Order shipped with tracking number
4. **DELIVERED** → Order delivered to customer
5. **CANCELLED** → Order cancelled

## API Endpoints

### Order Management
- `GET /api/orders` - Get user's orders
- `GET /api/orders?all=true` - Get all orders (admin only)
- `POST /api/orders` - Create new order
- `GET /api/orders/[orderId]` - Get specific order
- `PATCH /api/orders/[orderId]/update` - Update order status (admin only)

### Email Notifications
Email notifications are automatically triggered:
- Order confirmation: When order is created
- Status updates: When admin changes order status

## User Interface

### Customer Features
1. **Order Tracking Page** (`/orders/tracking`)
   - Visual progress tracker
   - Order history
   - Order details

2. **Order Details Page** (`/orders/[orderId]`)
   - Complete order information
   - Status tracking
   - Download invoice (if implemented)

### Admin Features
1. **Admin Orders Page** (`/admin/orders`)
   - View all customer orders
   - Update order status
   - Add tracking numbers
   - Send status update emails

## Email Templates

### Order Confirmation
- Order details with itemized list
- Customer information
- Shipping address
- Payment method
- Professional styling with gradients and layouts

### Status Update
- Order status change notification
- Tracking information (for shipped orders)
- Next steps information

## Testing Email Notifications

### Local Testing
1. Set up a test Gmail account
2. Configure environment variables
3. Place a test order
4. Check email delivery

### Production Considerations
- Use a dedicated email service (SendGrid, Mailgun, etc.)
- Implement email queue for high volume
- Add email bounce handling
- Monitor delivery rates

## Security Considerations

1. **Email Credentials**: Never commit email credentials to version control
2. **Admin Access**: Only users with 'admin' role can update order status
3. **User Privacy**: Orders are only visible to their owners (except admin)

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check SMTP credentials
   - Verify app password for Gmail
   - Check firewall/network restrictions

2. **Admin features not working**
   - Ensure user has 'admin' role in database
   - Check API permissions

3. **Order status not updating**
   - Verify admin authentication
   - Check database connection
   - Review API endpoint responses

### Debug Mode
Enable debug logging by adding to your email service:

```typescript
const transporter = nodemailer.createTransport({
  // ... other config
  debug: true,
  logger: true,
});
```

## Future Enhancements

1. **SMS Notifications**: Add SMS alerts for order updates
2. **Push Notifications**: Browser push notifications
3. **Email Templates**: More template variations
4. **Analytics**: Email open/click tracking
5. **Automated Workflows**: Based on order status
6. **Customer Reviews**: Request reviews after delivery

## Dependencies

- `nodemailer`: SMTP email sending
- `@types/nodemailer`: TypeScript definitions
- `zod`: Schema validation
- `prisma`: Database ORM

## File Structure

```
src/
├── lib/
│   └── emailService.ts          # Email sending functions
├── pages/
│   ├── api/
│   │   └── orders/
│   │       ├── index.ts         # Orders CRUD API
│   │       └── [orderId]/
│   │           └── update.ts    # Order status updates
│   ├── orders/
│   │   ├── tracking.tsx         # Customer order tracking
│   │   └── [orderId].tsx        # Order details
│   └── admin/
│       └── orders.tsx           # Admin order management
└── components/
    └── Layout.tsx               # Updated navigation
```