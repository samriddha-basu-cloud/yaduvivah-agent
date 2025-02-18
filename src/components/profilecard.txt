import React, { useState, useEffect, useCallback } from 'react';
import { 
  Copy, 
  Check, 
  Edit2, 
  X, 
  Save,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Building,
  Map,
  Globe,
  Home,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

const generateReferenceCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array(8)
    .fill()
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
};

const EditableField = ({ 
  value, 
  onChange, 
  isEditing, 
  fieldName, 
  disabled, 
  icon: Icon, 
  type = "text",
  error,
  onBlur
}) => (
  <div className="relative">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-orange-500" />}
      {fieldName === 'dob' && isEditing && !disabled ? (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(fieldName, e.target.value)}
          onBlur={onBlur}
          disabled={!isEditing || disabled}
          max={new Date().toISOString().split('T')[0]}
          className={`w-full p-2 rounded ${
            isEditing && !disabled
              ? 'border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200'
              : 'bg-transparent border-none'
          } ${error ? 'border-red-500' : ''}`}
        />
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(fieldName, e.target.value)}
          onBlur={onBlur}
          disabled={!isEditing || disabled}
          className={`w-full p-2 rounded ${
            isEditing && !disabled
              ? 'border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200'
              : 'bg-transparent border-none'
          } ${error ? 'border-red-500' : ''}`}
        />
      )}
    </div>
    {error && (
      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

const ProfileCard = ({ agentData, currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(agentData);
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const initializeReferenceCode = async () => {
      if (!agentData.referenceCode) {
        const newReferenceCode = generateReferenceCode();
        try {
          const docRef = doc(db, "agents", currentUser.uid);
          await updateDoc(docRef, { referenceCode: newReferenceCode });
          setEditedData(prev => ({ ...prev, referenceCode: newReferenceCode }));
        } catch (error) {
          console.error("Error generating reference code:", error);
        }
      }
    };

    initializeReferenceCode();
  }, [agentData.referenceCode, currentUser.uid]);

  const validateFields = () => {
    const newErrors = {};
    
    if (/\d/.test(editedData.name)) {
      newErrors.name = 'Name cannot contain numbers';
    }

    if (!/^\d{6}$/.test(editedData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    if (!/^\d+$/.test(editedData.experience)) {
      newErrors.experience = 'Experience must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Validation functions
  const validatePincode = useCallback((pincode) => {
    return /^\d{6}$/.test(pincode);
  }, []);

  const validateExperience = useCallback((experience, age) => {
    if (!experience) return true;
    const numExperience = Number(experience);
    return /^\d+$/.test(experience) && (!age || numExperience <= age);
  }, []);

  // Field change handler
  const handleFieldChange = useCallback((field, value) => {
    if (field === 'dob') {
      const age = calculateAge(value);
      setEditedData(prev => ({
        ...prev,
        dob: value,
        age: age
      }));
    } else {
      setEditedData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  }, []);

  // Blur handlers for validation
  const handlePincodeBlur = useCallback(async () => {
    const pincode = editedData.pincode;
    if (!pincode) return;

    if (!validatePincode(pincode)) {
      setErrors(prev => ({
        ...prev,
        pincode: 'Pincode must be 6 digits'
      }));
      return;
    }

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      if (data[0].Status === 'Success') {
        const { District, Region, State } = data[0].PostOffice[0];
        setEditedData(prev => ({
          ...prev,
          district: District,
          region: Region,
          state: State
        }));
        setErrors(prev => ({
          ...prev,
          pincode: null
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          pincode: 'Invalid pincode'
        }));
      }
    } catch (error) {
      console.error('Error fetching location details:', error);
    }
  }, [editedData.pincode, validatePincode]);

  const handleExperienceBlur = useCallback(() => {
    const isValid = validateExperience(editedData.experience, editedData.age);
    if (!isValid) {
      setErrors(prev => ({
        ...prev,
        experience: 'Experience cannot be more than age'
      }));
      setEditedData(prev => ({
        ...prev,
        experience: ''
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        experience: null
      }));
    }
  }, [editedData.experience, editedData.age, validateExperience]);

  const handleSave = async () => {
    if (!validateFields()) {
      return;
    }

    setLoading(true);
    try {
      const docRef = doc(db, "agents", currentUser.uid);
      const { referenceCode, ...dataToUpdate } = editedData;
      await updateDoc(docRef, dataToUpdate);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedData(agentData);
    setIsEditing(false);
    setErrors({});
  };

  const copyReferenceCode = async () => {
    if (editedData.referenceCode) {
      await navigator.clipboard.writeText(editedData.referenceCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Fetch location details immediately without debounce
  const fetchLocationDetails = async (pincode) => {
    if (!/^\d{6}$/.test(pincode)) return;
    
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      if (data[0].Status === 'Success') {
        const { District, Region, State } = data[0].PostOffice[0];
        setEditedData(prev => ({
          ...prev,
          district: District,
          region: Region,
          state: State
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          pincode: 'Invalid pincode'
        }));
      }
    } catch (error) {
      console.error('Error fetching location details:', error);
    }
  };

  useEffect(() => {
    if (editedData.pincode) {
      fetchLocationDetails(editedData.pincode);
    }
  }, [editedData.pincode]);

  const Section = ({ label, children }) => (
    <div className="mb-6">
      <p className="text-sm font-medium text-orange-600 mb-2">{label}</p>
      {children}
    </div>
  );

  return (
  <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto w-full border border-orange-100">
    {/* Header Controls */}
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-2xl font-semibold text-orange-800">Profile Details</h2>
      <div className="flex gap-2">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 font-medium"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all duration-200 font-medium"
              disabled={loading}
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || Object.keys(errors).length > 0}
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Validation Errors Alert */}
    {Object.keys(errors).length > 0 && (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6" role="alert">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700 font-medium">Please fix the highlighted errors before saving</p>
        </div>
      </div>
    )}

    <div className="flex flex-col lg:flex-row gap-12">
      {/* Left Column - Profile Image & Basic Info */}
      <div className="lg:w-1/3">
        <div className="flex flex-col items-center lg:items-start space-y-6">
          {/* Profile Image */}
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <img
              src={editedData.displayPictureUrl}
              alt={`${editedData.name}'s profile`}
              className="relative h-40 w-40 rounded-full object-cover border-4 border-white shadow-xl transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          {/* Basic Info */}
          <div className="w-full space-y-4">
            <EditableField
              value={editedData.name}
              onChange={handleFieldChange}
              isEditing={isEditing}
              fieldName="name"
              icon={User}
              error={errors.name}
            />
            <p className="text-sm text-orange-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Member since {new Date(editedData.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Reference Code */}
          {editedData.referenceCode && (
            <div className="w-full p-4 bg-orange-50 rounded-xl border border-orange-200 hover:border-blue-200 transition-colors duration-200">
              <p className="text-sm font-medium text-orange-700 mb-2">Reference Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded-lg border border-orange-200 font-mono text-sm">
                  {editedData.referenceCode}
                </code>
                <button
                  onClick={copyReferenceCode}
                  className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Copy reference code"
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Details Grid */}
      <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Information */}
        <div className="space-y-6">
          <Section label="Contact Information">
            <div className="space-y-4 bg-orange-50 p-4 rounded-xl">
              <EditableField
                value={editedData.phoneNumber}
                onChange={handleFieldChange}
                isEditing={false}
                fieldName="phoneNumber"
                disabled={true}
                icon={Phone}
              />
              <EditableField
                value={editedData.email}
                onChange={handleFieldChange}
                isEditing={false}
                fieldName="email"
                disabled={true}
                icon={Mail}
              />
            </div>
          </Section>

          <Section label="Personal Details">
            <div className="space-y-4 bg-orange-50 p-4 rounded-xl">
              <EditableField
                value={editedData.experience}
                onChange={handleFieldChange}
                onBlur={handleExperienceBlur}
                isEditing={isEditing}
                fieldName="experience"
                icon={Briefcase}
                error={errors.experience}
              />
              <EditableField
                value={editedData.age}
                onChange={handleFieldChange}
                isEditing={false}
                fieldName="age"
                disabled={true}
                icon={User}
              />
              <EditableField
                value={editedData.dob}
                onChange={handleFieldChange}
                isEditing={isEditing}
                fieldName="dob"
                icon={Calendar}
              />
            </div>
          </Section>
        </div>

        {/* Location Details */}
        <div className="space-y-6">
          <Section label="Location Details">
            <div className="space-y-4 bg-orange-50 p-4 rounded-xl">
              <EditableField
                value={editedData.pincode}
                onChange={handleFieldChange}
                onBlur={handlePincodeBlur}
                isEditing={isEditing}
                fieldName="pincode"
                icon={MapPin}
                error={errors.pincode}
              />
              <EditableField
                value={editedData.district}
                onChange={handleFieldChange}
                isEditing={false}
                fieldName="district"
                disabled={true}
                icon={Building}
              />
              <EditableField
                value={editedData.region}
                onChange={handleFieldChange}
                isEditing={false}
                fieldName="region"
                disabled={true}
                icon={Map}
              />
              <EditableField
                value={editedData.state}
                onChange={handleFieldChange}
                isEditing={false}
                fieldName="state"
                disabled={true}
                icon={Globe}
              />
            </div>
          </Section>

          <Section label="Complete Address">
            <div className="space-y-4 bg-orange-50 p-4 rounded-xl">
              <EditableField
                value={editedData.addressLine1}
                onChange={handleFieldChange}
                isEditing={isEditing}
                fieldName="addressLine1"
                icon={Home}
              />
              <EditableField
                value={editedData.addressLine2}
                onChange={handleFieldChange}
                isEditing={isEditing}
                fieldName="addressLine2"
                icon={Building}
              />
            </div>
          </Section>
        </div>
      </div>
    </div>
  </div>
);
};

export default ProfileCard;
