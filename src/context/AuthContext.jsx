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

export const isAllowedHostRole = (user) => {
  if (!user) return false;
  const role = (user.role || '').toUpperCase();
  const userType = (user.user_type || '').toUpperCase();

  // Guard, General Visitor, or Delivery are NOT hosts and must NOT access Host App
  if (role === 'GUARD' || role === 'SECURITY_GUARD' || role === 'VISITOR' || role === 'DELIVERY') {
    return false;
  }
  if (userType === 'GUARD' || userType === 'VISITOR') {
    return false;
  }

  // Allowed Host roles:
  const allowed = [
    'HOST',
    'RESIDENT',
    'EMPLOYEE',
    'RESIDENT_EMPLOYEE',
    'HOD',
    'VIP_HOST',
    'VIP_GUEST_HOST',
    'ADMIN',
    'SUPER_ADMIN',
    'SUPERVISOR'
  ];

  return allowed.some(a => role.includes(a) || userType.includes(a));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    const savedUser = localStorage.getItem('ASHRAM_HOST_USER');
    const savedToken = localStorage.getItem('ASHRAM_HOST_TOKEN');

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (isAllowedHostRole(parsed)) {
          setUser(parsed);
        } else {
          logoutUser();
          setUser(null);
          setLoading(false);
          return;
        }
      } catch (e) {
        logoutUser();
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const meRes = await getMe();
        if (meRes?.user) {
          if (isAllowedHostRole(meRes.user)) {
            setUser(meRes.user);
            localStorage.setItem('ASHRAM_HOST_USER', JSON.stringify(meRes.user));
          } else {
            logoutUser();
            setUser(null);
          }
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          logoutUser();
          setUser(null);
        } else {
          console.warn('Session check fallback:', err.message);
        }
      }
    } else {
      // Production ready: NO automatic mock login! User must login with their host account.
      setUser(null);
    }
    setLoading(false);
  };

  const loginWithPhoneOtp = async (phone, otp) => {
    const res = await verifyOtp(phone, otp);
    if (!res?.user) {
      throw new Error(res?.message || 'Login failed. Invalid OTP or user.');
    }
    if (!isAllowedHostRole(res.user)) {
      logoutUser();
      throw new Error('Access Denied: This app is restricted to Ashram Hosts and Residents only. Security Guards should use the Security Guard App.');
    }
    setUser(res.user);
    return res;
  };

  const loginWithCredentials = async (emailOrPhone, password) => {
    const res = await loginUser(emailOrPhone, password);
    if (!res?.user) {
      throw new Error(res?.message || 'Login failed. Invalid email or password.');
    }
    if (!isAllowedHostRole(res.user)) {
      logoutUser();
      throw new Error('Access Denied: This app is restricted to Ashram Hosts and Residents only. Security Guards should use the Security Guard App.');
    }
    setUser(res.user);
    return res;
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
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
