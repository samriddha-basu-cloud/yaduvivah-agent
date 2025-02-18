import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import ProfileCard from "../components/ProfileCard";
import SubHeaderNav from "../components/SubHeaderNav";
import Stats from "../components/Stats";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.png";

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [agentData, setAgentData] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard"); // State to track active tab
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAgentData = async () => {
      if (currentUser) {
        const docRef = doc(db, "agents", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Filter out unwanted fields
          const { userId, status, aadharBackUrl, aadharFrontUrl, ...filteredData } = data;
          setAgentData(filteredData);
        }
      }
    };

    fetchAgentData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  if (!agentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Main Header */}
            <header className="bg-gradient-to-r from-orange-600 to-orange-400 shadow-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center bg-yellow-400 rounded-xl shadow-sm">
            <img src={Logo} alt="YaduVivah Logo" className="h-12 w-auto" />
          </div>
      
          {/* Title */}
          <h1 className="text-3xl font-extrabold text-white hidden sm:block shadow-sm">
            YaduVivah Agent Panel
          </h1>
      
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Sub Header Navigation */}
      <SubHeaderNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 p-4 flex flex-col items-center">
        {activeTab === "dashboard" && <Stats agentData={agentData} />}
        {activeTab === "profile" && <ProfileCard agentData={agentData} currentUser={currentUser} />}
      </div>
    </div>
  );
}
