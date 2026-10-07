import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonToast,
  IonModal,
} from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { createRegistration, generateInviteToken, getFrontendUrl } from '../services/api';
import { Share2, Plus, Trash2, CheckCircle, Calendar, Users, Car, AlertCircle } from 'lucide-react';

const VEHICLE_TYPES = [
  'Select',
  'Two-Wheeler',
  'Car',
  'Auto Rickshaw',
  'Taxi / Cab',
  'Van',
  'Bus',
  'Mini Bus',
  'Tractor',
  'Construction Vehicle',
  'Other',
];

export default function InviteVisitor({ history }) {
  const { user } = useAuth();

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [purpose, setPurpose] = useState('');
  const [visitType, setVisitType] = useState('HOME');
  const [gender, setGender] = useState('Male');

  // Accompanying Breakdown & Mode
  const [registrationMode, setRegistrationMode] = useState('Single');
  const [adultMen, setAdultMen] = useState(1);
  const [adultWomen, setAdultWomen] = useState(0);
  const [boysCount, setBoysCount] = useState(0);
  const [girlsCount, setGirlsCount] = useState(0);

  // Visit Window Dates (Operating window: 5:00 AM - 10:00 PM; Strictly single-day for Phase 1)
  const getDefaultFrom = () => {
    const now = new Date();
    if (now.getHours() < 5) {
      now.setHours(5, 0, 0, 0);
    } else if (now.getHours() >= 22) {
      now.setDate(now.getDate() + 1);
      now.setHours(9, 0, 0, 0);
    }
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const computeSameDayDeparture = (fromDateStr) => {
    if (!fromDateStr) return '';
    const from = new Date(fromDateStr);
    if (isNaN(from.getTime())) return '';
    const dep = new Date(from.getTime());
    // Auto-populate departure on same calendar day: 4 hours later, capped at 21:30 (9:30 PM)
    dep.setHours(dep.getHours() + 4);
    const maxTime = new Date(from.getTime());
    maxTime.setHours(21, 30, 0, 0);
    const chosenTime = dep.getTime() > maxTime.getTime() ? maxTime : dep;
    const minDep = new Date(from.getTime() + 30 * 60 * 1000);
    const finalTime = chosenTime.getTime() < minDep.getTime() ? minDep : chosenTime;

    const year = finalTime.getFullYear();
    const month = String(finalTime.getMonth() + 1).padStart(2, '0');
    const day = String(finalTime.getDate()).padStart(2, '0');
    const hours = String(finalTime.getHours()).padStart(2, '0');
    const minutes = String(finalTime.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getDefaultUntil = () => {
    return computeSameDayDeparture(getDefaultFrom());
  };

  const getMinDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [validFrom, setValidFrom] = useState(getDefaultFrom());
  const [validUntil, setValidUntil] = useState(getDefaultUntil());

  const handleArrivalChange = (val) => {
    setValidFrom(val);
    setValidUntil(computeSameDayDeparture(val));
  };

  // Vehicles (Up to 5)
  const [vehicles, setVehicles] = useState([
    { plate_number: '', vehicle_type: 'Select', driver_name: '', driver_phone: '' },
  ]);

  const [accommodationRequired, setAccommodationRequired] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [error, setError] = useState('');

  // Share Link Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareToken, setShareToken] = useState('');
  const [generatingToken, setGeneratingToken] = useState(false);

  const addVehicle = () => {
    if (vehicles.length >= 5) {
      setToastMsg('Maximum of 5 vehicles allowed per invite.');
      return;
    }
    setVehicles([...vehicles, { plate_number: '', vehicle_type: 'Select', driver_name: '', driver_phone: '' }]);
  };

  const updateVehicle = (index, field, value) => {
    const updated = [...vehicles];
    updated[index][field] = value;
    setVehicles(updated);
  };

  const removeVehicle = (index) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setGender('Male');
    setCategory('GENERAL');
    setPurpose('');
    setRegistrationMode('Single');
    setAdultMen(1);
    setAdultWomen(0);
    setBoysCount(0);
    setGirlsCount(0);
    const defaultFrom = getDefaultFrom();
    setValidFrom(defaultFrom);
    setValidUntil(computeSameDayDeparture(defaultFrom));
    setVehicles([{ plate_number: '', vehicle_type: 'Select', driver_name: '', driver_phone: '' }]);
    setAccommodationRequired(false);
    setRemarks('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const now = new Date();
    const fromDate = new Date(validFrom);
    const untilDate = new Date(validUntil);

    // 1. Expired Arrival Date Validation
    if (fromDate < new Date(now.getTime() - 10 * 60 * 1000)) {
      setError('Arrival Date/Time cannot be in the past or already expired.');
      return;
    }

    if (untilDate <= fromDate) {
      setError('Departure Time must be after Arrival Time.');
      return;
    }

    const fromH = fromDate.getHours();
    const fromM = fromDate.getMinutes();
    const untilH = untilDate.getHours();
    const untilM = untilDate.getMinutes();

    // 2. 5:00 AM - 10:00 PM Operating Hours Validation
    if (fromH < 5 || fromH > 22 || (fromH === 22 && fromM > 0)) {
      setError('Scheduled Arrival Time (SAT) must be between 5:00 AM and 10:00 PM.');
      return;
    }
    if (untilH < 5 || untilH > 22 || (untilH === 22 && untilM > 0)) {
      setError('Scheduled Departure Time (SDT) must be between 5:00 AM and 10:00 PM.');
      return;
    }

    // Clean vehicles
    const validVehicles = vehicles
      .filter((v) => v.plate_number.trim() !== '')
      .slice(0, 5)
      .map((v) => ({
        plate_number: v.plate_number.trim().toUpperCase(),
        vehicle_type: v.vehicle_type === 'Select' ? 'Car' : v.vehicle_type,
        driver_name: v.driver_name || '',
        driver_phone: v.driver_phone || '',
      }));

    const isSingle = registrationMode === 'Single';
    const computedMen = isSingle ? (gender === 'Female' ? 0 : 1) : parseInt(adultMen) || 0;
    const computedWomen = isSingle ? (gender === 'Female' ? 1 : 0) : parseInt(adultWomen) || 0;
    const computedBoys = isSingle ? 0 : parseInt(boysCount) || 0;
    const computedGirls = isSingle ? 0 : parseInt(girlsCount) || 0;

    const payload = {
      full_name: fullName,
      phone,
      email,
      gender,
      visitor_category: category,
      host_id: user?.id || 1,
      purpose: purpose || 'Ashram Visit',
      visit_type: visitType,
      stay_required: accommodationRequired,
      valid_from: validFrom,
      valid_until: validUntil,
      adult_men_count: computedMen,
      adult_women_count: computedWomen,
      boys_count: computedBoys,
      girls_count: computedGirls,
      children_count: computedBoys + computedGirls,
      vehicles: validVehicles,
      is_spot_registration: false,
    };

    setSubmitting(true);
    try {
      const res = await createRegistration(payload);
      if (res?.success) {
        setToastMsg('Visitor invite submitted successfully!');
        setTimeout(() => history.push('/approval-status'), 1200);
      } else {
        setError(res?.message || 'Failed to submit visitor invite.');
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setError(serverMsg || 'Failed to submit visitor invite.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareInvite = async () => {
    setGeneratingToken(true);
    try {
      const res = await generateInviteToken();
      if (res?.token) {
        setShareToken(res.token);
      } else {
        const fallback = `inv_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
        setShareToken(fallback);
      }
    } catch (err) {
      const fallback = `inv_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      setShareToken(fallback);
    } finally {
      setGeneratingToken(false);
      setShowShareModal(true);
    }
  };

  const frontendUrl = getFrontendUrl();
  const activeInviteToken = shareToken || `inv_${user?.id || 1}_${Date.now()}`;
  const inviteLink = `${frontendUrl}/?invite=true&token=${activeInviteToken}`;

  const isVipOrHodHost = user?.role === 'HOD' || user?.user_type === 'HOD' || user?.role === 'VIP_HOST' || user?.user_type === 'VIP_HOST' || (user?.user_type && user.user_type.includes('VIP_HOST')) || (user?.role && user.role.includes('VIP_HOST'));

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#faf6f0', borderBottom: '1px solid #ebdccc' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="" color="dark" />
          </IonButtons>
          <IonTitle style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>Invite Visitor</IonTitle>
          <IonButtons slot="end">
            <button
              type="button"
              onClick={handleShareInvite}
              disabled={generatingToken}
              style={{ 
                background: '#fdede3', 
                border: '1.5px solid #fed7aa', 
                color: '#b84018', 
                borderRadius: '9999px', 
                padding: '0.4rem 0.8rem', 
                fontSize: '0.75rem', 
                fontWeight: '800', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.35rem', 
                cursor: generatingToken ? 'wait' : 'pointer', 
                marginRight: '0.5rem', 
                opacity: generatingToken ? 0.7 : 1 
              }}
            >
              <Share2 size={13} /> {generatingToken ? 'Generating...' : 'Share Link'}
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#faf6f0' }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '3rem' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '16px', padding: '0.8rem', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* VIP / HOD Direct Pass Privileges Notice */}
          {isVipOrHodHost && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '18px', padding: '0.8rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.25rem' }}>⚡</span>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#166534' }}>
                  Direct Gate Pass Generation
                </div>
                <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: '500' }}>
                  As a VIP / HOD Host, your guest invitations are directly approved upon creation with no L2 / PRO verification delay.
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Visitor Basic Information */}
          <div style={{ background: '#ffffff', border: '1.5px solid #ede5da', borderRadius: '20px', padding: '1.1rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(184, 64, 24, 0.04)' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#b84018', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>1.</span> Visitor Basic Information
            </h3>

            <label className="host-label" style={{ marginTop: 0 }}>Visitor Name *</label>
            <input
              type="text"
              required
              className="host-input"
              placeholder="Enter full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.4rem' }}>
              <div>
                <label className="host-label">WhatsApp Number *</label>
                <input
                  type="tel"
                  required
                  className="host-input"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="host-label">Gender *</label>
                <select className="host-input" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.4rem' }}>
              <div>
                <label className="host-label">Visitor Category</label>
                <select className="host-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="GENERAL">General Guest</option>
                  <option value="VIP">VIP Guest</option>
                  <option value="FAMILY_MEMBER">Family Member</option>
                  <option value="FREQUENT_VISITOR">Frequent Visitor</option>
                  <option value="DELIVERY">Delivery / Courier</option>
                  <option value="VENDOR">Vendor / Contractor</option>
                </select>
              </div>
              <div>
                <label className="host-label">Visit Type</label>
                <select className="host-input" value={visitType} onChange={(e) => setVisitType(e.target.value)}>
                  <option value="HOME">Resident / Home Visit</option>
                  <option value="OFFICE">Department / Office Visit</option>
                  <option value="BHAJAN">Ashram Bhajan Visit</option>
                  <option value="EVENT">Ashram Event Visit</option>
                  <option value="TOUR">Ashram Tour Visit</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '0.4rem' }}>
              <label className="host-label">Email (Optional)</label>
              <input
                type="email"
                className="host-input"
                placeholder="visitor@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <label className="host-label" style={{ marginTop: '0.4rem' }}>Purpose of Visit</label>
            <input
              type="text"
              className="host-input"
              placeholder="e.g. Darshan, Meeting, Delivery"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          {/* Section 2: Visit Date & Time Window */}
          <div style={{ background: '#ffffff', border: '1.5px solid #ede5da', borderRadius: '20px', padding: '1.1rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(184, 64, 24, 0.04)' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#b84018', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>2.</span> Visit Schedule (5:00 AM – 10:00 PM)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="host-label" style={{ marginTop: 0 }}>Scheduled Arrival Date/Time (SAT) *</label>
                <input
                  type="datetime-local"
                  required
                  min={getMinDateTime()}
                  className="host-input"
                  value={validFrom}
                  onChange={(e) => handleArrivalChange(e.target.value)}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="host-label" style={{ margin: 0 }}>Scheduled Departure Date/Time (SDT) *</label>
                  <span style={{ fontSize: '0.68rem', color: '#9a3412', background: '#ffedd5', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                    Auto-Computed (Locked)
                  </span>
                </div>
                <input
                  type="datetime-local"
                  required
                  disabled
                  className="host-input"
                  style={{ background: '#f5eee6', cursor: 'not-allowed', color: '#57534e' }}
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#78716c', display: 'block', marginTop: '0.5rem', fontWeight: '500', lineHeight: 1.35 }}>
              * Phase 1 enforces strictly single-day visits (5:00 AM – 10:00 PM). Scheduled departure is auto-computed on the same date and locked.
            </span>
          </div>

          {/* Section 3: Group & Accompanying Count */}
          <div style={{ background: '#ffffff', border: '1.5px solid #ede5da', borderRadius: '20px', padding: '1.1rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(184, 64, 24, 0.04)' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#b84018', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>3.</span> Registration Mode &amp; People Count
            </h3>

            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <label style={{ 
                flex: 1, 
                padding: '0.65rem', 
                borderRadius: '14px', 
                border: registrationMode === 'Single' ? '2px solid #b84018' : '1.5px solid #ede5da', 
                background: registrationMode === 'Single' ? '#fdede3' : '#faf6f0', 
                color: registrationMode === 'Single' ? '#9a3412' : '#57534e',
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.45rem', 
                cursor: 'pointer', 
                fontSize: '0.85rem', 
                fontWeight: '800' 
              }}>
                <input type="radio" name="regMode" value="Single" checked={registrationMode === 'Single'} onChange={() => setRegistrationMode('Single')} />
                👤 Single Visitor
              </label>
              <label style={{ 
                flex: 1, 
                padding: '0.65rem', 
                borderRadius: '14px', 
                border: registrationMode === 'Group' ? '2px solid #b84018' : '1.5px solid #ede5da', 
                background: registrationMode === 'Group' ? '#fdede3' : '#faf6f0', 
                color: registrationMode === 'Group' ? '#9a3412' : '#57534e',
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.45rem', 
                cursor: 'pointer', 
                fontSize: '0.85rem', 
                fontWeight: '800' 
              }}>
                <input type="radio" name="regMode" value="Group" checked={registrationMode === 'Group'} onChange={() => setRegistrationMode('Group')} />
                👥 Group Visit
              </label>
            </div>

            {registrationMode === 'Group' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', background: '#faf6f0', padding: '0.8rem', borderRadius: '14px', border: '1.5px solid #ebdccc' }}>
                <div>
                  <label className="host-label" style={{ marginTop: 0, fontSize: '0.72rem' }}>Men (👨)</label>
                  <input type="number" min="0" className="host-input" value={adultMen} onChange={(e) => setAdultMen(e.target.value)} />
                </div>
                <div>
                  <label className="host-label" style={{ marginTop: 0, fontSize: '0.72rem' }}>Women (👩)</label>
                  <input type="number" min="0" className="host-input" value={adultWomen} onChange={(e) => setAdultWomen(e.target.value)} />
                </div>
                <div>
                  <label className="host-label" style={{ marginTop: 0, fontSize: '0.72rem' }}>Boys (👦)</label>
                  <input type="number" min="0" className="host-input" value={boysCount} onChange={(e) => setBoysCount(e.target.value)} />
                </div>
                <div>
                  <label className="host-label" style={{ marginTop: 0, fontSize: '0.72rem' }}>Girls (👧)</label>
                  <input type="number" min="0" className="host-input" value={girlsCount} onChange={(e) => setGirlsCount(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Vehicles (Up to 5) */}
          <div style={{ background: '#ffffff', border: '1.5px solid #ede5da', borderRadius: '20px', padding: '1.1rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(184, 64, 24, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#b84018', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>4.</span> Vehicle Details (Up to 5)
              </h3>
              {vehicles.length < 5 && (
                <button
                  type="button"
                  onClick={addVehicle}
                  style={{ background: '#fdede3', border: '1.5px solid #fed7aa', color: '#b84018', borderRadius: '9999px', padding: '0.3rem 0.65rem', fontSize: '0.72rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
                >
                  <Plus size={13} /> Add Vehicle ({vehicles.length}/5)
                </button>
              )}
            </div>

            {vehicles.map((veh, idx) => (
              <div key={idx} style={{ background: '#faf6f0', border: '1.5px solid #ede5da', borderRadius: '14px', padding: '0.7rem', marginBottom: '0.55rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#57534e' }}>Vehicle #{idx + 1}</span>
                  {vehicles.length > 1 && (
                    <button type="button" onClick={() => removeVehicle(idx)} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', padding: 0 }}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="host-input"
                    placeholder="Plate No. (e.g. KA-01-AB-1234)"
                    value={veh.plate_number}
                    onChange={(e) => updateVehicle(idx, 'plate_number', e.target.value)}
                  />
                  <select
                    className="host-input"
                    value={veh.vehicle_type}
                    onChange={(e) => updateVehicle(idx, 'vehicle_type', e.target.value)}
                  >
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Section 5: Accommodation & Remarks */}
          <div style={{ background: '#ffffff', border: '1.5px solid #ede5da', borderRadius: '20px', padding: '1.1rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(184, 64, 24, 0.04)' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#b84018', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>5.</span> Accommodation &amp; Remarks
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#faf6f0', padding: '0.8rem', borderRadius: '14px', border: '1.5px solid #ede5da', marginBottom: '0.8rem' }}>
              <div>
                <span style={{ fontSize: '0.84rem', fontWeight: '800', color: '#1c1917' }}>Accommodation Required?</span>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#78716c' }}>Overnight ashram room stay approval</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setAccommodationRequired(true)}
                  style={{ 
                    padding: '0.4rem 0.85rem', 
                    borderRadius: '9999px', 
                    border: accommodationRequired ? '2px solid #b84018' : '1.5px solid #ede5da', 
                    background: accommodationRequired ? '#b84018' : '#ffffff', 
                    color: accommodationRequired ? '#ffffff' : '#57534e', 
                    fontWeight: '800', 
                    fontSize: '0.76rem', 
                    cursor: 'pointer' 
                  }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setAccommodationRequired(false)}
                  style={{ 
                    padding: '0.4rem 0.85rem', 
                    borderRadius: '9999px', 
                    border: !accommodationRequired ? '2px solid #1c1917' : '1.5px solid #ede5da', 
                    background: !accommodationRequired ? '#1c1917' : '#ffffff', 
                    color: !accommodationRequired ? '#ffffff' : '#57534e', 
                    fontWeight: '800', 
                    fontSize: '0.76rem', 
                    cursor: 'pointer' 
                  }}
                >
                  No
                </button>
              </div>
            </div>

            <label className="host-label">Remarks for Security / Approver</label>
            <textarea
              rows={2}
              className="host-input"
              placeholder="Add optional notes or purpose details"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button
              type="button"
              onClick={handleReset}
              className="host-btn-outline"
              style={{ flex: 1, padding: '0.85rem', cursor: 'pointer' }}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="host-btn-primary"
              style={{ flex: 1.5, padding: '0.85rem', cursor: 'pointer' }}
            >
              {submitting ? 'Submitting...' : 'Submit Visitor Invitation'}
            </button>
          </div>
        </form>

        {/* WhatsApp / Email Invite Link Modal matching Attachment 3 */}
        <IonModal isOpen={showShareModal} onDidDismiss={() => setShowShareModal(false)}>
          <div style={{ padding: '1.5rem', background: '#ffffff', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {/* Modal Header */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '1.5px solid #f0e6da', paddingBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Share2 size={20} color="#b84018" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>Share Pre-Approval Link</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                style={{ background: '#f5eee6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#57534e', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            {/* Pill Badge matching Attachment 3 */}
            <div style={{ 
              background: '#fdede3', 
              color: '#b84018', 
              borderRadius: '9999px', 
              padding: '4px 14px', 
              fontSize: '0.74rem', 
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              marginBottom: '0.8rem'
            }}>
              <span>✦</span> PRE-REGISTRATION PASS LINK
            </div>

            <p style={{ fontSize: '0.82rem', color: '#78716c', lineHeight: '1.45', margin: '0 0 1rem 0' }}>
              Share this dedicated link with your guest. They can fill out their vehicle and visitor details prior to arriving at the gate.
            </p>

            <div style={{ width: '100%', background: '#faf6f0', border: '1.5px solid #ede5da', borderRadius: '16px', padding: '0.85rem', fontSize: '0.76rem', wordBreak: 'break-all', color: '#1c1917', marginBottom: '1.2rem', fontWeight: '600' }}>
              {inviteLink}
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Jay Sai Ram! Please fill out your visitor pre-approval registration form for Sathya Sai Grama using this link: ${inviteLink}`)}`}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <button type="button" style={{ width: '100%', background: '#25d366', border: 'none', color: 'white', fontWeight: '800', fontSize: '0.88rem', padding: '0.85rem', borderRadius: '9999px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)' }}>
                  📲 Share via WhatsApp
                </button>
              </a>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  setToastMsg('Invite link copied to clipboard!');
                }}
                className="host-btn-primary"
                style={{ width: '100%', padding: '0.85rem', cursor: 'pointer' }}
              >
                📋 Copy Link
              </button>

              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#78716c', padding: '0.6rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '700' }}
              >
                Done / Close
              </button>
            </div>
          </div>
        </IonModal>

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={2500} onDidDismiss={() => setToastMsg('')} />
      </IonContent>
    </IonPage>
  );
}

