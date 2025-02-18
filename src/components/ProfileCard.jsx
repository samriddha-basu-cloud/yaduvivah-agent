import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { ClipboardCopy, Camera } from 'lucide-react';
import domtoimage from 'dom-to-image';

const generateReferenceCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array(8)
    .fill()
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
};

const ProfileCard = ({ agentData, currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(agentData);
  const [locationData, setLocationData] = useState({
    district: agentData.district || '',
    region: agentData.region || '',
    state: agentData.state || ''
  });
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!formData.referenceCode) {
      const newCode = generateReferenceCode();
      setFormData(prev => ({ ...prev, referenceCode: newCode }));
      updateAgentReferenceCode(newCode);
    }
  }, []);

  const updateAgentReferenceCode = async (code) => {
    try {
      const docRef = doc(db, "agents", currentUser.uid);
      await updateDoc(docRef, { referenceCode: code });
    } catch (error) {
      console.error("Error updating reference code:", error);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Check file size (e.g., limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      // Create the storage reference
      const storageRef = ref(storage, `display-pictures/${currentUser.uid}/${file.name}`);
      
      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update the form data
      setFormData(prev => ({
        ...prev,
        displayPictureUrl: downloadURL
      }));

      // Update in Firestore
      const docRef = doc(db, "agents", currentUser.uid);
      await updateDoc(docRef, {
        displayPictureUrl: downloadURL
      });

    } catch (error) {
      console.error("Error uploading photo:", error);
      alert('Failed to upload photo. Please try again.');
    }
    setUploadingPhoto(false);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    try {
      // Handle Firestore Timestamp
      if (dateValue.toDate) {
        return dateValue.toDate().toLocaleDateString();
      }
      // Handle string or Date object
      return new Date(dateValue).toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid Date';
    }
  };


  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handlePincodeChange = async (pincode) => {
    if (pincode.length === 6) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();
        if (data[0].Status === "Success") {
          const postOffice = data[0].PostOffice[0];
          setLocationData({
            district: postOffice.District,
            region: postOffice.Division,
            state: postOffice.State
          });
          setFormData(prev => ({
            ...prev,
            district: postOffice.District,
            region: postOffice.Division,
            state: postOffice.State
          }));
        }
      } catch (error) {
        console.error("Error fetching location data:", error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'name') {
      // Check if name contains numbers
      if (/\d/.test(value)) {
        setNameError('Name should not contain numbers');
        return;
      } else {
        setNameError('');
      }
    }

    if (name === 'pincode') {
      handlePincodeChange(value);
    }
    if (name === 'experience') {
      const age = calculateAge(formData.dob);
      if (parseInt(value) >= age) {
        return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "agents", currentUser.uid);
      await updateDoc(docRef, formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };


  return (
  <div className="w-full max-w-4xl mx-auto bg-white rounded-xl overflow-hidden shadow-xl">
    {/* Header */}
    <div className="relative bg-gradient-to-r from-orange-400 to-orange-600 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Agent Profile</h2>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const profileCard = document.querySelector('.profile-card');
              if (profileCard) {
                // First, temporarily remove any fixed/sticky positioning
                const originalStyles = new Map();
                const elements = profileCard.querySelectorAll('*');
                elements.forEach(el => {
                  const position = window.getComputedStyle(el).position;
                  if (position === 'fixed' || position === 'sticky') {
                    originalStyles.set(el, position);
                    el.style.position = 'static';
                  }
                });

                // Create canvas
                const tempCanvas = document.createElement('canvas');
                const context = tempCanvas.getContext('2d');
                tempCanvas.width = profileCard.offsetWidth;
                tempCanvas.height = profileCard.offsetHeight;

                // Draw white background
                context.fillStyle = '#FFFFFF';
                context.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                // Convert to image
                domtoimage.toPng(profileCard)
                  .then((dataUrl) => {
                    const link = document.createElement('a');
                    link.download = `profile-${formData.name || 'agent'}.png`;
                    link.href = dataUrl;
                    link.click();

                    // Restore original positioning
                    originalStyles.forEach((position, element) => {
                      element.style.position = position;
                    });
                  })
                  .catch(error => {
                    console.error('Error generating image:', error);
                    alert('Failed to generate image. Please try again.');
                    
                    // Restore original positioning
                    originalStyles.forEach((position, element) => {
                      element.style.position = position;
                    });
                  });
              }
            }}
            className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200"
            title="Download Profile Image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-white text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition-all duration-200"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-white text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition-all duration-200 disabled:opacity-70"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setFormData(agentData);
                  setIsEditing(false);
                }}
                className="px-4 py-2 bg-orange-700 text-white rounded-lg font-medium hover:bg-orange-800 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    <div className="p-6 space-y-6">
      {/* Profile Header with Image */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="relative group">
          <div className="w-32 h-32 rounded-xl overflow-hidden shadow-md">
            <img
              src={formData.displayPictureUrl || '/placeholder-profile.jpg'}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          {isEditing && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/*"
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-2 right-2 p-2 bg-orange-500 rounded-full text-white hover:bg-orange-600 transition-colors shadow-md group-hover:opacity-100 opacity-90"
              >
                {uploadingPhoto ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                ) : (
                  <Camera size={16} />
                )}
              </button>
            </>
          )}
        </div>
        
        <div className="flex-1 space-y-4">
          <div>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 text-lg font-medium rounded-lg border ${
                    nameError ? 'border-red-500 bg-red-50' : 'border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  placeholder="Enter your name"
                />
                {nameError && (
                  <p className="mt-1 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-md">
                    {nameError}
                  </p>
                )}
              </div>
            ) : (
              <h3 className="text-xl font-medium text-gray-800">{formData.name}</h3>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">Created:</span>
              <span className="font-medium text-gray-800">{formatDate(formData.createdAt)}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">Reference:</span>
              <div className="flex items-center bg-orange-50 px-3 py-1 rounded-lg">
                <span className="text-sm text-orange-700 font-medium">{formData.referenceCode}</span>
                <button
                  onClick={() => copyToClipboard(formData.referenceCode)}
                  className="ml-2 text-orange-600 hover:text-orange-800"
                >
                  <ClipboardCopy size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Personal Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg transition-all hover:bg-gray-100">
          <div className="text-sm text-gray-600 mb-1">Phone Number</div>
          <div className="font-medium text-gray-800">{formData.phoneNumber}</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg transition-all hover:bg-gray-100">
          <div className="text-sm text-gray-600 mb-1">Email</div>
          <div className="font-medium text-gray-800">{formData.email}</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg transition-all hover:bg-gray-100">
          <div className="text-sm text-gray-600 mb-1">Age</div>
          <div className="font-medium text-gray-800">{calculateAge(formData.dob)} years</div>
        </div>
      </div>

      {/* Experience & Birth Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Experience</div>
          {isEditing ? (
            <input
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          ) : (
            <div className="font-medium text-gray-800">{formData.experience} years</div>
          )}
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Date of Birth</div>
          {isEditing ? (
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          ) : (
            <div className="font-medium text-gray-800">{new Date(formData.dob).toLocaleDateString()}</div>
          )}
        </div>
      </div>

      {/* Location Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Pincode</div>
            {isEditing ? (
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                maxLength={6}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            ) : (
              <div className="font-medium text-gray-800">{formData.pincode}</div>
            )}
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">District</div>
            <div className="font-medium text-gray-800">{locationData.district || 'N/A'}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Region</div>
            <div className="font-medium text-gray-800">{locationData.region || 'N/A'}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">State</div>
            <div className="font-medium text-gray-800">{locationData.state || 'N/A'}</div>
          </div>
        </div>

        {/* Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Address Line 1</div>
            {isEditing ? (
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            ) : (
              <div className="font-medium text-gray-800">{formData.addressLine1}</div>
            )}
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Address Line 2</div>
            {isEditing ? (
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            ) : (
              <div className="font-medium text-gray-800">{formData.addressLine2}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default ProfileCard;