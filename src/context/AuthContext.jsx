import React, { createContext, useState, useEffect, useContext } from 'react';
import { getMe, loginUser, logoutUser, verifyOtp } from '../services/api';

const AuthContext = createContext();

export const DEMO_HOSTS = [
  {
    id: 1,
    name: 'Srinivas Rao (Resident)',
    email: 'resident1@ashram.org',
    phone: '+91 9876543210',
    role: 'RESIDENT',
    residency_status: 'Resident',
    user_type: 'RESIDENT',
    unit_number: 'Block A - Flat 204',
    department: 'Ashram Residential Quarters',
    pass_code: 'RESIDENT-1001',
  },
  {
    id: 2,
    name: 'Dr. Kumar (Employee)',
    email: 'employee1@ashram.org',
    phone: '+91 9876543211',
    role: 'EMPLOYEE',
    residency_status: 'Employee',
    user_type: 'EMPLOYEE',
    unit_number: 'Hospital Quarters',
    department: 'PBMT Super Speciality Hospital',
    pass_code: 'EMP-1002',
  },
  {
    id: 3,
    name: 'Swami Nathan (Department HOD)',
    email: 'hod1@ashram.org',
    phone: '+91 9876543212',
    role: 'HOD',
    residency_status: 'Employee',
    user_type: 'EMPLOYEE',
    unit_number: 'Admin Block 101',
    department: 'Annapoorna Ashram Trust',
    pass_code: 'HOD-1003',
  },
  {
    id: 8,
    name: 'Deepak VIP Host (Executive)',
    email: 'viphost@ashram.org',
    phone: '+91 9876543288',
    role: 'VIP_HOST',
    residency_status: 'Resident',
    user_type: 'VIP_HOST',
    unit_number: 'Guest House VVIP Suite',
    department: 'Ashram Central Executive Directorate',
    pass_code: 'VIP-1008',
  },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    const savedUser = localStorage.getItem('ASHRAM_HOST_USER');
    const savedToken = localStorage.getItem('ASHRAM_HOST_TOKEN');

    if (savedToken) {
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {}
      }
      try {
        const meRes = await getMe();
        if (meRes?.user) {
          setUser(meRes.user);
          localStorage.setItem('ASHRAM_HOST_USER', JSON.stringify(meRes.user));
        }
      } catch (err) {
        console.warn('Session check fallback:', err.message);
      }
    } else {
      // Default to the first demo host so the user can immediately explore
      const defaultHost = DEMO_HOSTS[0];
      setUser(defaultHost);
      localStorage.setItem('ASHRAM_HOST_USER', JSON.stringify(defaultHost));
      localStorage.setItem('ASHRAM_HOST_TOKEN', 'demo_host_session_token');
    }
    setLoading(false);
  };

  const loginWithPhoneOtp = async (phone, otp) => {
    try {
      const res = await verifyOtp(phone, otp);
      if (res?.user) {
        setUser(res.user);
      }
      return res;
    } catch (err) {
      // Match demo host if phone matches
      const matched = DEMO_HOSTS.find(h => h.phone.replace(/\D/g, '').includes(phone.replace(/\D/g, '')));
      if (matched) {
        setUser(matched);
        localStorage.setItem('ASHRAM_HOST_USER', JSON.stringify(matched));
        localStorage.setItem('ASHRAM_HOST_TOKEN', `demo_token_${matched.id}`);
        return { success: true, user: matched };
      }
      throw err;
    }
  };

  const loginWithCredentials = async (emailOrPhone, password) => {
    try {
      const res = await loginUser(emailOrPhone, password);
      if (res?.user) {
        setUser(res.user);
      }
      return res;
    } catch (err) {
      const clean = emailOrPhone.trim().toLowerCase();
      const matched = DEMO_HOSTS.find(h => h.email.toLowerCase() === clean || h.phone.includes(clean));
      if (matched) {
        setUser(matched);
        localStorage.setItem('ASHRAM_HOST_USER', JSON.stringify(matched));
        localStorage.setItem('ASHRAM_HOST_TOKEN', `demo_token_${matched.id}`);
        return { success: true, user: matched };
      }
      throw err;
    }
  };

  const selectDemoHost = (demoHost) => {
    setUser(demoHost);
    localStorage.setItem('ASHRAM_HOST_USER', JSON.stringify(demoHost));
    localStorage.setItem('ASHRAM_HOST_TOKEN', `demo_token_${demoHost.id}`);
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        loginWithPhoneOtp,
        loginWithCredentials,
        selectDemoHost,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
