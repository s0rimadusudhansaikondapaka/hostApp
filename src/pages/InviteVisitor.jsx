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

  // Accompanying Breakdown & Mode
  const [registrationMode, setRegistrationMode] = useState('Single');
  const [adultMen, setAdultMen] = useState(1);
  const [adultWomen, setAdultWomen] = useState(0);
  const [boysCount, setBoysCount] = useState(0);
  const [girlsCount, setGirlsCount] = useState(0);

  // Visit Window Dates
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

  const getDefaultUntil = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(21, 0, 0, 0); // 9:00 PM
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
    setCategory('GENERAL');
    setPurpose('');
    setRegistrationMode('Single');
    setAdultMen(1);
    setAdultWomen(0);
    setBoysCount(0);
    setGirlsCount(0);
    setValidFrom(getDefaultFrom());
    setValidUntil(getDefaultUntil());
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
      setError('Arrival Time (ETA) must be between 5:00 AM and 10:00 PM.');
      return;
    }
    if (untilH < 5 || untilH > 22 || (untilH === 22 && untilM > 0)) {
      setError('Departure Time (ETD) must be between 5:00 AM and 10:00 PM.');
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
    const computedMen = isSingle ? 1 : parseInt(adultMen) || 0;
    const computedWomen = isSingle ? 0 : parseInt(adultWomen) || 0;
    const computedBoys = isSingle ? 0 : parseInt(boysCount) || 0;
    const computedGirls = isSingle ? 0 : parseInt(girlsCount) || 0;

    const payload = {
      full_name: fullName,
      phone,
      email,
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
      setError(err.response?.data?.message || 'Failed to submit visitor invite.');
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
        <IonToolbar style={{ '--background': '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="" />
          </IonButtons>
          <IonTitle style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>Invite Visitor</IonTitle>
          <IonButtons slot="end">
            <button
              type="button"
              onClick={handleShareInvite}
              disabled={generatingToken}
              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', borderRadius: '8px', padding: '0.4rem 0.65rem', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: generatingToken ? 'wait' : 'pointer', marginRight: '0.5rem', opacity: generatingToken ? 0.7 : 1 }}
            >
              <Share2 size={14} /> {generatingToken ? 'Generating...' : 'Share Link'}
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#f8fafc' }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '3rem' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* VIP / HOD Direct Pass Privileges Notice */}
          {isVipOrHodHost && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '0.7rem 0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#166534' }}>
                  Direct Gate Pass Generation
                </div>
                <div style={{ fontSize: '0.74rem', color: '#15803d' }}>
                  As a VIP / HOD Host, your guest invitations are directly approved upon creation with no L2 / PRO verification delay.
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Visitor Basic Information */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.6rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#1e3a8a' }}>
              1. Visitor Basic Information
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
                <label className="host-label">Mobile Number *</label>
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
                <label className="host-label">Email (Optional)</label>
                <input
                  type="email"
                  className="host-input"
                  placeholder="visitor@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
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

            <label className="host-label">Purpose of Visit</label>
            <input
              type="text"
              className="host-input"
              placeholder="e.g. Darshan, Meeting, Delivery"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          {/* Section 2: Visit Date & Time Window */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.6rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#1e3a8a' }}>
              2. Visit Schedule (5:00 AM – 10:00 PM)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <div>
                <label className="host-label" style={{ marginTop: 0 }}>Arrival Date/Time (ETA) *</label>
                <input
                  type="datetime-local"
                  required
                  min={getMinDateTime()}
                  className="host-input"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="host-label" style={{ marginTop: 0 }}>Departure Date/Time (ETD) *</label>
                <input
                  type="datetime-local"
                  required
                  min={validFrom || getMinDateTime()}
                  className="host-input"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '0.35rem' }}>
              * Operating gate hours: 5:00 AM to 10:00 PM. Past dates are strictly blocked.
            </span>
          </div>

          {/* Section 3: Group & Accompanying Count */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.6rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#1e3a8a' }}>
              3. Registration Mode &amp; People Count
            </h3>

            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <label style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: registrationMode === 'Single' ? '2px solid #2563eb' : '1px solid #cbd5e1', background: registrationMode === 'Single' ? '#eff6ff' : '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
                <input type="radio" name="regMode" value="Single" checked={registrationMode === 'Single'} onChange={() => setRegistrationMode('Single')} />
                👤 Single Visitor
              </label>
              <label style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: registrationMode === 'Group' ? '2px solid #2563eb' : '1px solid #cbd5e1', background: registrationMode === 'Group' ? '#eff6ff' : '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
                <input type="radio" name="regMode" value="Group" checked={registrationMode === 'Group'} onChange={() => setRegistrationMode('Group')} />
                👥 Group Visit
              </label>
            </div>

            {registrationMode === 'Group' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label className="host-label" style={{ marginTop: 0, fontSize: '0.75rem' }}>Men (👨)</label>
                  <input type="number" min="0" className="host-input" value={adultMen} onChange={(e) => setAdultMen(e.target.value)} />
                </div>
                <div>
                  <label className="host-label" style={{ marginTop: 0, fontSize: '0.75rem' }}>Women (👩)</label>
                  <input type="number" min="0" className="host-input" value={adultWomen} onChange={(e) => setAdultWomen(e.target.value)} />
                </div>
                <div>
                  <label className="host-label" style={{ marginTop: 0, fontSize: '0.75rem' }}>Boys (👦)</label>
                  <input type="number" min="0" className="host-input" value={boysCount} onChange={(e) => setBoysCount(e.target.value)} />
                </div>
                <div>
                  <label className="host-label" style={{ marginTop: 0, fontSize: '0.75rem' }}>Girls (👧)</label>
                  <input type="number" min="0" className="host-input" value={girlsCount} onChange={(e) => setGirlsCount(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Vehicles (Up to 5) */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#1e3a8a' }}>
                4. Vehicle Details (Up to 5)
              </h3>
              {vehicles.length < 5 && (
                <button
                  type="button"
                  onClick={addVehicle}
                  style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer' }}
                >
                  <Plus size={14} /> Add Vehicle ({vehicles.length}/5)
                </button>
              )}
            </div>

            {vehicles.map((veh, idx) => (
              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.6rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#334155' }}>Vehicle #{idx + 1}</span>
                  {vehicles.length > 1 && (
                    <button type="button" onClick={() => removeVehicle(idx)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}>
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
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.6rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#1e3a8a' }}>
              5. Accommodation &amp; Remarks
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '0.8rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>Accommodation Required?</span>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>Overnight ashram room stay approval</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setAccommodationRequired(true)}
                  style={{ padding: '0.35rem 0.75rem', borderRadius: '20px', border: accommodationRequired ? '2px solid #2563eb' : '1px solid #cbd5e1', background: accommodationRequired ? '#2563eb' : '#ffffff', color: accommodationRequired ? '#ffffff' : '#475569', fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setAccommodationRequired(false)}
                  style={{ padding: '0.35rem 0.75rem', borderRadius: '20px', border: !accommodationRequired ? '2px solid #0f172a' : '1px solid #cbd5e1', background: !accommodationRequired ? '#0f172a' : '#ffffff', color: !accommodationRequired ? '#ffffff' : '#475569', fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer' }}
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

          {/* Action Buttons matching wireframe Screen 3 */}
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button
              type="button"
              onClick={handleReset}
              className="host-btn-outline"
              style={{ flex: 1, padding: '0.75rem', cursor: 'pointer' }}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="host-btn-primary"
              style={{ flex: 1, padding: '0.75rem', border: 'none', cursor: 'pointer' }}
            >
              {submitting ? 'Submitting...' : 'Submit Invite'}
            </button>
          </div>
        </form>

        {/* WhatsApp / Email Invite Link Modal */}
        <IonModal isOpen={showShareModal} onDidDismiss={() => setShowShareModal(false)}>
          <div style={{ padding: '1.5rem', background: '#ffffff', height: '100%' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.4rem 0' }}>
              Share Pre-Approval Guest Invite Link
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: '1.4', margin: '0 0 1.2rem 0' }}>
              Share this single-use link directly with your guest. They can fill out their details and vehicle information before arrival.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem', fontSize: '0.78rem', wordBreak: 'break-all', color: '#1e293b', marginBottom: '1.2rem' }}>
              {inviteLink}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Jay Sai Ram! Please fill out your visitor pre-approval registration form for Sathya Sai Grama using this link: ${inviteLink}`)}`}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <button type="button" style={{ width: '100%', background: '#25d366', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '0.88rem', padding: '0.75rem', borderRadius: '9999px', cursor: 'pointer' }}>
                  📲 Share via WhatsApp
                </button>
              </a>

              <a
                href={`mailto:?subject=${encodeURIComponent('Sathya Sai Grama - Visitor Pre-Approval Invite')}&body=${encodeURIComponent(`Jay Sai Ram!\n\nPlease fill out your visitor registration using this link prior to your arrival:\n\n${inviteLink}\n\nThank you!`)}`}
                style={{ textDecoration: 'none' }}
              >
                <button type="button" style={{ width: '100%', background: '#2563eb', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '0.88rem', padding: '0.75rem', borderRadius: '9999px', cursor: 'pointer' }}>
                  ✉️ Share via Email
                </button>
              </a>

              {navigator.share && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.share({
                        title: 'Sathya Sai Grama - Visitor Invite',
                        text: `Jay Sai Ram! Please fill out your visitor pre-approval registration form for Sathya Sai Grama using this link: ${inviteLink}`,
                        url: inviteLink,
                      });
                    } catch (e) {}
                  }}
                  style={{ width: '100%', background: '#0f172a', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '0.88rem', padding: '0.75rem', borderRadius: '9999px', cursor: 'pointer' }}
                >
                  🔗 Share via Other Apps
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  setToastMsg('Invite link copied to clipboard!');
                }}
                className="host-btn-outline"
                style={{ width: '100%', padding: '0.75rem', cursor: 'pointer', marginTop: '0.4rem' }}
              >
                📋 Copy Link
              </button>

              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', padding: '0.5rem', cursor: 'pointer', marginTop: '0.5rem', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </IonModal>

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={2500} onDidDismiss={() => setToastMsg('')} />
      </IonContent>
    </IonPage>
  );
}
