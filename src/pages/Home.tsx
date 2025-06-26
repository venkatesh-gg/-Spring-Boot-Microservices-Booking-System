import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plane, Hotel, Calendar, CreditCard, Bell, Shield } from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Hotel,
      title: 'Hotels & Resorts',
      description: 'Book luxury accommodations worldwide with instant confirmation'
    },
    {
      icon: Plane,
      title: 'Flights',
      description: 'Find and book flights to your dream destinations'
    },
    {
      icon: Calendar,
      title: 'Events',
      description: 'Discover and book tickets for concerts, conferences, and more'
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Multiple payment options with bank-level security'
    },
    {
      icon: Bell,
      title: 'Instant Notifications',
      description: 'Get real-time updates on your bookings and payments'
    },
    {
      icon: Shield,
      title: 'Trusted Platform',
      description: '24/7 customer support and money-back guarantee'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Your Journey Starts Here
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Book hotels, flights, and events with our secure microservices platform. 
              Experience seamless booking with instant confirmations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/services"
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Explore Services
              </Link>
              {!user && (
                <Link
                  to="/register"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose BookingHub?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with modern microservices architecture for reliability, security, and performance
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow group"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-700 transition-colors">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">10K+</div>
              <div className="text-gray-300">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">50+</div>
              <div className="text-gray-300">Destinations</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">99.9%</div>
              <div className="text-gray-300">Uptime</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">24/7</div>
              <div className="text-gray-300">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-20 bg-blue-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of travelers who trust BookingHub for their adventures
            </p>
            <Link
              to="/register"
              className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Create Your Account
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;