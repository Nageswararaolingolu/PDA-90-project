import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [appLoading, setAppLoading] = useState(true);

  // Fetch current user details on startup/refresh
  const fetchUserContext = async (authToken) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Session expired');
      }

      setUser(data);
    } catch (err) {
      console.error('Error fetching user context:', err.message);
      // Clear invalid session
      handleLogout();
    } finally {
      setAppLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserContext(token);
    } else {
      setAppLoading(false);
    }
  }, [token]);

  // Handle Login Success
  const handleLoginSuccess = (userToken, userData) => {
    localStorage.setItem('token', userToken);
    setToken(userToken);
    setUser(userData);
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Refresh user details (useful for student pulling allocation updates)
  const handleRefreshUserContext = () => {
    if (token) {
      fetchUserContext(token);
    }
  };

  if (appLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        <p className="text-sm font-mono tracking-wider font-semibold">Synchronizing App Space...</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (user.role === 'admin') {
    return (
      <AdminDashboard 
        token={token} 
        user={user} 
        onLogout={handleLogout} 
      />
    );
  }

  return (
    <StudentDashboard 
      token={token} 
      user={user} 
      onLogout={handleLogout} 
      onRefreshUserContext={handleRefreshUserContext} 
    />
  );
}

export default App;
