import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./payments.db');

// Initialize database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id TEXT UNIQUE NOT NULL,
    booking_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    gateway_response TEXT,
    transaction_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Dummy payment gateways
const paymentGateways = {
  stripe: {
    name: 'Stripe',
    process: async (amount, paymentMethod) => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate 95% success rate
      const success = Math.random() > 0.05;
      
      return {
        success,
        transactionId: success ? `stripe_${uuidv4()}` : null,
        message: success ? 'Payment processed successfully' : 'Payment failed - insufficient funds'
      };
    }
  },
  paypal: {
    name: 'PayPal',
    process: async (amount, paymentMethod) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const success = Math.random() > 0.03;
      
      return {
        success,
        transactionId: success ? `pp_${uuidv4()}` : null,
        message: success ? 'PayPal payment successful' : 'PayPal payment declined'
      };
    }
  },
  square: {
    name: 'Square',
    process: async (amount, paymentMethod) => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const success = Math.random() > 0.07;
      
      return {
        success,
        transactionId: success ? `sq_${uuidv4()}` : null,
        message: success ? 'Square payment completed' : 'Square payment error'
      };
    }
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Payment Service is running', timestamp: new Date().toISOString() });
});

// Get supported payment methods
app.get('/methods', (req, res) => {
  const methods = Object.keys(paymentGateways).map(key => ({
    id: key,
    name: paymentGateways[key].name
  }));
  res.json(methods);
});

// Process payment
app.post('/process', [
  body('bookingId').isInt({ min: 1 }),
  body('userId').isInt({ min: 1 }),
  body('amount').isFloat({ min: 0.01 }),
  body('paymentMethod').isIn(['stripe', 'paypal', 'square']),
  body('cardDetails').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, userId, amount, paymentMethod, cardDetails } = req.body;
    const paymentId = uuidv4();

    // Create payment record
    db.run(
      'INSERT INTO payments (payment_id, booking_id, user_id, amount, payment_method) VALUES (?, ?, ?, ?, ?)',
      [paymentId, bookingId, userId, amount, paymentMethod],
      async function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create payment record' });
        }

        const paymentRecordId = this.lastID;

        try {
          // Process payment through gateway
          const gateway = paymentGateways[paymentMethod];
          const result = await gateway.process(amount, cardDetails);

          const status = result.success ? 'completed' : 'failed';
          const gatewayResponse = JSON.stringify(result);

          // Update payment record
          db.run(
            'UPDATE payments SET status = ?, gateway_response = ?, transaction_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, gatewayResponse, result.transactionId, paymentRecordId],
            async (err) => {
              if (err) {
                console.error('Failed to update payment record:', err);
              }

              if (result.success) {
                // Update booking payment status
                try {
                  await axios.put(`http://localhost:3002/bookings/${bookingId}/payment-status`, {
                    paymentStatus: 'completed'
                  });

                  // Send payment confirmation notification
                  await axios.post('http://localhost:3004/send', {
                    userId,
                    type: 'payment_success',
                    bookingId,
                    paymentId,
                    amount,
                    message: `Payment of $${amount} processed successfully via ${gateway.name}.`
                  });

                } catch (notificationError) {
                  console.log('Service communication error:', notificationError.message);
                }

                res.json({
                  success: true,
                  paymentId,
                  transactionId: result.transactionId,
                  message: result.message,
                  amount,
                  status: 'completed'
                });
              } else {
                // Update booking payment status to failed
                try {
                  await axios.put(`http://localhost:3002/bookings/${bookingId}/payment-status`, {
                    paymentStatus: 'failed'
                  });

                  // Send payment failure notification
                  await axios.post('http://localhost:3004/send', {
                    userId,
                    type: 'payment_failed',
                    bookingId,
                    paymentId,
                    message: `Payment failed: ${result.message}`
                  });

                } catch (notificationError) {
                  console.log('Service communication error:', notificationError.message);
                }

                res.status(400).json({
                  success: false,
                  paymentId,
                  message: result.message,
                  status: 'failed'
                });
              }
            }
          );

        } catch (gatewayError) {
          // Handle gateway errors
          db.run(
            'UPDATE payments SET status = ?, gateway_response = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['failed', JSON.stringify({ error: gatewayError.message }), paymentRecordId]
          );

          res.status(500).json({
            success: false,
            paymentId,
            message: 'Payment gateway error',
            status: 'failed'
          });
        }
      }
    );

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get payment by ID
app.get('/payments/:paymentId', (req, res) => {
  const { paymentId } = req.params;

  db.get('SELECT * FROM payments WHERE payment_id = ?', [paymentId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Parse gateway response
    if (row.gateway_response) {
      try {
        row.gateway_response = JSON.parse(row.gateway_response);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }

    res.json(row);
  });
});

// Get user payments
app.get('/payments/user/:userId', (req, res) => {
  const { userId } = req.params;

  db.all('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Parse gateway responses
    rows.forEach(row => {
      if (row.gateway_response) {
        try {
          row.gateway_response = JSON.parse(row.gateway_response);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }
    });

    res.json(rows);
  });
});

// Refund payment
app.post('/refund/:paymentId', [
  body('reason').optional().isString()
], async (req, res) => {
  const { paymentId } = req.params;
  const { reason = 'Customer request' } = req.body;

  db.get('SELECT * FROM payments WHERE payment_id = ? AND status = "completed"', [paymentId], async (err, payment) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found or not eligible for refund' });
    }

    // Simulate refund processing
    const refundSuccess = Math.random() > 0.1; // 90% success rate
    const refundId = `refund_${uuidv4()}`;

    if (refundSuccess) {
      db.run(
        'UPDATE payments SET status = ?, gateway_response = ?, updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?',
        ['refunded', JSON.stringify({ refundId, reason, refundedAt: new Date().toISOString() }), paymentId],
        async (err) => {
          if (!err) {
            // Update booking payment status
            try {
              await axios.put(`http://localhost:3002/bookings/${payment.booking_id}/payment-status`, {
                paymentStatus: 'refunded'
              });

              // Send refund notification
              await axios.post('http://localhost:3004/send', {
                userId: payment.user_id,
                type: 'payment_refunded',
                bookingId: payment.booking_id,
                paymentId,
                amount: payment.amount,
                message: `Refund of $${payment.amount} has been processed. Reason: ${reason}`
              });

            } catch (notificationError) {
              console.log('Service communication error:', notificationError.message);
            }
          }
        }
      );

      res.json({
        success: true,
        refundId,
        message: 'Refund processed successfully',
        amount: payment.amount
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Refund processing failed'
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`💳 Payment Service running on port ${PORT}`);
});