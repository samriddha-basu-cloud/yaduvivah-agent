// src/pages/Login.js
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithPhone, verifyLoginOTP } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (step === 1) {
        if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
          throw new Error('Please enter a valid 10-digit Indian mobile number');
        }
        await loginWithPhone(phoneNumber);
        setStep(2);
      } else {
        if (otp.length !== 6) {
          throw new Error('Please enter a valid 6-digit OTP');
        }
        await verifyLoginOTP(otp);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-center mb-6">
        {step === 1 ? 'Agent Login' : 'Verify OTP'}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 ? (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                +91
              </span>
              <input
                type="tel"
                required
                placeholder="10-digit mobile number"
                className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhoneNumber(value);
                }}
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Enter OTP
            </label>
            <input
              type="text"
              required
              maxLength="6"
              placeholder="Enter 6-digit OTP"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(value);
              }}
            />
          </div>
        )}

        <div id="recaptcha-container"></div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Please wait...' : step === 1 ? 'Login' : 'Verify OTP'}
        </button>
      </form>
    </div>
  );
}