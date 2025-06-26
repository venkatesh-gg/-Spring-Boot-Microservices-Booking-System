import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(express.json());

// Service discovery simulation
const services = {
  user: 'http://localhost:3001',
  booking: 'http://localhost:3002',
  payment: 'http://localhost:3003',
  notification: 'http://localhost:3004'
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway is running', timestamp: new Date().toISOString() });
});

// Load balancing simulation (round-robin for multiple instances)
let userServiceIndex = 0;
const userServices = ['http://localhost:3001']; // Could have multiple instances

const getUserService = () => {
  const service = userServices[userServiceIndex];
  userServiceIndex = (userServiceIndex + 1) % userServices.length;
  return service;
};

// Proxy middleware with load balancing
app.use('/api/users', createProxyMiddleware({
  target: getUserService(),
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' },
  onError: (err, req, res) => {
    console.error('User service error:', err.message);
    res.status(503).json({ error: 'User service unavailable' });
  }
}));

app.use('/api/bookings', createProxyMiddleware({
  target: services.booking,
  changeOrigin: true,
  pathRewrite: { '^/api/bookings': '' },
  onError: (err, req, res) => {
    console.error('Booking service error:', err.message);
    res.status(503).json({ error: 'Booking service unavailable' });
  }
}));

app.use('/api/payments', createProxyMiddleware({
  target: services.payment,
  changeOrigin: true,
  pathRewrite: { '^/api/payments': '' },
  onError: (err, req, res) => {
    console.error('Payment service error:', err.message);
    res.status(503).json({ error: 'Payment service unavailable' });
  }
}));

app.use('/api/notifications', createProxyMiddleware({
  target: services.notification,
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '' },
  onError: (err, req, res) => {
    console.error('Notification service error:', err.message);
    res.status(503).json({ error: 'Notification service unavailable' });
  }
}));

// Swagger documentation
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Booking System API',
    version: '1.0.0',
    description: 'Microservices-based booking system API'
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Development server' }
  ],
  paths: {
    '/api/users/register': {
      post: {
        tags: ['Users'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                  name: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    '/api/users/login': {
      post: {
        tags: ['Users'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    '/api/bookings': {
      get: {
        tags: ['Bookings'],
        summary: 'Get user bookings'
      },
      post: {
        tags: ['Bookings'],
        summary: 'Create a new booking'
      }
    },
    '/api/payments/process': {
      post: {
        tags: ['Payments'],
        summary: 'Process payment'
      }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Service registry endpoint
app.get('/services', (req, res) => {
  res.json(services);
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});