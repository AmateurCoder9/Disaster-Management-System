import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, register as apiRegister } from '../services/api';

const AuthContext = createContext(null);

function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken) {
      const decoded = decodeToken(savedToken);
      if (decoded && decoded.exp && decoded.exp * 1000 > Date.now()) {
        setToken(savedToken);
        setUser(savedUser ? JSON.parse(savedUser) : decoded);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const loginUser = useCallback(async (email, password) => {
    const response = await apiLogin(email, password);
    const { token: newToken, user: userData } = response.data;

    const userInfo = userData || decodeToken(newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setToken(newToken);
    setUser(userInfo);

    return response;
  }, []);

  const registerUser = useCallback(async (name, email, password, role) => {
    const response = await apiRegister(name, email, password, role);
    const { token: newToken, user: userData } = response.data;

    const userInfo = userData || decodeToken(newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setToken(newToken);
    setUser(userInfo);

    return response;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login: loginUser,
    register: registerUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
