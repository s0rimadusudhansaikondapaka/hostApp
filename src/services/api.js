// Default backend API URL: Always connects by default to Render cloud server API (same as guard)
export const DEFAULT_API_BASE_URL = 'https://smsavmsserver.onrender.com/api';

export const getBaseUrl = () => {
  const saved = localStorage.getItem('ASHRAM_HOST_API_URL');
  if (saved && saved !== '/api' && !saved.includes('localhost')) {
    return saved;
  }

  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
};

export const setBaseUrl = (url) => {
  localStorage.setItem('ASHRAM_HOST_API_URL', url);
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('ASHRAM_HOST_TOKEN');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ================= AUTHENTICATION =================
export const loginUser = async (emailOrPhone, password) => {
  const baseUrl = getBaseUrl();
  const res = await axios.post(`${baseUrl}/auth/login`, {
    email: emailOrPhone,
    phone: emailOrPhone,
    password,
  });
  if (res.data?.token) {
    localStorage.setItem('ASHRAM_HOST_TOKEN', res.data.token);
    localStorage.setItem('ASHRAM_HOST_USER', JSON.stringify(res.data.user));
  }
  return res.data;
};

export const sendOtp = async (phone) => {
  const baseUrl = getBaseUrl();
  const res = await axios.post(`${baseUrl}/auth/send-otp`, { phone });
  return res.data;
};

export const verifyOtp = async (phone, otp) => {
  const baseUrl = getBaseUrl();
  const res = await axios.post(`${baseUrl}/auth/verify-otp`, { phone, otp });
  if (res.data?.token) {
    localStorage.setItem('ASHRAM_HOST_TOKEN', res.data.token);
    localStorage.setItem('ASHRAM_HOST_USER', JSON.stringify(res.data.user));
  }
  return res.data;
};

export const getMe = async () => {
  const baseUrl = getBaseUrl();
  const res = await axios.get(`${baseUrl}/auth/me`, { headers: getAuthHeaders() });
  return res.data;
};

export const logoutUser = () => {
  localStorage.removeItem('ASHRAM_HOST_TOKEN');
  localStorage.removeItem('ASHRAM_HOST_USER');
};

// ================= HOST REGISTRATIONS & INVITES =================
export const getHostRegistrations = async () => {
  const baseUrl = getBaseUrl();
  try {
    const res = await axios.get(`${baseUrl}/registrations/host`, { headers: getAuthHeaders() });
    return res.data;
  } catch (err) {
    console.warn('Failed to fetch host registrations, returning cached or demo data:', err.message);
    return {
      success: true,
      registrations: getSampleHostRegistrations(),
    };
  }
};

export const createRegistration = async (payload) => {
  const baseUrl = getBaseUrl();
  const res = await axios.post(`${baseUrl}/registrations`, payload, { headers: getAuthHeaders() });
  return res.data;
};

export const updateRegistration = async (id, payload) => {
  const baseUrl = getBaseUrl();
  const res = await axios.put(`${baseUrl}/registrations/${id}`, payload, { headers: getAuthHeaders() });
  return res.data;
};

export const updateApproval = async (registrationId, action, remarks, extra = {}) => {
  const baseUrl = getBaseUrl();
  const payload = {
    registration_id: registrationId,
    action,
    remarks,
    ...extra,
  };
  try {
    const res = await axios.post(`${baseUrl}/registrations/approval`, payload, { headers: getAuthHeaders() });
    return res.data;
  } catch (err) {
    // Fallback to /registrations/approve
    const res2 = await axios.post(`${baseUrl}/registrations/approve`, payload, { headers: getAuthHeaders() });
    return res2.data;
  }
};

export const generateInviteToken = async () => {
  const baseUrl = getBaseUrl();
  const res = await axios.post(`${baseUrl}/registrations/generate-invite-token`, {}, { headers: getAuthHeaders() });
  return res.data;
};

export const getVisitHistory = async () => {
  const baseUrl = getBaseUrl();
  try {
    const res = await axios.get(`${baseUrl}/registrations/history`, { headers: getAuthHeaders() });
    return res.data;
  } catch (err) {
    return { success: true, history: [] };
  }
};

export const generateQrCode = async (regId) => {
  const baseUrl = getBaseUrl();
  const res = await axios.post(`${baseUrl}/registrations/generate-qr`, { registration_id: regId }, { headers: getAuthHeaders() });
  return res.data;
};

export const getPublicPassDetails = async (passCode) => {
  const baseUrl = getBaseUrl();
  const res = await axios.get(`${baseUrl}/registrations/public-pass/${encodeURIComponent(passCode)}`);
  return res.data;
};

// ================= FAMILY MEMBERS (FOR RESIDENTS) =================
export const getResidentFamilyMembers = async () => {
  const baseUrl = getBaseUrl();
  try {
    const res = await axios.get(`${baseUrl}/visitors/family-members`, { headers: getAuthHeaders() });
    return res.data;
  } catch (err) {
    return { success: true, family_members: [] };
  }
};

export const addResidentFamilyMember = async (payload) => {
  const baseUrl = getBaseUrl();
  const res = await axios.post(`${baseUrl}/visitors/family-members`, payload, { headers: getAuthHeaders() });
  return res.data;
};

export const deleteResidentFamilyMember = async (id) => {
  const baseUrl = getBaseUrl();
  const res = await axios.delete(`${baseUrl}/visitors/family-members/${id}`, { headers: getAuthHeaders() });
  return res.data;
};

// ================= SAMPLE DATA FOR DEMO & OFFLINE =================
export const getSampleHostRegistrations = () => {
  const now = Date.now();
  return [
    {
      id: 201,
      pass_code: 'PASS-7842',
      visitor_name: 'Rahul Sharma',
      visitor_phone: '+91 9876500011',
      visitor_category: 'GENERAL',
      visit_type: 'HOME',
      status: 'PENDING_L1',
      purpose: 'Devotee Darshan & Family Meeting',
      stay_required: false,
      adult_men_count: 1,
      adult_women_count: 1,
      children_count: 0,
      person_count: 2,
      vehicles: [{ plate_number: 'KA-01-AB-1234', vehicle_type: 'Car' }],
      valid_from: new Date(now + 2 * 3600000).toISOString(),
      valid_until: new Date(now + 6 * 3600000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 202,
      pass_code: 'PASS-5519',
      visitor_name: 'Anjali Verma',
      visitor_phone: '+91 9876500022',
      visitor_category: 'VIP',
      visit_type: 'OFFICE',
      status: 'APPROVED',
      purpose: 'Education Trust CSR Meeting',
      stay_required: true,
      adult_men_count: 1,
      adult_women_count: 0,
      children_count: 0,
      person_count: 1,
      vehicles: [{ plate_number: 'TS-09-CD-9988', vehicle_type: 'Car' }],
      valid_from: new Date(now + 1 * 3600000).toISOString(),
      valid_until: new Date(now + 8 * 3600000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 203,
      pass_code: 'PASS-3310',
      visitor_name: 'Dr. Ramesh Sundaram',
      visitor_phone: '+91 9876500033',
      visitor_category: 'GENERAL',
      visit_type: 'HOME',
      status: 'INSIDE_CAMPUS',
      purpose: 'Bhajan & Hospital Consultation',
      stay_required: false,
      adult_men_count: 2,
      adult_women_count: 1,
      children_count: 1,
      person_count: 4,
      vehicles: [{ plate_number: 'KA-04-MK-4455', vehicle_type: 'Van' }],
      valid_from: new Date(now - 1 * 3600000).toISOString(),
      valid_until: new Date(now + 4 * 3600000).toISOString(),
      created_at: new Date().toISOString(),
    },
  ];
};
