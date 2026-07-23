import { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '@/lib/emailService';

/**
 * EMAIL TEST ENDPOINT
 * Use this to verify your email configuration is working
 * 
 * Usage: POST /api/test/send-email
 * Body: { "to": "your@email.com" }
 * 
 * Only works in development mode for security
 */

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Only allow in development for security
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            message: 'Email testing not available in production',
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { to } = req.body;

    if (!to || typeof to !== 'string') {
        return res.status(400).json({
            message: 'Please provide a valid email address',
            example: { to: 'test@example.com' },
        });
    }

    try {
        console.log(`\n🧪 Testing email configuration...`);
        console.log(`📧 Configuration Status:`);
        console.log(`   - EMAIL_HOST: ${process.env.EMAIL_HOST ? '✅ Set' : '❌ Missing'}`);
        console.log(`   - EMAIL_PORT: ${process.env.EMAIL_PORT ? '✅ Set' : '❌ Missing'}`);
        console.log(`   - EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Missing'}`);
        console.log(`   - EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing'}`);

        await sendEmail({
            to,
            subject: '🧪 Test Email from Ziki Apparel',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 4px 4px 0 0;">
            <h1 style="margin: 0;">✅ Email Configuration Working!</h1>
          </div>
          <div style="padding: 20px; background: #f5f5f5; border-radius: 0 0 4px 4px;">
            <p style="font-size: 16px; margin-top: 0;">
              This is a test email to verify your email configuration is working correctly.
            </p>
            <div style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #4CAF50;">
              <p><strong>Email Details:</strong></p>
              <p style="margin: 5px 0;">✅ SMTP Connection: Success</p>
              <p style="margin: 5px 0;">✅ Email Sent: Success</p>
              <p style="margin: 5px 0;">✅ Message Delivered: Success</p>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Your email service is now configured and ready to send password reset emails, order confirmations, and other notifications.
            </p>
          </div>
        </div>
      `,
        });

        return res.status(200).json({
            success: true,
            message: `✅ Test email sent successfully to ${to}`,
            details: {
                recipient: to,
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV,
            },
        });
    } catch (error) {
        console.error('❌ Email test failed:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: error instanceof Error ? error.message : 'Unknown error',
            troubleshooting: {
                step1: 'Check EMAIL_HOST is set correctly (e.g., smtp.gmail.com)',
                step2: 'Check EMAIL_PORT is set (usually 587 for TLS)',
                step3: 'Check EMAIL_USER is your email address',
                step4: 'Check EMAIL_PASS is correct (use Gmail App Password if using Gmail)',
                step5: 'Check firewall allows outgoing port 587 or 465',
            },
        });
    }
}
