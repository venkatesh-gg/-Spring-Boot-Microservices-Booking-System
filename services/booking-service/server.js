import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./bookings.db');

// Initialize database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    available_slots INTEGER DEFAULT 100,
    location TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    booking_date DATE NOT NULL,
    guests INTEGER DEFAULT 1,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services (id)
  )`);

  // Insert sample services
  const sampleServices = [
    {
      name: 'Luxury Beach Resort',
      type: 'hotel',
      description: 'Beautiful beachfront resort with stunning ocean views',
      price: 299.99,
      location: 'Maldives',
      image_url: 'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg'
    },
    {
      name: 'Mountain Cabin Retreat',
      type: 'hotel',
      description: 'Cozy cabin in the mountains perfect for relaxation',
      price: 149.99,
      location: 'Colorado',
      image_url: 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'
    },
    {
      name: 'Flight to Paris',
      type: 'flight',
      description: 'Direct flight to the city of lights',
      price: 599.99,
      location: 'Paris, France',
      image_url: 'https://images.pexels.com/photos/358319/pexels-photo-358319.jpeg'
    },
    {
      name: 'Tech Conference 2024',
      type: 'event',
      description: 'Annual technology conference with industry leaders',
      price: 199.99,
      location: 'San Francisco',
      image_url: 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg'
    },
    {
      name: 'Music Festival Weekend',
      type: 'event',
      description: 'Three-day music festival featuring top artists',
      price: 249.99,
      location: 'Austin, Texas',
      image_url: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg'
    },
    {
      name: 'Tokyo Adventure',
      type: 'flight',
      description: 'Experience the vibrant culture of Tokyo',
      price: 899.99,
      location: 'Tokyo, Japan',
      image_url: 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg'
    }
  ];

  db.get('SELECT COUNT(*) as count FROM services', (err, row) => {
    if (!err && row.count === 0) {
      const stmt = db.prepare('INSERT INTO services (name, type, description, price, location, image_url) VALUES (?, ?, ?, ?, ?, ?)');
      sampleServices.forEach(service => {
        stmt.run(service.name, service.type, service.description, service.price, service.location, service.image_url);
      });
      stmt.finalize();
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Booking Service is running', timestamp: new Date().toISOString() });
});

// Get all services with filtering
app.get('/services', (req, res) => {
  const { type, location, minPrice, maxPrice } = req.query;
  let query = 'SELECT * FROM services WHERE 1=1';
  const params = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (location) {
    query += ' AND location LIKE ?';
    params.push(`%${location}%`);
  }
  if (minPrice) {
    query += ' AND price >= ?';
    params.push(parseFloat(minPrice));
  }
  if (maxPrice) {
    query += ' AND price <= ?';
    params.push(parseFloat(maxPrice));
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get service by ID
app.get('/services/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM services WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json(row);
  });
});

// Create booking
app.post('/bookings', [
  body('userId').isInt({ min: 1 }),
  body('serviceId').isInt({ min: 1 }),
  body('bookingDate').isISO8601(),
  body('guests').optional().isInt({ min: 1, max: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, serviceId, bookingDate, guests = 1 } = req.body;

    // Check service availability
    db.get('SELECT * FROM services WHERE id = ?', [serviceId], (err, service) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      if (service.available_slots < guests) {
        return res.status(400).json({ error: 'Not enough available slots' });
      }

      const totalAmount = service.price * guests;

      // Create booking
      db.run(
        'INSERT INTO bookings (user_id, service_id, booking_date, guests, total_amount) VALUES (?, ?, ?, ?, ?)',
        [userId, serviceId, bookingDate, guests, totalAmount],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create booking' });
          }

          // Update available slots
          db.run('UPDATE services SET available_slots = available_slots - ? WHERE id = ?', 
            [guests, serviceId]);

          // Send notification
          axios.post('http://localhost:3004/send', {
            userId,
            type: 'booking_created',
            bookingId: this.lastID,
            message: `Your booking for ${service.name} has been created successfully.`
          }).catch(err => console.log('Notification service error:', err.message));

          res.status(201).json({
            message: 'Booking created successfully',
            bookingId: this.lastID,
            totalAmount
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user bookings
app.get('/bookings/user/:userId', (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT b.*, s.name as service_name, s.type as service_type, s.location, s.image_url
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get booking by ID
app.get('/bookings/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT b.*, s.name as service_name, s.type as service_type, s.location, s.image_url
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.id = ?
  `;

  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(row);
  });
});

// Update booking status
app.put('/bookings/:id/status', [
  body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { status } = req.body;

  db.run(
    'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update booking' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      res.json({ message: 'Booking status updated successfully' });
    }
  );
});

// Update payment status
app.put('/bookings/:id/payment-status', [
  body('paymentStatus').isIn(['pending', 'completed', 'failed', 'refunded'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { paymentStatus } = req.body;

  db.run(
    'UPDATE bookings SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [paymentStatus, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update payment status' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      res.json({ message: 'Payment status updated successfully' });
    }
  );
});

app.listen(PORT, () => {
  console.log(`🏨 Booking Service running on port ${PORT}`);
});