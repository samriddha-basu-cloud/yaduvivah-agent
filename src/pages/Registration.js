// src/pages/Registration.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Login } from './Login';

export default function Registration() {
  const [isLogin, setIsLogin] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    dob: '',
    age: '',
    pincode: '',
    region: '',
    district: '',
    state: '',
    addressLine1: '',
    addressLine2: '',
    experience: '',
    displayPicture: null,
    aadharFront: null,
    aadharBack: null
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const { registerAgent, verifyOTP } = useAuth();
  const navigate = useNavigate();

  // Name validation - only alphabets and spaces
  const validateName = (name) => {
    const nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(name);
  };

  // Phone validation - only digits
  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Calculate age from DOB
  const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Handle DOB change
  const handleDOBChange = (e) => {
    const dob = e.target.value;
    const age = calculateAge(dob);
    setFormData(prev => ({
      ...prev,
      dob,
      age: age.toString()
    }));
  };

  // Fetch address details from pincode
  const fetchAddressDetails = async (pincode) => {
    if (pincode.length === 6) {
      setPincodeLoading(true);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();
        
        if (data[0].Status === "Success") {
          const postOffice = data[0].PostOffice[0];
          setFormData(prev => ({
            ...prev,
            region: postOffice.Region,
            district: postOffice.District,
            state: postOffice.State
          }));
        } else {
          throw new Error('Invalid pincode');
        }
      } catch (error) {
        setError('Invalid pincode. Please enter a valid pincode.');
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  // Handle image upload
  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5242880) { // 5MB limit
        setError(`${field} image should be less than 5MB`);
        return;
      }
      setFormData(prev => ({
        ...prev,
        [field]: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (step === 1) {
        // Validate all fields
        if (!validateName(formData.name)) {
          throw new Error('Name should contain only alphabets and spaces');
        }

        if (!validatePhone(formData.phoneNumber)) {
          throw new Error('Please enter a valid 10-digit Indian mobile number');
        }

        if (!validateEmail(formData.email)) {
          throw new Error('Please enter a valid email address');
        }

        if (!formData.displayPicture) {
          throw new Error('Please upload your display picture');
        }

        if (!formData.aadharFront || !formData.aadharBack) {
          throw new Error('Please upload both sides of your Aadhaar card');
        }

        if (!formData.pincode || !formData.addressLine1) {
          throw new Error('Please enter your complete address');
        }

        const formDataWithoutFiles = {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        dob: formData.dob,
        age: formData.age,
        pincode: formData.pincode,
        region: formData.region,
        district: formData.district,
        state: formData.state,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        experience: formData.experience
      };

      // Pass files separately
      const files = {
        displayPicture: formData.displayPicture,
        aadharFront: formData.aadharFront,
        aadharBack: formData.aadharBack
      };

      await registerAgent(formData.phoneNumber, formDataWithoutFiles);
      // Store files in component state for later use
      window.registrationFiles = files;
      setStep(2);
    } else {
      if (otp.length !== 6) {
        throw new Error('Please enter a valid 6-digit OTP');
      }
      
      // Get files from component state
      const files = window.registrationFiles;
      await verifyOTP(otp, formData, files);
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Toggle buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setIsLogin(false)}
            className={`px-6 py-2 text-sm font-medium rounded-md ${
              !isLogin
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => setIsLogin(true)}
            className={`px-6 py-2 text-sm font-medium rounded-md ${
              isLogin
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Login
          </button>

      </div>

        {isLogin ? (
          <Login />
        ) 
        : 
        (
          <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-center mb-6">
            {step === 1 ? 'Agent Registration' : 'Verify OTP'}
          </h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
                {/* Display Picture */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Display Picture
                  </label>
                  <div className="mt-1 flex items-center space-x-4">
                    {formData.displayPicture && (
                      <img
                        src={URL.createObjectURL(formData.displayPicture)}
                        alt="Preview"
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => handleImageUpload(e, 'displayPicture')}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^[A-Za-z\s]+$/.test(value)) {
                        setFormData({...formData, name: value});
                      }
                    }}
                  />
                </div>

                {/* Phone Number */}
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
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({...formData, phoneNumber: value});
                      }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="your.email@example.com"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                {/* DOB and Age */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      required
                      max={new Date().toISOString().split('T')[0]}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={formData.dob}
                      onChange={handleDOBChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Age
                    </label>
                    <input
                      type="text"
                      readOnly
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                      value={formData.age}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Pincode
                    </label>
                    <input
                      type="text"
                      required
                      maxLength="6"
                      placeholder="Enter 6-digit pincode"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={formData.pincode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setFormData({...formData, pincode: value});
                        if (value.length === 6) {
                          fetchAddressDetails(value);
                        }
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Region
                      </label>
                      <input
                        type="text"
                        readOnly
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                        value={formData.region}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        District
                      </label>
                      <input
                        type="text"
                        readOnly
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                        value={formData.district}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        State
                      </label>
                      <input
                        type="text"
                        readOnly
                        className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                        value={formData.state}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="House/Flat No, Street, Locality"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={formData.addressLine1}
                      onChange={(e) => setFormData({...formData, addressLine1: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Landmark, Area (Optional)"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={formData.addressLine2}
                      onChange={(e) => setFormData({...formData, addressLine2: e.target.value})}
                    />
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Experience (years)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="50"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  />
                </div>

                {/* Aadhaar Images */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Aadhaar Front
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => handleImageUpload(e, 'aadharFront')}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {formData.aadharFront && (
                      <img
                        src={URL.createObjectURL(formData.aadharFront)}
                        alt="Aadhaar Front"
                        className="mt-2 h-32 w-auto"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Aadhaar Back
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => handleImageUpload(e, 'aadharBack')}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {formData.aadharBack && (
                      <img
                        src={URL.createObjectURL(formData.aadharBack)}
                        alt="Aadhaar Back"
                        className="mt-2 h-32 w-auto"
                      />
                    )}
                  </div>
                </div>
              </>
            ) : (
              // OTP Verification Step
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
              disabled={loading || pincodeLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                (loading || pincodeLoading) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Please wait...' : 
               pincodeLoading ? 'Fetching address...' : 
               (step === 1 ? 'Register' : 'Verify OTP')}
            </button>
          </form>
          
        </div>
        )}
      </div>
              
     </div>
     
  );
}


