import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./notifications.db');

// Initialize database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    booking_id INTEGER,
    payment_id TEXT,
    status TEXT DEFAULT 'sent',
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME
  )`);
});

// Email templates
const emailTemplates = {
  booking_created: {
    subject: '🎉 Booking Confirmation',
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Booking Confirmed!</h2>
        <p>Great news! Your booking has been successfully created.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Booking ID:</strong> #${data.bookingId}</p>
          <p><strong>Message:</strong> ${data.message}</p>
        </div>
        <p>We'll send you another confirmation once your payment is processed.</p>
        <p style="color: #6b7280;">Thank you for choosing our service!</p>
      </div>
    `
  },
  payment_success: {
    subject: '✅ Payment Successful',
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Payment Successful!</h2>
        <p>Your payment has been processed successfully.</p>
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <p><strong>Amount:</strong> $${data.amount}</p>
          <p><strong>Payment ID:</strong> ${data.paymentId}</p>
          <p><strong>Booking ID:</strong> #${data.bookingId}</p>
        </div>
        <p>Your booking is now confirmed and you should receive your tickets/confirmation details shortly.</p>
        <p style="color: #6b7280;">Receipt and booking details are available in your account.</p>
      </div>
    `
  },
  payment_failed: {
    subject: '❌ Payment Failed',
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Payment Failed</h2>
        <p>Unfortunately, we couldn't process your payment.</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p><strong>Booking ID:</strong> #${data.bookingId}</p>
          <p><strong>Payment ID:</strong> ${data.paymentId}</p>
          <p><strong>Reason:</strong> ${data.message}</p>
        </div>
        <p>Please try again with a different payment method or contact our support team.</p>
        <p style="color: #6b7280;">Your booking is still reserved for 24 hours.</p>
      </div>
    `
  },
  payment_refunded: {
    subject: '💰 Refund Processed',
    template: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Refund Processed</h2>
        <p>Your refund has been successfully processed.</p>
        <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
          <p><strong>Refund Amount:</strong> $${data.amount}</p>
          <p><strong>Original Payment ID:</strong> ${data.paymentId}</p>
          <p><strong>Booking ID:</strong> #${data.bookingId}</p>
        </div>
        <p>The refund will appear in your original payment method within 3-5 business days.</p>
        <p style="color: #6b7280;">Thank you for your understanding.</p>
      </div>
    `
  }
};

// Simulate email sending
const sendEmail = async (to, subject, htmlContent) => {
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('\n📧 EMAIL SENT:');
  console.log('================');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('Content:');
  console.log(htmlContent.replace(/<[^>]*>/g, '').trim());
  console.log('================\n');
  
  // Simulate 98% success rate
  return Math.random() > 0.02;
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Notification Service is running', timestamp: new Date().toISOString() });
});

// Send notification
app.post('/send', [
  body('userId').isInt({ min: 1 }),
  body('type').isIn(['booking_created', 'payment_success', 'payment_failed', 'payment_refunded']),
  body('message').isString(),
  body('bookingId').optional().isInt({ min: 1 }),
  body('paymentId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, type, message, bookingId, paymentId, amount } = req.body;

    // Get email template
    const template = emailTemplates[type];
    if (!template) {
      return res.status(400).json({ error: 'Invalid notification type' });
    }

    const subject = template.subject;
    const htmlContent = template.template({ 
      message, 
      bookingId, 
      paymentId, 
      amount,
      userId 
    });

    // Simulate getting user email (in real app, would fetch from user service)
    const userEmail = `user${userId}@example.com`;

    // Send email
    const emailSent = await sendEmail(userEmail, subject, htmlContent);

    // Store notification in database
    db.run(
      'INSERT INTO notifications (user_id, type, subject, message, booking_id, payment_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, type, subject, message, bookingId || null, paymentId || null, emailSent ? 'sent' : 'failed'],
      function(err) {
        if (err) {
          console.error('Failed to store notification:', err);
          return res.status(500).json({ error: 'Failed to store notification' });
        }

        res.json({
          success: emailSent,
          notificationId: this.lastID,
          message: emailSent ? 'Notification sent successfully' : 'Failed to send notification',
          type,
          recipient: userEmail
        });
      }
    );

  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user notifications
app.get('/notifications/user/:userId', (req, res) => {
  const { userId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  db.all(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY sent_at DESC LIMIT ? OFFSET ?',
    [userId, parseInt(limit), parseInt(offset)],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Mark notification as read
app.put('/notifications/:id/read', (req, res) => {
  const { id } = req.params;

  db.run(
    'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to mark notification as read' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json({ message: 'Notification marked as read' });
    }
  );
});

// Get notification statistics
app.get('/stats', (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total FROM notifications',
    'SELECT COUNT(*) as sent FROM notifications WHERE status = "sent"',
    'SELECT COUNT(*) as failed FROM notifications WHERE status = "failed"',
    'SELECT type, COUNT(*) as count FROM notifications GROUP BY type'
  ];

  Promise.all(queries.map(query => 
    new Promise((resolve, reject) => {
      db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    })
  )).then(results => {
    res.json({
      total: results[0][0].total,
      sent: results[1][0].sent,
      failed: results[2][0].failed,
      byType: results[3]
    });
  }).catch(err => {
    res.status(500).json({ error: 'Failed to get statistics' });
  });
});

app.listen(PORT, () => {
  console.log(`📧 Notification Service running on port ${PORT}`);
});