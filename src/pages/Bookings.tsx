import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, CreditCard, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Booking {
  id: number;
  service_id: number;
  booking_date: string;
  guests: number;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  service_name: string;
  service_type: string;
  location: string;
  image_url: string;
}

const Bookings: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = '/api';

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bookings/bookings/user/${user!.id}`);
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Bookings
          </h1>
          <p className="text-gray-600">
            Manage and track all your bookings in one place
          </p>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No bookings yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start exploring our services and make your first booking!
            </p>
            <a
              href="/services"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Browse Services
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="md:flex">
                  {/* Image */}
                  <div className="md:w-48 h-48 md:h-auto">
                    <img
                      src={booking.image_url}
                      alt={booking.service_name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-xl font-semibold text-gray-900 mr-3">
                            {booking.service_name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-1 capitalize">{booking.status}</span>
                          </span>
                        </div>

                        <div className="flex items-center text-gray-600 mb-3">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">{booking.location}</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            <div>
                              <div className="font-medium">Booking Date</div>
                              <div>{format(new Date(booking.booking_date), 'MMM dd, yyyy')}</div>
                            </div>
                          </div>

                          <div className="flex items-center text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            <div>
                              <div className="font-medium">Guests</div>
                              <div>{booking.guests}</div>
                            </div>
                          </div>

                          <div className="flex items-center text-gray-600">
                            <CreditCard className="h-4 w-4 mr-2" />
                            <div>
                              <div className="font-medium">Total Amount</div>
                              <div className="text-blue-600 font-semibold">${booking.total_amount}</div>
                            </div>
                          </div>

                          <div className="flex items-center text-gray-600">
                            <div>
                              <div className="font-medium">Payment Status</div>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                                {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 md:mt-0 md:ml-6 text-right">
                        <div className="text-sm text-gray-500 mb-2">
                          Booked on {format(new Date(booking.created_at), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          #{booking.id}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;