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
import { Share2, Plus, Trash2, CheckCircle, Calendar, Users, Car, AlertCircle, Download, Printer } from 'lucide-react';
import QRCode from 'qrcode';

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

  const isVipHostOnly = user?.user_type === 'VIP_HOST' || user?.role === 'VIP_HOST';
  const isVipHost = isVipHostOnly || (user?.user_type && user.user_type.includes('VIP_HOST')) || (user?.role && user.role.includes('VIP_HOST'));
  const isVipOrHodHost = isVipHost || user?.role === 'HOD' || user?.user_type === 'HOD';

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState(isVipHost ? 'VIP' : 'GENERAL');
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
    if (!val) {
      setValidFrom('');
      return;
    }
    const [datePart, timePart] = val.split('T');
    let [h, m] = (timePart || '05:00').split(':').map(Number);

    // Block/clamp hours before 5am (00..04) and after 10pm (23) - Issue #47
    if (h < 5) {
      h = 5; m = 0;
      setToastMsg('Timings before 5:00 AM are restricted. Visiting hours: 5:00 AM – 10:00 PM.');
    } else if (h > 22 || (h === 22 && m > 0)) {
      h = 22; m = 0;
      setToastMsg('Timings after 10:00 PM are restricted. Visiting hours: 5:00 AM – 10:00 PM.');
    }
    const pad = (n) => String(n).padStart(2, '0');
    const clampedSAT = `${datePart}T${pad(h)}:${pad(m)}`;
    setValidFrom(clampedSAT);

    // Enforce 05:00 <= SAT <= SDT <= 22:00 - Issue #48
    if (!validUntil || validUntil.split('T')[0] !== datePart || new Date(validUntil) <= new Date(clampedSAT)) {
      let depD = new Date(new Date(clampedSAT).getTime() + 4 * 60 * 60 * 1000);
      const maxD = new Date(`${datePart}T22:00:00`);
      if (depD > maxD) depD = maxD;
      setValidUntil(`${datePart}T${pad(depD.getHours())}:${pad(depD.getMinutes())}`);
    }
  };

  const handleDepartureChange = (val) => {
    if (!val) {
      setValidUntil('');
      return;
    }
    const [datePart, timePart] = val.split('T');
    let [h, m] = (timePart || '22:00').split(':').map(Number);

    // Block/clamp hours before 5am and after 10pm - Issue #47
    if (h < 5) {
      h = 5; m = 30;
      setToastMsg('Timings before 5:00 AM are restricted. Visiting hours: 5:00 AM – 10:00 PM.');
    } else if (h > 22 || (h === 22 && m > 0)) {
      h = 22; m = 0;
      setToastMsg('Timings after 10:00 PM are restricted. Visiting hours: 5:00 AM – 10:00 PM.');
    }
    const pad = (n) => String(n).padStart(2, '0');
    const clampedSDT = `${datePart}T${pad(h)}:${pad(m)}`;
    setValidUntil(clampedSDT);

    // SAT must be before SDT - Issue #48
    if (!validFrom || validFrom.split('T')[0] !== datePart || new Date(validFrom) >= new Date(clampedSDT)) {
      let arrD = new Date(new Date(clampedSDT).getTime() - 2 * 60 * 60 * 1000);
      const minD = new Date(`${datePart}T05:00:00`);
      if (arrD < minD) arrD = minD;
      setValidFrom(`${datePart}T${pad(arrD.getHours())}:${pad(arrD.getMinutes())}`);
    }
  };

  // Vehicles (Up to 5)
  const [vehicles, setVehicles] = useState([
    { plate_number: '', vehicle_type: 'Select', driver_name: '', driver_phone: '' },
  ]);

  const [accommodationRequired, setAccommodationRequired] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [createdPassModal, setCreatedPassModal] = useState(null);
  const [createdPassQrUrl, setCreatedPassQrUrl] = useState('');

  const handleDownloadPng = (qrUrl, passCode) => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `${passCode || 'GatePass'}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPdf = (pass, qrUrl) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gate Pass - ${pass?.pass_code || 'Ashram Pass'}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #1c1917; background: #fff; }
            .pass-container { max-width: 500px; margin: 0 auto; border: 2.5px solid #b84018; border-radius: 16px; padding: 24px; text-align: center; }
            .header { border-bottom: 2px solid #b84018; padding-bottom: 12px; margin-bottom: 16px; }
            .title { font-size: 22px; font-weight: bold; color: #4e081d; margin: 0; }
            .subtitle { font-size: 13px; color: #b84018; font-weight: bold; margin-top: 4px; }
            .qr-img { width: 220px; height: 220px; margin: 16px auto; display: block; border: 1.5px solid #e2e8f0; border-radius: 12px; }
            .code-badge { display: inline-block; background: #fef3c7; color: #92400e; border: 1.5px solid #fde68a; font-size: 24px; font-weight: 800; padding: 6px 18px; border-radius: 8px; margin: 8px 0; letter-spacing: 1px; }
            .meta-table { width: 100%; text-align: left; margin-top: 16px; border-collapse: collapse; font-size: 13px; }
            .meta-table td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
            .meta-label { color: #64748b; font-weight: 600; width: 45%; }
            .meta-val { color: #0f172a; font-weight: 700; }
            .footer { margin-top: 20px; font-size: 11px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="pass-container">
            <div class="header">
              <h1 class="title">Sathya Sai Grama, Muddenahalli</h1>
              <div class="subtitle">Official Visitor Gate Entry Pass</div>
            </div>
            <div class="code-badge">${pass?.pass_code || 'GATE-PASS'}</div>
            <img class="qr-img" src="${qrUrl || pass?.qr_code_url || ''}" alt="Gate Pass QR" />
            <h2 style="margin: 4px 0; font-size: 18px;">${pass?.visitor_name || 'Visitor'}</h2>
            <div style="font-size: 13px; color: #64748b; margin-bottom: 12px;">${pass?.visitor_phone || ''}</div>
            <table class="meta-table">
              <tr><td class="meta-label">Pass Category</td><td class="meta-val">${pass?.visitor_category || 'GENERAL'}</td></tr>
              <tr><td class="meta-label">Designated Host</td><td class="meta-val">${user?.name || 'Ashram Host'}</td></tr>
              <tr><td class="meta-label">Scheduled Arrival (SAT)</td><td class="meta-val">${new Date(pass?.valid_from).toLocaleString()}</td></tr>
              <tr><td class="meta-label">Scheduled Departure (SDT)</td><td class="meta-val">${new Date(pass?.valid_until).toLocaleString()}</td></tr>
              <tr><td class="meta-label">Total People Count</td><td class="meta-val">${pass?.person_count || 1} Person(s)</td></tr>
              <tr><td class="meta-label">Pass Status</td><td class="meta-val">${pass?.status || 'APPROVED'}</td></tr>
            </table>
            <div class="footer">
              Present this pass or digital QR at Ashram Security Gates upon arrival.<br/>
              Visiting Hours: 05:00 AM – 10:00 PM IST
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };
  const [error, setError] = useState('');

  // Share Link Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareToken, setShareToken] = useState('');
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
    setCategory(isVipHost ? 'VIP' : 'GENERAL');
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

    // Input Validations (Issue #23)
    const trimmedName = fullName.trim();
    if (trimmedName.length < 3 || trimmedName.length > 50) {
      setError('Visitor Name must be between 3 and 50 characters long.');
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      setError('Phone number must have between 10 and 15 digits (currently ' + phoneDigits.length + ' digits).');
      return;
    }

    const now = new Date();
    const fromDate = new Date(validFrom);
    const untilDate = new Date(validUntil);

    // 1. Expired Arrival Date Validation
    if (fromDate < new Date(now.getTime() - 10 * 60 * 1000)) {
      setError('Arrival Date/Time cannot be in the past or already expired.');
      return;
    }

    // 2. Same-Day Departure Validation (Issues #11 & #10)
    const fromDateOnly = validFrom.split('T')[0];
    const untilDateOnly = validUntil.split('T')[0];
    if (fromDateOnly !== untilDateOnly) {
      setError('Scheduled Departure Date must be on the same day as Scheduled Arrival Date.');
      return;
    }

    if (untilDate <= fromDate) {
      setError('Scheduled Departure Time must be after Scheduled Arrival Time.');
      return;
    }

    const fromH = fromDate.getHours();
    const fromM = fromDate.getMinutes();
    const untilH = untilDate.getHours();
    const untilM = untilDate.getMinutes();

    // 3. 5:00 AM - 10:00 PM Operating Hours Validation (Issue #2)
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
      visitor_category: isVipHost ? 'VIP' : category,
      host_id: user?.id || 1,
      purpose: purpose.trim() || (isVipHost ? 'VIP Ashram Visit' : 'Ashram Visit'),
      visit_type: visitType,
      stay_required: accommodationRequired,
      valid_from: new Date(validFrom).toISOString(),
      valid_until: new Date(validUntil).toISOString(),
      adult_men_count: computedMen,
      adult_women_count: computedWomen,
      boys_count: computedBoys,
      girls_count: computedGirls,
      children_count: computedBoys + computedGirls,
      person_count: isSingle ? 1 : (computedMen + computedWomen + computedBoys + computedGirls),
      vehicles: validVehicles,
      is_spot_registration: false,
    };

    setSubmitting(true);
    try {
      const res = await createRegistration(payload);
      if (res?.success) {
        setToastMsg('Visitor invite submitted successfully!');
        const reg = res.registration || {};
        reg.visitor_name = fullName;
        reg.visitor_phone = phone;
        reg.visitor_category = category;
        reg.valid_from = validFrom;
        reg.valid_until = validUntil;
        reg.person_count = isSingle ? 1 : (computedMen + computedWomen + computedBoys + computedGirls);

        let qrUrl = reg.qr_code_url;
        if (!qrUrl) {
          try {
            const qrPayload = JSON.stringify({
              passCode: reg.pass_code,
              refId: reg.id,
              regId: reg.id,
              visitorName: fullName,
              phone: phone,
              category: category,
              hostName: user?.name || 'Ashram Host',
              validFrom: validFrom,
              validUntil: validUntil,
              personCount: reg.person_count,
              status: reg.status || 'APPROVED',
              isVvip: category === 'VIP' || !!isVipHost
            });
            qrUrl = await QRCode.toDataURL(qrPayload, { width: 500, margin: 2 });
          } catch (e) {}
        }
        setCreatedPassQrUrl(qrUrl);
        setCreatedPassModal(reg);
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
    setShareToken('');
    setGeneratingToken(true);
    try {
      const res = await generateInviteToken();
      if (res?.token) {
        setShareToken(res.token);
      }
    } catch (err) {
      console.error('Failed to generate invite token:', err);
    } finally {
      setGeneratingToken(false);
      setShowShareModal(true);
    }
  };

  const frontendUrl = getFrontendUrl();
  const inviteLink = shareToken ? `${frontendUrl}/?invite=true&token=${shareToken}` : '';

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#faf6f0', borderBottom: '1px solid #ebdccc' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="" color="dark" />
          </IonButtons>
          <IonTitle style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>Invite Visitor</IonTitle>
          
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
              minLength={3}
              maxLength={50}
              className="host-input"
              placeholder="Enter full name (3 to 50 characters)"
              value={fullName}
              onChange={(e) => {
                const filtered = e.target.value.replace(/[^a-zA-Z\s.-]/g, '');
                setFullName(filtered);
              }}
            />
            <div style={{ fontSize: '0.72rem', color: fullName.trim().length >= 3 && fullName.trim().length <= 50 ? '#15803d' : '#78716c', marginTop: '3px', fontWeight: '600' }}>
              Characters: {fullName.trim().length} / 50 (min 3)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.4rem' }}>
              <div>
                <label className="host-label">WhatsApp Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={15}
                  className="host-input"
                  placeholder="e.g. 9876543210 (10 to 15 digits)"
                  value={phone}
                  onChange={(e) => {
                    let filtered = e.target.value.replace(/[^0-9+]/g, '');
                    if (filtered.indexOf('+') > 0) {
                      filtered = filtered[0] === '+' ? '+' + filtered.slice(1).replace(/\+/g, '') : filtered.replace(/\+/g, '');
                    }
                    setPhone(filtered);
                  }}
                />
                <div style={{ fontSize: '0.72rem', color: phone.replace(/\D/g, '').length >= 10 && phone.replace(/\D/g, '').length <= 15 ? '#15803d' : '#b45309', marginTop: '3px', fontWeight: '600' }}>
                  Digits: {phone.replace(/\D/g, '').length} / 15 (min 10)
                </div>
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
                  max={validUntil ? validUntil : (validFrom ? `${validFrom.split('T')[0]}T22:00` : undefined)}
                  className="host-input"
                  value={validFrom}
                  onChange={(e) => handleArrivalChange(e.target.value)}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="host-label" style={{ margin: 0 }}>Scheduled Departure Date/Time (SDT) *</label>
                  <span style={{ fontSize: '0.68rem', color: '#9a3412', background: '#ffedd5', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                    Same-Day Window
                  </span>
                </div>
                <input
                  type="datetime-local"
                  required
                  min={validFrom ? validFrom : (validUntil ? `${validUntil.split('T')[0]}T05:00` : getMinDateTime())}
                  max={validFrom ? `${validFrom.split('T')[0]}T22:00` : (validUntil ? `${validUntil.split('T')[0]}T22:00` : undefined)}
                  className="host-input"
                  value={validUntil}
                  onChange={(e) => handleDepartureChange(e.target.value)}
                />
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#78716c', display: 'block', marginTop: '0.5rem', fontWeight: '500', lineHeight: 1.35 }}>
              * Phase 1 enforces strictly single-day visits during operating hours (5:00 AM – 10:00 PM). Departure must be on the same calendar day as arrival.
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

          {/* Section 5: Remarks (Issues #21, #22, #27) */}
          <div style={{ background: '#ffffff', border: '1.5px solid #ede5da', borderRadius: '20px', padding: '1.1rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(184, 64, 24, 0.04)' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#b84018', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>5.</span> {isVipHost ? 'Remarks' : 'Accommodation & Remarks'}
            </h3>

            {!isVipHost && (
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
            )}

            <label className="host-label">{isVipHost ? 'Remarks (Optional)' : 'Remarks for Security / Approver'}</label>
            <textarea
              rows={2}
              className="host-input"
              placeholder={isVipHost ? 'Add optional remarks or notes' : 'Add optional notes or purpose details'}
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
        <IonModal isOpen={showShareModal} onDidDismiss={() => { setShowShareModal(false); setShareToken(''); }}>
          <div style={{ padding: '1.5rem', background: '#ffffff', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {/* Modal Header */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '1.5px solid #f0e6da', paddingBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Share2 size={20} color="#b84018" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>Share Pre-Approval Link</h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowShareModal(false); setShareToken(''); }}
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

            <div style={{ width: '100%', background: '#faf6f0', border: '1.5px solid #ede5da', borderRadius: '16px', padding: '0.85rem', marginBottom: '1.2rem', textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#57534e', display: 'block', marginBottom: '0.35rem' }}>
                Single-Use Guest Invite Link
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  onClick={(e) => e.target.select()}
                  style={{
                    margin: 0,
                    fontSize: '0.78rem',
                    background: '#ffffff',
                    flex: 1,
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.55rem',
                    color: '#1c1917',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink);
                    setCopiedLink(true);
                    setToastMsg('Invite link copied to clipboard!');
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  style={{
                    margin: 0,
                    whiteSpace: 'nowrap',
                    background: copiedLink ? '#15803d' : '#b84018',
                    border: 'none',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.78rem',
                    borderRadius: '8px',
                    padding: '0.55rem 0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {copiedLink ? '✓ Copied!' : '📋 Copy Link'}
                </button>
              </div>
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
                onClick={() => setShowShareModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#78716c', padding: '0.6rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '700' }}
              >
                Done / Close
              </button>
            </div>
          </div>
        </IonModal>

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={2500} onDidDismiss={() => setToastMsg('')} />
      
        {/* Issue #53 & #56: Post-Submission QR Code Modal */}
        <IonModal isOpen={!!createdPassModal} onDidDismiss={() => { setCreatedPassModal(null); history.push('/approval-status'); }}>
          <div style={{ padding: '1.5rem', background: '#ffffff', height: '100%', overflowY: 'auto', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1.5px solid #f0e6da', paddingBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} color="#15803d" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1c1917' }}>Visitor Pass Generated</h3>
              </div>
              <button
                type="button"
                onClick={() => { setCreatedPassModal(null); history.push('/approval-status'); }}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#78716c' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#fffaf5', border: '2px solid #b84018', borderRadius: '16px', padding: '1.2rem', margin: '0.8rem 0' }}>
              <div style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', border: '1.5px solid #fde68a', padding: '0.3rem 0.9rem', borderRadius: '9999px', fontSize: '0.95rem', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '0.8rem' }}>
                {createdPassModal?.pass_code || 'PASS'}
              </div>

              {createdPassQrUrl && (
                <div style={{ background: '#ffffff', padding: '0.6rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-block', margin: '0 auto 0.8rem auto' }}>
                  <img src={createdPassQrUrl} alt="QR Code" style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto' }} />
                </div>
              )}

              <h3 style={{ margin: '0.2rem 0', fontSize: '1.2rem', fontWeight: '800', color: '#1c1917' }}>
                {createdPassModal?.visitor_name}
              </h3>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.82rem', color: '#78716c' }}>
                Phone: <strong>{createdPassModal?.visitor_phone}</strong> • Total Guests: <strong>{createdPassModal?.person_count || 1}</strong>
              </p>
              <div style={{ fontSize: '0.76rem', color: '#57534e', borderTop: '1px solid #f5eee6', paddingTop: '0.5rem', textAlign: 'left' }}>
                <div><strong>Arrival:</strong> {new Date(createdPassModal?.valid_from).toLocaleString()}</div>
                <div><strong>Departure:</strong> {new Date(createdPassModal?.valid_until).toLocaleString()}</div>
              </div>
            </div>

            {/* Sharing & Download Options (Issue #53 & #56) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => {
                  const passUrl = `${getFrontendUrl()}/pass/${createdPassModal?.pass_code}`;
                  const msg = `Jay Sai Ram! Here is your official Gate Pass for Sathya Sai Grama:

Guest: ${createdPassModal?.visitor_name}
Pass Code: ${createdPassModal?.pass_code}
Category: ${createdPassModal?.visitor_category || 'General'}

Digital Pass Link: ${passUrl}

Please present this QR code at Ashram Security Gate upon arrival.`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="host-btn-primary"
                style={{ width: '100%', padding: '0.75rem', background: '#15803d', borderColor: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold' }}
              >
                📱 Share via WhatsApp
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleDownloadPng(createdPassQrUrl, createdPassModal?.pass_code)}
                  className="host-btn-outline"
                  style={{ flex: 1, padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.82rem' }}
                >
                  <Download size={15} /> Download PNG
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPdf(createdPassModal, createdPassQrUrl)}
                  className="host-btn-outline"
                  style={{ flex: 1, padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.82rem' }}
                >
                  <Printer size={15} /> Download PDF
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${getFrontendUrl()}/pass/${createdPassModal?.pass_code}`);
                  setToastMsg('Gate pass link copied to clipboard!');
                }}
                className="host-btn-secondary"
                style={{ width: '100%', padding: '0.65rem', fontWeight: '600', fontSize: '0.82rem' }}
              >
                🔗 Copy Pass Link
              </button>

              <button
                type="button"
                onClick={() => { setCreatedPassModal(null); history.push('/approval-status'); }}
                style={{ width: '100%', padding: '0.7rem', marginTop: '0.5rem', background: '#b84018', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.88rem', cursor: 'pointer' }}
              >
                Done / View Approvals
              </button>
            </div>
          </div>
        </IonModal>

      </IonContent>
    </IonPage>
  );
}

