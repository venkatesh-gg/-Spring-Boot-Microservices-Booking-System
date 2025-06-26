# Microservices Booking System

A comprehensive booking system built with Node.js microservices architecture, featuring user management, booking services, payment processing, and notifications.

## 🏗️ Architecture

This system follows microservices architecture with the following services:

- **API Gateway** (Port 3000) - Routes requests and handles load balancing
- **User Service** (Port 3001) - Authentication and user management
- **Booking Service** (Port 3002) - Manages bookings for hotels, flights, and events
- **Payment Service** (Port 3003) - Processes payments with multiple gateways
- **Notification Service** (Port 3004) - Sends email notifications
- **React Frontend** (Port 5173) - Modern web interface

## 🚀 Features

### Core Features
- ✅ User registration and JWT authentication
- ✅ Service discovery and API gateway routing
- ✅ Hotel, flight, and event booking system
- ✅ Multiple payment gateway simulation (Stripe, PayPal, Square)
- ✅ Real-time email notifications
- ✅ Booking history and management
- ✅ Responsive React frontend

### Technical Features
- ✅ Microservices communication via REST APIs
- ✅ Load balancing simulation
- ✅ Service failure handling
- ✅ SQLite databases for each service
- ✅ Docker containerization
- ✅ Swagger API documentation
- ✅ Input validation and error handling
- ✅ Security best practices

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **SQLite** databases
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Axios** for inter-service communication

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for form handling
- **React Hot Toast** for notifications

### DevOps
- **Docker** and Docker Compose
- **Nginx** for frontend serving
- **Concurrently** for development

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker (optional)

### Development Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd microservices-booking-system
npm install
```

2. **Install service dependencies:**
```bash
npm run setup:services
```

3. **Start all services:**
```bash
npm run dev
```

This will start:
- API Gateway: http://localhost:3000
- User Service: http://localhost:3001
- Booking Service: http://localhost:3002
- Payment Service: http://localhost:3003
- Notification Service: http://localhost:3004
- React Frontend: http://localhost:5173

### Docker Setup

1. **Build and run with Docker Compose:**
```bash
docker-compose up --build
```

2. **Access the application:**
- Frontend: http://localhost
- API Gateway: http://localhost:3000
- API Documentation: http://localhost:3000/api-docs

## 📚 API Documentation

### API Gateway Endpoints
- `GET /health` - Health check
- `GET /services` - Service registry
- `GET /api-docs` - Swagger documentation

### User Service
- `POST /api/users/register` - Register user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Booking Service
- `GET /api/bookings/services` - Get all services
- `GET /api/bookings/services/:id` - Get service by ID
- `POST /api/bookings/bookings` - Create booking
- `GET /api/bookings/bookings/user/:userId` - Get user bookings

### Payment Service
- `GET /api/payments/methods` - Get payment methods
- `POST /api/payments/process` - Process payment
- `GET /api/payments/payments/:paymentId` - Get payment details
- `POST /api/payments/refund/:paymentId` - Process refund

### Notification Service
- `POST /api/notifications/send` - Send notification
- `GET /api/notifications/notifications/user/:userId` - Get user notifications

## 🔧 Configuration

### Environment Variables

Create `.env` files for each service:

**User Service:**
```env
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
```

**Other Services:**
```env
NODE_ENV=development
PORT=<service-port>
```

## 🧪 Testing

### Demo Credentials
- Email: `demo@example.com`
- Password: `demo123`

### Sample Services
The system comes pre-loaded with sample services:
- Luxury Beach Resort (Hotel)
- Mountain Cabin Retreat (Hotel)
- Flight to Paris (Flight)
- Tech Conference 2024 (Event)
- Music Festival Weekend (Event)
- Tokyo Adventure (Flight)

## 🏗️ Microservices Communication

```
Frontend (React) 
    ↓
API Gateway (Port 3000)
    ↓
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   User Service  │ Booking Service │ Payment Service │Notification Svc │
│   (Port 3001)   │   (Port 3002)   │   (Port 3003)   │   (Port 3004)   │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Helmet.js security headers
- SQL injection prevention

## 📊 Database Schema

### User Service (SQLite)
```sql
users (id, email, password, name, created_at, updated_at)
```

### Booking Service (SQLite)
```sql
services (id, name, type, description, price, available_slots, location, image_url, created_at)
bookings (id, user_id, service_id, booking_date, guests, total_amount, status, payment_status, created_at, updated_at)
```

### Payment Service (SQLite)
```sql
payments (id, payment_id, booking_id, user_id, amount, currency, payment_method, status, gateway_response, transaction_id, created_at, updated_at)
```

### Notification Service (SQLite)
```sql
notifications (id, user_id, type, subject, message, booking_id, payment_id, status, sent_at, read_at)
```

## 🚀 Deployment

### Production Deployment

1. **Build for production:**
```bash
npm run build
```

2. **Deploy with Docker:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Scaling Services

To scale individual services:
```bash
docker-compose up --scale user-service=3 --scale booking-service=2
```

## 🔍 Monitoring & Logging

- Health check endpoints for all services
- Structured logging with timestamps
- Error tracking and handling
- Service status monitoring via API Gateway

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation at `/api-docs`
- Review the service logs
- Ensure all services are running and healthy