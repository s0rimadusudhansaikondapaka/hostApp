import React, { useState, useEffect } from 'react';
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
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { getHostRegistrations, updateApproval } from '../services/api';
import { Clock, CheckCircle2, XCircle, Search, User, Calendar, Car, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ApprovalStatus({ history }) {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Review & Approval Modal State
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewPriority, setReviewPriority] = useState('P3');
  const [reviewVisitType, setReviewVisitType] = useState('HOME');
  const [reviewVisitorName, setReviewVisitorName] = useState('');
  const [reviewVisitorPhone, setReviewVisitorPhone] = useState('');
  const [reviewPurpose, setReviewPurpose] = useState('');
  const [reviewMenCount, setReviewMenCount] = useState(1);
  const [reviewWomenCount, setReviewWomenCount] = useState(0);
  const [reviewChildrenCount, setReviewChildrenCount] = useState(0);
  const [reviewVehicles, setReviewVehicles] = useState([]);
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchRegistrations = async () => {
    try {
      const res = await getHostRegistrations();
      if (res?.registrations) {
        setRegistrations(res.registrations);
      }
    } catch (err) {
      console.warn('Failed to fetch approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleRefresh = async (e) => {
    await fetchRegistrations();
    e.detail.complete();
  };

  const openReviewModal = (reg) => {
    setReviewItem(reg);
    setReviewRemarks(reg.remarks || '');
    setReviewPriority(reg.priority || 'P3');
    setReviewVisitType(reg.visit_type || (user?.role === 'RESIDENT' ? 'HOME' : 'OFFICE'));
    setReviewVisitorName(reg.visitor_name || '');
    setReviewVisitorPhone(reg.visitor_phone || '');
    setReviewPurpose(reg.purpose || '');
    setReviewMenCount(reg.adult_men_count !== undefined ? reg.adult_men_count : 1);
    setReviewWomenCount(reg.adult_women_count !== undefined ? reg.adult_women_count : 0);
    setReviewChildrenCount(reg.children_count !== undefined ? reg.children_count : ((reg.boys_count || 0) + (reg.girls_count || 0)));
    setReviewVehicles(reg.vehicles && reg.vehicles.length > 0 ? reg.vehicles.map((v) => ({ ...v })) : []);
  };

  const handleApprovalAction = async (action) => {
    if (!reviewItem) return;
    setSubmittingAction(true);
    try {
      const res = await updateApproval(
        reviewItem.id,
        action,
        reviewRemarks || `Action ${action} by Host ${user?.name}`,
        {
          priority: reviewPriority,
          visit_type: reviewVisitType,
          visitor_name: reviewVisitorName,
          visitor_phone: reviewVisitorPhone,
          purpose: reviewPurpose,
          adult_men_count: reviewMenCount,
          adult_women_count: reviewWomenCount,
          children_count: reviewChildrenCount,
          vehicles: reviewVehicles,
        }
      );
      if (res?.success) {
        setToastMsg(res.message || `Visitor #${reviewItem.id} ${action.toLowerCase()}ed!`);
        setReviewItem(null);
        fetchRegistrations();
      } else {
        setToastMsg(res?.message || 'Approval action failed.');
      }
    } catch (err) {
      setToastMsg(err.response?.data?.message || 'Failed to update approval.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filter Logic
  const filtered = registrations.filter((r) => {
    // Tab filter: Only PENDING_L1 requires host approval action
    if (activeTab === 'PENDING') {
      if (r.status !== 'PENDING_L1') return false;
    } else if (activeTab === 'APPROVED') {
      if (r.status !== 'APPROVED') return false;
    } else if (activeTab === 'REJECTED') {
      if (r.status !== 'REJECTED') return false;
    } else if (activeTab === 'CHECKED_IN') {
      if (r.status !== 'INSIDE_CAMPUS') return false;
    }

    // Search filter
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.visitor_name && r.visitor_name.toLowerCase().includes(q)) ||
      (r.visitor_phone && r.visitor_phone.includes(q)) ||
      (r.pass_code && r.pass_code.toLowerCase().includes(q)) ||
      (r.purpose && r.purpose.toLowerCase().includes(q))
    );
  });

  const isVipOrHodHost = user?.role === 'HOD' || user?.user_type === 'HOD' || user?.role === 'VIP_HOST' || user?.user_type === 'VIP_HOST' || (user?.user_type && user.user_type.includes('VIP_HOST')) || (user?.role && user.role.includes('VIP_HOST'));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="host-badge" style={{ background: '#dcfce7', color: '#15803d' }}>✓ Approved</span>;
      case 'INSIDE_CAMPUS':
        return <span className="host-badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>🏢 Inside Campus</span>;
      case 'REJECTED':
        return <span className="host-badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>❌ Rejected</span>;
      case 'CHECKED_OUT':
        return <span className="host-badge" style={{ background: '#f1f5f9', color: '#475569' }}>🚪 Checked-Out</span>;
      case 'PENDING_L1':
        return <span className="host-badge" style={{ background: '#fef3c7', color: '#b45309' }}>⏳ Pending Host</span>;
      case 'PENDING_L2':
        return <span className="host-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>✓ Approved (PRO L2)</span>;
      case 'PENDING_ACCOMMODATION':
        return <span className="host-badge" style={{ background: '#f3e8ff', color: '#6b21a8' }}>✓ Approved (Room)</span>;
      default:
        return <span className="host-badge" style={{ background: '#fef3c7', color: '#b45309' }}>⏳ Pending</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#faf6f0', borderBottom: '1px solid #ebdccc' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="" color="dark" />
          </IonButtons>
          <IonTitle style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>Approval Status</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#faf6f0' }}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* 1. Horizontal Filter Chips matching Attachment 1 */}
        <div className="host-chips-row" style={{ marginTop: '0.2rem', marginBottom: '0.8rem' }}>
          {[
            { id: 'ALL', label: `All (${registrations.length})` },
            { id: 'PENDING', label: `⏳ Pending (${registrations.filter(r => r.status === 'PENDING_L1').length})` },
            { id: 'APPROVED', label: `✓ Approved (${registrations.filter(r => r.status === 'APPROVED').length})` },
            { id: 'CHECKED_IN', label: `🟢 Inside (${registrations.filter(r => r.status === 'INSIDE_CAMPUS').length})` },
            { id: 'REJECTED', label: `❌ Rejected (${registrations.filter(r => r.status === 'REJECTED').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`host-filter-chip ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 2. Search Container matching Attachment 1 */}
        <div className="host-search-container" style={{ marginBottom: '1rem' }}>
          <Search size={18} color="#78716c" />
          <input
            type="text"
            className="host-search-input"
            placeholder="Search visitor, phone, or passcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: '#78716c', fontWeight: 'bold', cursor: 'pointer', padding: '0 4px' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* 3. Section Header matching Attachment 1 */}
        <div className="host-section-header">
          <div className="host-section-title-wrap">
            <h3 className="host-section-title">Visitor Passes</h3>
            <div className="host-section-underline"></div>
          </div>
          <div className="host-section-count">
            {filtered.length} Listed
          </div>
        </div>

        {/* 4. Visitors List Cards matching Attachment 1 (`media_1790425543026.jpg`) */}
        <div style={{ marginTop: '0.6rem' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#ffffff', borderRadius: '22px', border: '1.5px dashed #ebdccc', color: '#78716c' }}>
              <Clock size={36} color="#d6c7b2" style={{ marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#1c1917' }}>No visitor records found</p>
              <span style={{ fontSize: '0.78rem', color: '#78716c' }}>Visitors matching this category filter will appear here.</span>
            </div>
          ) : (
            filtered.map((r) => {
              const isPending = r.status === 'PENDING_L1';
              const isInside = r.status === 'INSIDE_CAMPUS';
              const isApproved = r.status === 'APPROVED' || r.status === 'PENDING_L2';
              const isRejected = r.status === 'REJECTED';

              return (
                <div
                  key={r.id}
                  className="host-visitor-card"
                  style={{ marginBottom: '0.85rem' }}
                >
                  {/* Top Bar with pastel sky-blue tint matching attachment */}
                  <div className="host-visitor-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ 
                        background: '#ffffff', 
                        border: '1px solid #dbeafe', 
                        color: '#1e40af', 
                        borderRadius: '9999px', 
                        padding: '2px 9px', 
                        fontSize: '0.7rem', 
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        👤 {r.visitor_category === 'FAMILY_MEMBER' ? 'Family Member' : r.visitor_category === 'VIP' ? 'VIP Guest' : 'General Visitor'}
                      </span>

                      {/* Status Pill */}
                      <span style={{ 
                        background: isInside ? '#dcfce7' : isApproved ? '#e0f2fe' : isPending ? '#fef3c7' : isRejected ? '#fee2e2' : '#f1f5f9', 
                        color: isInside ? '#15803d' : isApproved ? '#0369a1' : isPending ? '#b45309' : isRejected ? '#b91c1c' : '#475569', 
                        borderRadius: '9999px', 
                        padding: '2px 9px', 
                        fontSize: '0.7rem', 
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <span>•</span> {isInside ? 'SERVING' : r.status?.replace(/_/g, ' ') || 'PENDING'}
                      </span>
                    </div>

                    {/* View Details Icon */}
                    <div 
                      onClick={() => history.push(`/visitor-details/${r.pass_code || r.id}`)}
                      style={{ 
                        width: '26px', 
                        height: '26px', 
                        borderRadius: '50%', 
                        background: '#ffffff', 
                        border: '1px solid #e2e8f0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      <ArrowRight size={14} />
                    </div>
                  </div>

                  {/* Body matching Attachment 1 */}
                  <div className="host-visitor-card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>
                          {r.visitor_name}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.76rem', color: '#78716c' }}>
                          Phone: <strong>{r.visitor_phone}</strong> • Pass: <strong>{r.pass_code || `#${r.id}`}</strong>
                        </p>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: '#57534e' }}>
                          <strong>Purpose:</strong> {r.purpose || 'Ashram Visit'}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Metadata Line */}
                    <div style={{ 
                      borderTop: '1px solid #f5eee6', 
                      marginTop: '0.65rem', 
                      paddingTop: '0.55rem', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      fontSize: '0.74rem', 
                      color: '#57534e' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={13} color="#b84018" />
                        <span>{formatDate(r.valid_from)}</span>
                      </div>
                      <div style={{ fontWeight: '700', color: '#1c1917', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {r.vehicles && r.vehicles.length > 0 ? (
                          <>
                            <Car size={13} color="#78716c" />
                            <span>{r.vehicles[0].plate_number}</span>
                          </>
                        ) : (
                          <span>{r.person_count || (r.adult_men_count || 1) + (r.adult_women_count || 0)} Guests</span>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid #f5eee6', paddingTop: '0.65rem' }}>
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => openReviewModal(r)}
                          className="host-btn-primary"
                          style={{ flex: 1.2, padding: '0.55rem 0.8rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Review &amp; Approve
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => history.push(`/visitor-details/${r.pass_code || r.id}`)}
                        className="host-btn-outline"
                        style={{ flex: 1, padding: '0.55rem 0.8rem', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Pass &amp; QR
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Host Review & Approval Modal matching Attachment 3 */}
        <IonModal isOpen={!!reviewItem} onDidDismiss={() => setReviewItem(null)}>
          <div style={{ padding: '1.5rem', background: '#ffffff', height: '100%', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '1.5px solid #f0e6da', paddingBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="#b84018" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>Host Entry Approval</h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewItem(null)}
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
              <span>✦</span> VERIFY &amp; AUTHORIZE ENTRY
            </div>

            <p style={{ fontSize: '0.8rem', color: '#78716c', margin: '0 0 1rem 0' }}>
              Review or adjust guest details before granting entry authorization.
            </p>

            {isVipOrHodHost && (
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '16px', padding: '0.75rem 0.9rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>⚡</span>
                <div>
                  <strong>VIP / HOD Direct Pass:</strong> Approving will immediately generate the official Gate Pass with zero delay.
                </div>
              </div>
            )}

            {/* Editable Visitor Details Card */}
            <div style={{ background: '#faf6f0', border: '1.5px solid #ede5da', borderRadius: '18px', padding: '1rem', marginBottom: '1rem' }}>
              <label className="host-label" style={{ marginTop: 0 }}>Guest Full Name</label>
              <input
                type="text"
                className="host-input"
                value={reviewVisitorName}
                onChange={(e) => setReviewVisitorName(e.target.value)}
                placeholder="Visitor name"
              />

              <label className="host-label">Mobile Number</label>
              <input
                type="tel"
                className="host-input"
                value={reviewVisitorPhone}
                onChange={(e) => setReviewVisitorPhone(e.target.value)}
                placeholder="10-digit mobile"
              />

              <label className="host-label">Purpose of Visit</label>
              <input
                type="text"
                className="host-input"
                value={reviewPurpose}
                onChange={(e) => setReviewPurpose(e.target.value)}
                placeholder="Purpose"
              />

              {/* People breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div>
                  <label className="host-label">Men</label>
                  <input
                    type="number"
                    min="0"
                    className="host-input"
                    value={reviewMenCount}
                    onChange={(e) => setReviewMenCount(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div>
                  <label className="host-label">Women</label>
                  <input
                    type="number"
                    min="0"
                    className="host-input"
                    value={reviewWomenCount}
                    onChange={(e) => setReviewWomenCount(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div>
                  <label className="host-label">Kids</label>
                  <input
                    type="number"
                    min="0"
                    className="host-input"
                    value={reviewChildrenCount}
                    onChange={(e) => setReviewChildrenCount(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Vehicles breakdown */}
            <div style={{ background: '#faf6f0', border: '1.5px solid #ede5da', borderRadius: '18px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="host-label" style={{ margin: 0 }}>Registered Vehicles</label>
                <button
                  type="button"
                  onClick={() => setReviewVehicles([...reviewVehicles, { plate_number: '', vehicle_type: 'Car' }])}
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', background: '#fdede3', border: '1px solid #fed7aa', color: '#b84018', borderRadius: '9999px', cursor: 'pointer', fontWeight: '800' }}
                >
                  + Add Vehicle
                </button>
              </div>
              {reviewVehicles.length === 0 ? (
                <span style={{ fontSize: '0.75rem', color: '#78716c' }}>No vehicles specified</span>
              ) : (
                reviewVehicles.map((veh, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="host-input"
                      placeholder="KA 01 AB 1234"
                      value={veh.plate_number}
                      onChange={(e) => {
                        const updated = [...reviewVehicles];
                        updated[idx].plate_number = e.target.value.toUpperCase();
                        setReviewVehicles(updated);
                      }}
                      style={{ flex: 1, margin: 0, padding: '0.45rem' }}
                    />
                    <select
                      className="host-input"
                      value={veh.vehicle_type || 'Car'}
                      onChange={(e) => {
                        const updated = [...reviewVehicles];
                        updated[idx].vehicle_type = e.target.value;
                        setReviewVehicles(updated);
                      }}
                      style={{ width: '110px', margin: 0, padding: '0.45rem' }}
                    >
                      <option value="Car">Car</option>
                      <option value="Two-Wheeler">2-Wheeler</option>
                      <option value="Auto Rickshaw">Auto</option>
                      <option value="Van">Van</option>
                      <option value="Bus">Bus</option>
                      <option value="Other">Other</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = reviewVehicles.filter((_, i) => i !== idx);
                        setReviewVehicles(updated);
                      }}
                      style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '8px', padding: '0.4rem 0.6rem', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ background: '#faf6f0', border: '1.5px solid #ede5da', borderRadius: '18px', padding: '1rem', marginBottom: '1rem' }}>
              <label className="host-label" style={{ marginTop: 0 }}>Visit Type</label>
              <select className="host-input" value={reviewVisitType} onChange={(e) => setReviewVisitType(e.target.value)}>
                <option value="HOME">Resident / Home Visit</option>
                <option value="OFFICE">Department / Office Visit</option>
                <option value="BHAJAN">Ashram Bhajan Visit</option>
                <option value="EVENT">Ashram Event Visit</option>
                <option value="TOUR">Ashram Tour Visit</option>
              </select>

              <label className="host-label">Priority</label>
              <select className="host-input" value={reviewPriority} onChange={(e) => setReviewPriority(e.target.value)}>
                <option value="P1">P1 - Highest / VVIP</option>
                <option value="P2">P2 - High Priority</option>
                <option value="P3">P3 - Normal Priority</option>
                <option value="P4">P4 - Low Priority</option>
              </select>

              <label className="host-label">Referrer Remarks</label>
              <textarea
                rows={2}
                className="host-input"
                placeholder="Add optional notes for security gate or next level"
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.2rem' }}>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => handleApprovalAction('APPROVE')}
                className="host-btn-primary"
                style={{ flex: 1.3, padding: '0.85rem', cursor: 'pointer' }}
              >
                ✓ Approve Entry
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => handleApprovalAction('REJECT')}
                style={{ flex: 1, background: '#fee2e2', border: '1.5px solid #fecaca', color: '#b91c1c', fontWeight: '800', padding: '0.85rem', borderRadius: '9999px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                ✕ Reject
              </button>
            </div>

            <button
              type="button"
              onClick={() => setReviewItem(null)}
              style={{ width: '100%', background: 'none', border: 'none', color: '#78716c', padding: '0.75rem', cursor: 'pointer', marginTop: '0.4rem', fontSize: '0.82rem', fontWeight: '700' }}
            >
              Cancel
            </button>
          </div>
        </IonModal>

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={2500} onDidDismiss={() => setToastMsg('')} />
      </IonContent>
    </IonPage>
  );
}

