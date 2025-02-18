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
  
        if (parseInt(formData.experience, 10) >= parseInt(formData.age, 10)) {
          throw new Error('Experience should be less than age');
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
<div className="min-h-screen bg-gradient-to-br from-orange-50 to-indigo-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* Auth Toggle */}
        <div className="mb-8 bg-white rounded-xl p-1 shadow-sm w-fit mx-auto">
          <div className="flex space-x-1">
            <button
              onClick={() => setIsLogin(false)}
              className={`px-8 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                !isLogin
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => setIsLogin(true)}
              className={`px-8 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                isLogin
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Login
            </button>
          </div>
        </div>

        {isLogin ? (
          <Login />
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
              {step === 1 ? 'Join as an Agent' : 'Verify Your Number'}
            </h2>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {step === 1 ? (
                <>
                  {/* Display Picture Section */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      {formData.displayPicture ? (
                        <img
                          src={URL.createObjectURL(formData.displayPicture)}
                          alt="Preview"
                          className="h-32 w-32 rounded-full object-cover ring-4 ring-orange-50"
                        />
                      ) : (
                        <div className="h-32 w-32 rounded-full bg-orange-50 flex items-center justify-center">
                          <span className="text-orange-500 text-4xl">+</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => handleImageUpload(e, 'displayPicture')}
                      className="hidden"
                      id="displayPicture"
                    />
                    <label
                      htmlFor="displayPicture"
                      className="inline-flex items-center px-4 py-2 border border-orange-200 rounded-lg text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 cursor-pointer transition-colors duration-200"
                    >
                      Upload Profile Picture
                    </label>
                  </div>

                  {/* Personal Information Section */}
                  <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Personal Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Enter your full name"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                          value={formData.name}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^[A-Za-z\s]+$/.test(value)) {
                              setFormData({...formData, name: value});
                            }
                          }}
                        />
                      </div>

                      {/* Phone Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                            +91
                          </span>
                          <input
                            type="tel"
                            required
                            placeholder="10-digit mobile number"
                            className="flex-1 px-4 py-2.5 rounded-r-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            value={formData.phoneNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setFormData({...formData, phoneNumber: value});
                            }}
                          />
                        </div>
                      </div>

                      {/* Email Input */} 
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="your.email@example.com"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>

                      {/* DOB and Age */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                         Date of Birth
                        </label>
                        <input
                          type="date"
                          required
                          max={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                          value={formData.dob}
                          onChange={handleDOBChange}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Age
                        </label>
                        <input
                          type="text"
                          readOnly
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                          value={formData.age}
                        />
                      </div>

                      {/* Experience */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Experience (years)
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="50"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                          value={formData.experience}
                          onChange={(e) => setFormData({...formData, experience: e.target.value})}
                        />
                      </div>
                    </div>  

                    </div>

              <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Address</h3>
                {/* Address */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      required
                      maxLength="6"
                      placeholder="Enter 6-digit pincode"
                      // className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Region
                      </label>
                      <input
                        type="text"
                        readOnly
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                        value={formData.region}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        District
                      </label>
                      <input
                        type="text"
                        readOnly
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                        value={formData.district}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        readOnly
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                        value={formData.state}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="House/Flat No, Street, Locality"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      value={formData.addressLine1}
                      onChange={(e) => setFormData({...formData, addressLine1: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Landmark, Area (Optional)"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      value={formData.addressLine2}
                      onChange={(e) => setFormData({...formData, addressLine2: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Aadhaar Verification</h3>
                {/* Aadhaar Images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aadhaar Front
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => handleImageUpload(e, 'aadharFront')}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                   <label
                            htmlFor="aadharFront"
                            className="block w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-orange-500 transition-colors duration-200 mt-4"
                          >
                            {formData.aadharFront ? (
                              <img
                                src={URL.createObjectURL(formData.aadharFront)}
                                alt="Aadhaar Front"
                                className="mt-2 max-h-32 mx-auto rounded-lg"
                              />
                            ) : (
                              <span className="text-gray-500">Preview</span>
                            )}
                          </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aadhaar Back
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => handleImageUpload(e, 'aadharBack')}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                    <label
                            htmlFor="aadharBack"
                            className="block w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-orange-500 transition-colors duration-200 mt-4"
                          >
                            {formData.aadharBack ? (
                              <img
                                src={URL.createObjectURL(formData.aadharBack)}
                                alt="Aadhaar Back"
                                className="mt-2 max-h-32 mx-auto rounded-lg"
                              />
                            ) : (
                              <span className="text-gray-500">Preview</span>
                            )}
                          </label>
                  </div>
                  </div>
                  
                </div>

              </>
           ) : (
                // OTP Verification Step
                <div className="max-w-md mx-auto">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength="6"
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-4 py-3 text-center text-lg tracking-widest rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(value);
                      }}
                    />
                  </div>
                </div>
              )}

              <div id="recaptcha-container"></div>

              {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
                <p className="text-sm">{error}</p>
              </div>
            )}

              <button
                type="submit"
                disabled={loading || pincodeLoading}
                className="w-full bg-orange-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-500 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : 
                 pincodeLoading ? 'Fetching address...' : 
                 (step === 1 ? 'Continue Registration' : 'Verify & Complete')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}