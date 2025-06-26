import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MapPin, Users, Calendar, CreditCard, ArrowLeft, Hotel, Plane, CalendarDays } from 'lucide-react';

interface Service {
  id: number;
  name: string;
  type: string;
  description: string;
  price: number;
  location: string;
  image_url: string;
  available_slots: number;
}

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  const API_BASE_URL = '/api';

  useEffect(() => {
    if (id) {
      fetchService();
    }
  }, [id]);

  const fetchService = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/bookings/services/${id}`);
      setService(response.data);
    } catch (error) {
      console.error('Error fetching service:', error);
      toast.error('Service not found');
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to make a booking');
      navigate('/login');
      return;
    }

    if (!bookingDate) {
      toast.error('Please select a booking date');
      return;
    }

    setBookingLoading(true);

    try {
      // Create booking
      const bookingResponse = await axios.post(`${API_BASE_URL}/bookings/bookings`, {
        userId: user.id,
        serviceId: service!.id,
        bookingDate,
        guests
      });

      const { bookingId, totalAmount } = bookingResponse.data;

      // Process payment
      const paymentResponse = await axios.post(`${API_BASE_URL}/payments/process`, {
        bookingId,
        userId: user.id,
        amount: totalAmount,
        paymentMethod,
        cardDetails: {
          number: '4242424242424242',
          expiry: '12/25',
          cvc: '123'
        }
      });

      if (paymentResponse.data.success) {
        toast.success('Booking confirmed! Payment processed successfully.');
        navigate('/bookings');
      } else {
        toast.error(`Payment failed: ${paymentResponse.data.message}`);
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Booking failed';
      toast.error(message);
    } finally {
      setBookingLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel':
        return Hotel;
      case 'flight':
        return Plane;
      case 'event':
        return CalendarDays;
      default:
        return Hotel;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hotel':
        return 'bg-blue-100 text-blue-800';
      case 'flight':
        return 'bg-green-100 text-green-800';
      case 'event':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service not found</h2>
          <button
            onClick={() => navigate('/services')}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  const TypeIcon = getTypeIcon(service.type);
  const totalAmount = service.price * guests;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/services')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Services
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Service Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-64 md:h-96">
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(service.type)}`}>
                    <TypeIcon className="h-4 w-4 mr-1" />
                    {service.type.charAt(0).toUpperCase() + service.type.slice(1)}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {service.name}
                </h1>

                <div className="flex items-center text-gray-600 mb-6">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span className="text-lg">{service.location}</span>
                </div>

                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ${service.price}
                    </div>
                    <div className="text-sm text-gray-600">per person</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {service.available_slots}
                    </div>
                    <div className="text-sm text-gray-600">slots available</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Book This Service
              </h2>

              {!user && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    Please <button
                      onClick={() => navigate('/login')}
                      className="text-yellow-900 underline font-medium"
                    >
                      login
                    </button> to make a booking.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {/* Booking Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Booking Date
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={getTomorrowDate()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!user}
                  />
                </div>

                {/* Number of Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="h-4 w-4 inline mr-1" />
                    Number of Guests
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!user}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CreditCard className="h-4 w-4 inline mr-1" />
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!user}
                  >
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="square">Square</option>
                  </select>
                </div>

                {/* Total Amount */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Price per person:</span>
                    <span className="font-medium">${service.price}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Guests:</span>
                    <span className="font-medium">{guests}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">${totalAmount}</span>
                  </div>
                </div>

                {/* Book Button */}
                <button
                  onClick={handleBooking}
                  disabled={!user || bookingLoading || !bookingDate}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {bookingLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `Book Now - $${totalAmount}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;