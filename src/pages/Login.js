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
      if (error.message.includes('reCAPTCHA client element has been removed')) {
        setError('Please try to login again in 2 seconds.');
      } else {
        setError(error.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // Added flex container div to center the content
    <div className="flex items-center justify-center w-full">
      <div className="max-w-md w-full mx-auto px-4">  {/* Added mx-auto and padding */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              {step === 1 ? 'Welcome Back' : 'Verify Your Number'}
            </h2>
            <p className="mt-2 text-gray-600">
              {step === 1 
                ? 'Sign in to your agent account' 
                : 'Enter the OTP sent to your phone'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              // Phone Number Input
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-gray-500 sm:text-sm">+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="Enter your mobile number"
                    className="block w-full pl-16 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhoneNumber(value);
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  We'll send you a verification code
                </p>
              </div>
            ) : (
              // OTP Input
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  placeholder="Enter 6-digit OTP"
                  className="block w-full px-4 py-3 text-center text-lg tracking-widest border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                  }}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    Didn't receive the code?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp('');
                    }}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}

            <div id="recaptcha-container" className="mt-4"></div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-500 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Please wait...
                </span>
              ) : (
                step === 1 ? 'Continue' : 'Verify & Login'
              )}
            </button>

            {/* Additional Info */}
            <p className="text-center text-sm text-gray-500 mt-4">
              {step === 1 
                ? (
                  <>
                    Don't have an account? 
                    <a href="mailto:help@yaduvivah.com?subject=Help%20with%20agent%20side&body=Hi%20I%20am%20looking%20for%20agent%20login%20my%20name%20is%20..." target='_blank' rel="noopener noreferrer" className="text-orange-500 hover:text-orange-700">
                      Contact your supervisor
                    </a>
                  </>
                ) 
                : 'By continuing, you agree to our Terms of Service'}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}