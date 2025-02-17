import { createContext, useContext, useState, useEffect } from "react";
import { auth, db, storage } from "../firebase/config";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if phone number or email already exists
  const checkExistingUser = async (phoneNumber, email) => {
    try {
      const phoneQuery = query(
        collection(db, "agents"),
        where("phoneNumber", "==", formatPhoneNumber(phoneNumber))
      );
      const phoneSnapshot = await getDocs(phoneQuery);
      if (!phoneSnapshot.empty) {
        throw new Error(
          "This phone number is already registered. Please use a different number."
        );
      }

      const emailQuery = query(
        collection(db, "agents"),
        where("email", "==", email)
      );
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        throw new Error(
          "This email is already registered. Please use a different email."
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  };

  // Setup reCAPTCHA verifier
  const setupRecaptcha = (phoneNumber) => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: (response) => {
        console.log("reCAPTCHA verified");
      },
      "expired-callback": () => {
        console.log("reCAPTCHA expired");
      },
    });
  };

  // Format phone number to E.164 format
  const formatPhoneNumber = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (!cleaned.startsWith("91")) {
      return `+91${cleaned}`;
    }
    return `+${cleaned}`;
  };

  // Upload Profile Picture to Firebase Storage
  const uploadProfilePicture = async (file, folder) => {
  if (!file) return null;

  try {
    // Include user ID in the path
    const userId = auth.currentUser.uid;
    const fileName = `${Date.now()}_${file.name}`; // Add timestamp to prevent naming conflicts
    const storageRef = ref(storage, `${folder}/${userId}/${fileName}`);

    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
};

  // Register new agent
  const registerAgent = async (phoneNumber, agentData) => {
    try {
      await checkExistingUser(phoneNumber, agentData.email);

      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
      console.log("Formatted phone number:", formattedPhoneNumber);

      if (!window.recaptchaVerifier) {
        setupRecaptcha();
      }

      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhoneNumber,
        appVerifier
      );

      window.confirmationResult = confirmationResult;
      return true;
    } catch (error) {
      console.error("Error in registration:", error);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      throw error;
    }
  };

  // Verify OTP and create agent profile
  // In AuthContext.js
const verifyOTP = async (otp, agentData, files) => {
  try {
    const result = await window.confirmationResult.confirm(otp);
    const userId = result.user.uid;

    // Upload images first
    const imageUrls = {};
    if (files) {
      // Upload display picture
      if (files.displayPicture) {
        imageUrls.displayPictureUrl = await uploadProfilePicture(
          files.displayPicture,
          'display-pictures'
        );
      }
      
      // Upload Aadhaar front
      if (files.aadharFront) {
        imageUrls.aadharFrontUrl = await uploadProfilePicture(
          files.aadharFront,
          'aadhaar-images'
        );
      }
      
      // Upload Aadhaar back
      if (files.aadharBack) {
        imageUrls.aadharBackUrl = await uploadProfilePicture(
          files.aadharBack,
          'aadhaar-images'
        );
      }
    }

    // Save agent profile with image URLs
    const agentProfile = {
      ...agentData,
      userId,
      phoneNumber: result.user.phoneNumber,
      ...imageUrls,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    // Remove File objects
    delete agentProfile.displayPicture;
    delete agentProfile.aadharFront;
    delete agentProfile.aadharBack;

    // Save to Firestore
    await setDoc(doc(db, "agents", userId), agentProfile);

    return result.user;
  } catch (error) {
    console.error("Error in OTP verification:", error);
    throw error;
  }
};
// Login with phone number
  const loginWithPhone = async (phoneNumber) => {
    try {
      // Check if user exists
      const phoneQuery = query(
        collection(db, "agents"),
        where("phoneNumber", "==", formatPhoneNumber(phoneNumber))
      );
      const phoneSnapshot = await getDocs(phoneQuery);
      
      if (phoneSnapshot.empty) {
        throw new Error("No account found with this phone number. Please register first.");
      }

      // Setup reCAPTCHA if not already set up
      if (!window.recaptchaVerifier) {
        setupRecaptcha();
      }

      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
      const appVerifier = window.recaptchaVerifier;
      
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhoneNumber,
        appVerifier
      );

      window.confirmationResult = confirmationResult;
      return true;
    } catch (error) {
      console.error("Error in login:", error);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      throw error;
    }
  };

  // Verify login OTP
  const verifyLoginOTP = async (otp) => {
    try {
      const result = await window.confirmationResult.confirm(otp);
      const userId = result.user.uid;

      // Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, "agents", userId));
      
      if (!userDoc.exists()) {
        throw new Error("User profile not found");
      }

      // You could optionally update last login timestamp here
      await setDoc(doc(db, "agents", userId), {
        lastLoginAt: new Date().toISOString()
      }, { merge: true });

      return result.user;
    } catch (error) {
      console.error("Error in OTP verification:", error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, "agents", user.uid));
        if (userDoc.exists()) {
          setCurrentUser({ ...user, profile: userDoc.data() });
        } else {
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  

  // Sign out
  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    registerAgent,
    verifyOTP,
    logout,
    loginWithPhone,    // Add these new functions
    verifyLoginOTP,    // to the context value
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}