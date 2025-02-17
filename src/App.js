import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Registration from './pages/Registration';
import Dashboard from './pages/Dashboard';


function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Registration />} />

          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;