import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonToast,
} from '@ionic/react';
import { getVisitHistory, getHostRegistrations, createRegistration } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { History, Calendar, CheckCircle2, RotateCcw, Users, Car, AlertCircle, X, Check } from 'lucide-react';

export default function PastVisitors({ history }) {
  const { user } = useAuth();
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // Re-invite Modal State (Issue #39)
  const [showReInviteModal, setShowReInviteModal] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [reName, setReName] = useState('');
  const [rePhone, setRePhone] = useState('');
  const [reArrival, setReArrival] = useState('');
  const [reDeparture, setReDeparture] = useState('');
  const [reMen, setReMen] = useState(1);
  const [reWomen, setReWomen] = useState(0);
  const [reBoys, setReBoys] = useState(0);
  const [reGirls, setReGirls] = useState(0);
  const [rePlate, setRePlate] = useState('');
  const [reVehicleType, setReVehicleType] = useState('Car');
  const [reRemarks, setReRemarks] = useState('');
  const [submittingReInvite, setSubmittingReInvite] = useState(false);
  const [reInviteError, setReInviteError] = useState('');

  const isPastRecord = (r) => {
    const s = (r.status || '').toUpperCase();
    return s === 'CHECKED_OUT' || 
           s === 'NOT_ARRIVED' || 
           s === 'EXPIRED' || 
           s === 'REJECTED' || 
           s === 'CANCELLED' || 
           s === 'COMPLETED' ||
           (r.valid_until && new Date(r.valid_until) < new Date() && s !== 'INSIDE_CAMPUS');
  };

  const fetchHistory = async () => {
    try {
      const res = await getVisitHistory();
      if (res?.history && res.history.length > 0) {
        const past = res.history.filter(isPastRecord);
        setHistoryList(past);
      } else {
        const hostRes = await getHostRegistrations();
        if (hostRes?.registrations) {
          const past = hostRes.registrations.filter(isPastRecord);
          setHistoryList(past);
        }
      }
    } catch (e) {
      console.warn('Error fetching past visitors:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRefresh = async (e) => {
    await fetchHistory();
    e.detail.complete();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'CHECKED_OUT' || s === 'COMPLETED') {
      return { label: 'Checked Out', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
    }
    if (s === 'NOT_ARRIVED') {
      return { label: 'Not Arrived (Lapsed)', bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
    }
    if (s === 'EXPIRED') {
      return { label: 'Pass Expired', bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' };
    }
    if (s === 'REJECTED') {
      return { label: 'Rejected', bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
    }
    if (s === 'CANCELLED') {
      return { label: 'Cancelled', bg: '#f5f5f4', color: '#78716c', border: '#e7e5e4' };
    }
    return { label: status || 'Archived', bg: '#f5eee6', color: '#78716c', border: '#ebdccc' };
  };

  // Pre-populate re-invite modal from past visitor record (Issue #39)
  const handleOpenReInvite = (record) => {
    setSelectedVisitor(record);
    setReName(record.visitor_name || record.full_name || '');
    setRePhone(record.visitor_phone || record.phone || '');
    setReMen(record.adult_men_count !== undefined ? record.adult_men_count : 1);
    setReWomen(record.adult_women_count !== undefined ? record.adult_women_count : 0);
    setReBoys(record.boys_count !== undefined ? record.boys_count : 0);
    setReGirls(record.girls_count !== undefined ? record.girls_count : 0);
    
    // Vehicle pre-population
    if (record.vehicles && record.vehicles.length > 0) {
      setRePlate(record.vehicles[0].plate_number || '');
      setReVehicleType(record.vehicles[0].vehicle_type || 'Car');
    } else {
      setRePlate(record.vehicle_no || record.registered_plate_number || '');
      setReVehicleType(record.vehicle_type || record.registered_vehicle_type || 'Car');
    }

    setReRemarks(record.remarks || '');
    setReInviteError('');

    // Default visit window: Next upcoming operating day (5:00 AM - 10:00 PM)
    const now = new Date();
    if (now.getHours() >= 20) {
      now.setDate(now.getDate() + 1);
      now.setHours(9, 0, 0, 0);
    } else {
      now.setHours(Math.max(5, now.getHours() + 1), 0, 0, 0);
    }
    const pad = (n) => String(n).padStart(2, '0');
    const arrStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`;
    const depD = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    if (depD.getHours() >= 22) depD.setHours(21, 30, 0, 0);
    const depStr = `${depD.getFullYear()}-${pad(depD.getMonth() + 1)}-${pad(depD.getDate())}T${pad(depD.getHours())}:${pad(depD.getMinutes())}`;

    setReArrival(arrStr);
    setReDeparture(depStr);
    setShowReInviteModal(true);
  };

  const handleArrivalChange = (val) => {
    setReArrival(val);
    if (!val) return;
    const fromD = new Date(val);
    const dateStr = val.split('T')[0];
    let depD = new Date(fromD.getTime() + 4 * 60 * 60 * 1000);
    const maxD = new Date(`${dateStr}T22:00:00`);
    if (depD > maxD) depD = maxD;
    const pad = (n) => String(n).padStart(2, '0');
    setReDeparture(`${dateStr}T${pad(depD.getHours())}:${pad(depD.getMinutes())}`);
  };

  const handleSubmitReInvite = async (e) => {
    e.preventDefault();
    setReInviteError('');

    if (!reArrival || !reDeparture) {
      setReInviteError('Please select both Scheduled Arrival and Departure times.');
      return;
    }

    const fromDate = new Date(reArrival);
    const untilDate = new Date(reDeparture);

    if (fromDate.split ? reArrival.split('T')[0] !== reDeparture.split('T')[0] : false) {
      setReInviteError('Departure must be on the same calendar day as arrival.');
      return;
    }

    if (untilDate <= fromDate) {
      setReInviteError('Departure time must be after arrival time.');
      return;
    }

    const isVipHost = user?.user_type === 'VIP_HOST' || user?.role === 'VIP_HOST';

    const payload = {
      full_name: reName,
      phone: rePhone,
      email: selectedVisitor?.visitor_email || selectedVisitor?.email || '',
      gender: selectedVisitor?.gender || selectedVisitor?.visitor_gender || 'Male',
      visitor_category: isVipHost ? 'VIP' : (selectedVisitor?.visitor_category || 'GENERAL'),
      host_id: user?.id || 1,
      purpose: selectedVisitor?.purpose || (isVipHost ? 'VIP Ashram Re-visit' : 'Ashram Re-visit'),
      visit_type: selectedVisitor?.visit_type || 'HOME',
      stay_required: false,
      valid_from: fromDate.toISOString(),
      valid_until: untilDate.toISOString(),
      adult_men_count: parseInt(reMen, 10) || 1,
      adult_women_count: parseInt(reWomen, 10) || 0,
      boys_count: parseInt(reBoys, 10) || 0,
      girls_count: parseInt(reGirls, 10) || 0,
      children_count: (parseInt(reBoys, 10) || 0) + (parseInt(reGirls, 10) || 0),
      vehicles: rePlate.trim() ? [{ plate_number: rePlate.trim().toUpperCase(), vehicle_type: reVehicleType, driver_name: '', driver_phone: '' }] : [],
      remarks: reRemarks,
      is_spot_registration: false,
    };

    setSubmittingReInvite(true);
    try {
      const res = await createRegistration(payload);
      if (res?.success) {
        setToastMsg(`Re-invitation created successfully! New pass code: ${res.registration?.pass_code || 'Generated'}`);
        setShowReInviteModal(false);
        fetchHistory();
      } else {
        setReInviteError(res?.message || 'Failed to re-invite visitor.');
      }
    } catch (err) {
      setReInviteError(err.response?.data?.message || err.message || 'Failed to re-invite visitor.');
    } finally {
      setSubmittingReInvite(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#faf6f0', borderBottom: '1px solid #ebdccc' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="" color="dark" />
          </IonButtons>
          <IonTitle style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>Past Visitors</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#faf6f0' }}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Section Header */}
        <div className="host-section-header" style={{ marginTop: '0.2rem', marginBottom: '0.9rem' }}>
          <div className="host-section-title-wrap">
            <h3 className="host-section-title">Visit Archives</h3>
            <div className="host-section-underline"></div>
          </div>
          <div className="host-section-count">
            {historyList.length} Archived
          </div>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#78716c', margin: '0 0 1rem 0', fontWeight: '500' }}>
          Archived records of completed, lapsed, or past visits. You can tap <strong>Re-Invite</strong> to easily issue a new pass without re-entering details.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#78716c', fontSize: '0.85rem' }}>
            Loading visit archives...
          </div>
        ) : historyList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#ffffff', borderRadius: '22px', border: '1.5px dashed #ebdccc', color: '#78716c' }}>
            <History size={36} color="#d6c7b2" style={{ marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#1c1917' }}>No past visitor records</p>
            <span style={{ fontSize: '0.78rem', color: '#78716c' }}>Completed, checked-out, or expired visitor passes will be safely preserved here.</span>
          </div>
        ) : (
          historyList.map((r, i) => {
            const badge = getStatusBadge(r.status);
            return (
              <div
                key={r.id || i}
                className="host-visitor-card"
                onClick={() => history && history.push(`/visitor-details/${r.pass_code || r.id}`)}
                style={{ marginBottom: '0.85rem', cursor: 'pointer' }}
              >
                <div className="host-visitor-card-header">
                  <span style={{ 
                    background: '#ffffff', 
                    border: '1px solid #dbeafe', 
                    color: '#1e40af', 
                    borderRadius: '9999px', 
                    padding: '2px 9px', 
                    fontSize: '0.7rem', 
                    fontWeight: '700' 
                  }}>
                    👤 {r.visitor_category || 'General Visitor'}
                  </span>
                  <span style={{ 
                    background: badge.bg, 
                    color: badge.color, 
                    border: `1px solid ${badge.border}`,
                    borderRadius: '9999px', 
                    padding: '2px 9px', 
                    fontSize: '0.7rem', 
                    fontWeight: '700' 
                  }}>
                    {badge.label}
                  </span>
                </div>
                <div className="host-visitor-card-body">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>
                      {r.visitor_name}
                    </h3>
                    {r.pass_code && (
                      <span style={{ fontSize: '0.72rem', color: '#b84018', fontWeight: '700', background: '#fdf2e9', padding: '2px 7px', borderRadius: '6px' }}>
                        {r.pass_code}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: '#78716c' }}>
                    {r.visitor_phone} • {r.purpose || 'Ashram Visit'}
                  </p>
                  
                  {/* Bottom line with Date and Re-Invite button (Issue #39) */}
                  <div style={{ 
                    borderTop: '1px solid #f5eee6', 
                    marginTop: '0.65rem', 
                    paddingTop: '0.55rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    fontSize: '0.74rem', 
                    color: '#57534e' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={13} color="#b84018" />
                      <span>{formatDate(r.valid_from || r.created_at)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReInvite(r);
                      }}
                      style={{
                        background: '#fdede3',
                        border: '1px solid #fed7aa',
                        color: '#b84018',
                        borderRadius: '9999px',
                        padding: '0.35rem 0.85rem',
                        fontSize: '0.74rem',
                        fontWeight: '800',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(184, 64, 24, 0.08)'
                      }}
                    >
                      <RotateCcw size={13} /> Re-Invite
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Re-Invite Visitor Modal (Issue #39) */}
        <IonModal isOpen={showReInviteModal} onDidDismiss={() => setShowReInviteModal(false)}>
          <div style={{ padding: '1.4rem', background: '#ffffff', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1.5px solid #f0e6da', paddingBottom: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RotateCcw size={20} color="#b84018" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1c1917' }}>Re-Invite Past Visitor</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowReInviteModal(false)}
                style={{ background: '#f5eee6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            {reInviteError && (
              <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '12px', padding: '0.7rem', color: '#b91c1c', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={15} /> {reInviteError}
              </div>
            )}

            <form onSubmit={handleSubmitReInvite}>
              <label className="host-label" style={{ marginTop: 0 }}>Visitor Name *</label>
              <input
                type="text"
                required
                className="host-input"
                value={reName}
                onChange={(e) => setReName(e.target.value)}
              />

              <label className="host-label">WhatsApp Number *</label>
              <input
                type="tel"
                required
                className="host-input"
                value={rePhone}
                onChange={(e) => setRePhone(e.target.value)}
              />

              {/* Date & Time Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.6rem' }}>
                <div>
                  <label className="host-label" style={{ marginTop: 0 }}>Arrival Time (SAT) *</label>
                  <input
                    type="datetime-local"
                    required
                    className="host-input"
                    value={reArrival}
                    onChange={(e) => handleArrivalChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="host-label" style={{ marginTop: 0 }}>Departure Time (SDT) *</label>
                  <input
                    type="datetime-local"
                    required
                    className="host-input"
                    value={reDeparture}
                    onChange={(e) => setReDeparture(e.target.value)}
                  />
                </div>
              </div>

              {/* People Counts */}
              <label className="host-label" style={{ marginTop: '0.8rem' }}>Number of People</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.4rem', background: '#faf6f0', padding: '0.6rem', borderRadius: '12px', border: '1px solid #ebdccc' }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#78716c', fontWeight: 'bold' }}>Men</span>
                  <input type="number" min="0" className="host-input" value={reMen} onChange={(e) => setReMen(e.target.value)} />
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#78716c', fontWeight: 'bold' }}>Women</span>
                  <input type="number" min="0" className="host-input" value={reWomen} onChange={(e) => setReWomen(e.target.value)} />
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#78716c', fontWeight: 'bold' }}>Boys</span>
                  <input type="number" min="0" className="host-input" value={reBoys} onChange={(e) => setReBoys(e.target.value)} />
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#78716c', fontWeight: 'bold' }}>Girls</span>
                  <input type="number" min="0" className="host-input" value={reGirls} onChange={(e) => setReGirls(e.target.value)} />
                </div>
              </div>

              {/* Vehicle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem', marginTop: '0.8rem' }}>
                <div>
                  <label className="host-label" style={{ marginTop: 0 }}>Vehicle Plate (Optional)</label>
                  <input
                    type="text"
                    className="host-input"
                    placeholder="e.g. KA-01-AB-1234"
                    value={rePlate}
                    onChange={(e) => setRePlate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="host-label" style={{ marginTop: 0 }}>Vehicle Type</label>
                  <select
                    className="host-input"
                    value={reVehicleType}
                    onChange={(e) => setReVehicleType(e.target.value)}
                  >
                    <option value="Car">Car</option>
                    <option value="Two-Wheeler">Two-Wheeler</option>
                    <option value="Auto Rickshaw">Auto Rickshaw</option>
                    <option value="Van">Van</option>
                    <option value="Bus">Bus</option>
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <label className="host-label" style={{ marginTop: '0.8rem' }}>Remarks (Optional)</label>
              <textarea
                rows={2}
                className="host-input"
                placeholder="Optional notes for this visit"
                value={reRemarks}
                onChange={(e) => setReRemarks(e.target.value)}
              />

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.2rem' }}>
                <button
                  type="button"
                  onClick={() => setShowReInviteModal(false)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid #ebdccc', background: '#faf6f0', color: '#57534e', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReInvite}
                  className="host-btn-primary"
                  style={{ flex: 1.4, padding: '0.75rem', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: submittingReInvite ? 'wait' : 'pointer' }}
                >
                  <RotateCcw size={15} />
                  {submittingReInvite ? 'Creating Pass...' : 'Issue Re-Invite Pass'}
                </button>
              </div>
            </form>
          </div>
        </IonModal>

        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          duration={3000}
          onDidDismiss={() => setToastMsg('')}
        />
      </IonContent>
    </IonPage>
  );
}
