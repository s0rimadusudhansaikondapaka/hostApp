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
        <IonToolbar style={{ '--background': '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="" />
          </IonButtons>
          <IonTitle style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>Approval Status</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#f8fafc' }}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Filter Tabs matching Wireframe Screen 4 */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.6rem', marginBottom: '0.8rem' }}>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'CHECKED_IN', label: 'Checked-In' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.35rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                border: activeTab === tab.id ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                background: activeTab === tab.id ? '#0f172a' : '#ffffff',
                color: activeTab === tab.id ? '#ffffff' : '#475569',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <input
            type="text"
            className="host-input"
            placeholder="Search by visitor name, mobile, passcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.2rem' }}
          />
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '13px' }} />
        </div>

        {/* Visitors List matching Wireframe Screen 4 */}
        <div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              <Clock size={40} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>No visitor records found</p>
              <span style={{ fontSize: '0.78rem' }}>Visitors matching this filter will appear here.</span>
            </div>
          ) : (
            filtered.map((r) => {
              const isPending = r.status === 'PENDING_L1';
              return (
                <div
                  key={r.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '1rem',
                    marginBottom: '0.85rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontWeight: 'bold' }}>
                        {r.visitor_name ? r.visitor_name.charAt(0).toUpperCase() : 'V'}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                          {r.visitor_name}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.visitor_phone}</span>
                      </div>
                    </div>
                    {getStatusBadge(r.status)}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: '1.4', margin: '0.4rem 0' }}>
                    <div><strong>Purpose:</strong> {r.purpose || 'Ashram Visit'} ({r.visitor_category || 'GENERAL'})</div>
                    {r.valid_from && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                        <Calendar size={13} color="#64748b" />
                        <span>{formatDate(r.valid_from)} - {formatDate(r.valid_until)}</span>
                      </div>
                    )}
                    {r.vehicles && r.vehicles.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                        <Car size={13} color="#64748b" />
                        <span>{r.vehicles.length} Vehicle(s): {r.vehicles.map(v => v.plate_number).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.6rem' }}>
                    {isPending ? (
                      <button
                        type="button"
                        onClick={() => openReviewModal(r)}
                        className="host-btn-primary"
                        style={{ flex: 1, padding: '0.55rem', border: 'none', cursor: 'pointer', fontSize: '0.82rem' }}
                      >
                        Review &amp; Approve
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => history.push(`/visitor-details/${r.pass_code || r.id}`)}
                      className="host-btn-outline"
                      style={{ flex: 1, padding: '0.55rem', cursor: 'pointer', fontSize: '0.82rem' }}
                    >
                      View Details &amp; QR
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Host Review & Approval Modal */}
        <IonModal isOpen={!!reviewItem} onDidDismiss={() => setReviewItem(null)}>
          <div style={{ padding: '1.5rem', background: '#ffffff', height: '100%', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.3rem 0' }}>
              Referrer Review &amp; Approval
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1rem 0' }}>
              Review and edit guest details before granting entry approval
            </p>

            {isVipOrHodHost && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '0.6rem 0.8rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '1.1rem' }}>⚡</span>
                <div>
                  <strong>VIP / HOD Direct Pass:</strong> Approving will immediately generate the official Gate Pass with zero L2 / PRO delay.
                </div>
              </div>
            )}

            {/* Editable Visitor Details */}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginTop: '0.5rem' }}>
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

            {/* Vehicles breakdown */}
            <div style={{ marginTop: '0.8rem', marginBottom: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label className="host-label" style={{ margin: 0 }}>Vehicles</label>
                <button
                  type="button"
                  onClick={() => setReviewVehicles([...reviewVehicles, { plate_number: '', vehicle_type: 'Car' }])}
                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  + Add Vehicle
                </button>
              </div>
              {reviewVehicles.length === 0 ? (
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No vehicles specified</span>
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
                      style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '0.4rem 0.6rem', cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

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

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.4rem' }}>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => handleApprovalAction('APPROVE')}
                style={{ flex: 1, background: '#15803d', border: 'none', color: '#ffffff', fontWeight: 'bold', padding: '0.75rem', borderRadius: '9999px', cursor: 'pointer', fontSize: '0.88rem' }}
              >
                ✓ Approve Entry
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => handleApprovalAction('REJECT')}
                style={{ flex: 1, background: '#dc2626', border: 'none', color: '#ffffff', fontWeight: 'bold', padding: '0.75rem', borderRadius: '9999px', cursor: 'pointer', fontSize: '0.88rem' }}
              >
                ❌ Reject
              </button>
            </div>

            <button
              type="button"
              onClick={() => setReviewItem(null)}
              style={{ width: '100%', background: 'none', border: 'none', color: '#64748b', padding: '0.75rem', cursor: 'pointer', marginTop: '0.6rem', fontSize: '0.85rem' }}
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
