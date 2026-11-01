import React, { useState, useEffect, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonToast,
} from '@ionic/react';
import { personCircleOutline } from 'ionicons/icons';
import { useAuth, getHostPassCode } from '../context/AuthContext';
import { getHostRegistrations, getFrontendUrl, generateInviteToken } from '../services/api';
import {
  Bell,
  BellOff,
  UserPlus, 
  Clock, 
  Users, 
  History, 
  ChevronRight, 
  Shield, 
  QrCode, 
  ZoomIn, 
  ZoomOut, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  Search, 
  SlidersHorizontal,
  MapPin,
} from 'lucide-react';
import QRCode from 'qrcode';
import OneWorldOneFamilyLogo from '../components/OneWorldOneFamilyLogo';

export default function HostHome({ history }) {
  const { user, logout } = useAuth();
  const [registrations, setRegistrations] = useState(() => {
    try {
      const cached = localStorage.getItem('MYASRAM_HOST_REGISTRATIONS_CACHE');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('MYASRAM_HOST_REGISTRATIONS_CACHE');
      return !(cached && JSON.parse(cached).length > 0);
    } catch (e) {
      return true;
    }
  });
  const [hostQrUrl, setHostQrUrl] = useState('');
  const [showHostPassModal, setShowHostPassModal] = useState(false);
  const [qrZoomLevel, setQrZoomLevel] = useState(1);
  const [copiedPass, setCopiedPass] = useState(false);

  // Search & Filter State matching Attachment 1 & 2
  const [searchQuery, setSearchQuery] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareToken, setShareToken] = useState('');
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
  
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'PENDING', 'INSIDE', 'INVITED', 'ARCHIVAL'
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterVisitType, setFilterVisitType] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const effectivePassCode = user?.pass_code || getHostPassCode(user);

  // Issue #44 & #57: In-App Notifications with 1-Week Retention & Status Tracking
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const knownStatusMap = useRef(new Map());

  const getStoredNotifications = () => {
    try {
      const raw = localStorage.getItem('MYASHRAM_HOST_NOTIFICATIONS_V1');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Auto-purge notifications older than 7 days (1 week retention)
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return parsed.filter((n) => new Date(n.timestamp).getTime() > oneWeekAgo);
    } catch (e) {
      return [];
    }
  };

  const [notifications, setNotifications] = useState(getStoredNotifications);

  const saveNotifications = (newList) => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const pruned = newList.filter((n) => new Date(n.timestamp).getTime() > oneWeekAgo).slice(0, 100);
    setNotifications(pruned);
    try {
      localStorage.setItem('MYASHRAM_HOST_NOTIFICATIONS_V1', JSON.stringify(pruned));
    } catch (e) {}
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearAllNotifications = () => {
    saveNotifications([]);
  };

  const generateNotificationsFromRegistrations = (regs) => {
    const newNotifs = [];
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    regs.forEach((reg) => {
      const regId = reg.id;
      const currentStatus = reg.status;
      const prevStatus = knownStatusMap.current.get(regId);

      // Trigger events on status change or first discovery
      if (prevStatus === undefined) {
        knownStatusMap.current.set(regId, currentStatus);
        if (currentStatus === 'PENDING_L1' && new Date(reg.created_at || Date.now()).getTime() > oneWeekAgo) {
          newNotifs.push({
            id: `${regId}_submitted_${Date.now()}`,
            regId,
            passCode: reg.pass_code,
            title: 'New Guest Invite Submitted',
            message: `${reg.visitor_name} submitted a self-invite, awaiting your confirmation.`,
            status: 'Pending Confirmation',
            timestamp: reg.created_at || new Date().toISOString(),
            read: false,
          });
        }
      } else if (prevStatus !== currentStatus) {
        knownStatusMap.current.set(regId, currentStatus);
        let eventTitle = '';
        let eventMsg = '';
        let eventStatus = currentStatus;

        if (currentStatus === 'APPROVED') {
          eventTitle = 'Pass Confirmed';
          eventMsg = `Gate pass generated for ${reg.visitor_name} (${reg.pass_code}).`;
          eventStatus = 'Confirmed';
        } else if (currentStatus === 'INSIDE_CAMPUS' || reg.presence_status === 'currently_inside') {
          eventTitle = 'Guest Checked-In';
          eventMsg = `${reg.visitor_name} has checked-in at security gate.`;
          eventStatus = 'Checked-in';
        } else if (currentStatus === 'CHECKED_OUT' || reg.lifecycle_status === 'CHECKED-OUT') {
          eventTitle = 'Guest Checked-Out';
          eventMsg = `${reg.visitor_name} has exited campus.`;
          eventStatus = 'Checked-out';
        } else if (currentStatus === 'EXPIRED') {
          eventTitle = 'Pass Expired';
          eventMsg = `Gate pass for ${reg.visitor_name} (${reg.pass_code}) has expired.`;
          eventStatus = 'Expired';
        } else if (currentStatus === 'REJECTED') {
          eventTitle = 'Invite Rejected';
          eventMsg = `Invite for ${reg.visitor_name} was rejected.`;
          eventStatus = 'Rejected';
        }

        if (eventTitle) {
          newNotifs.push({
            id: `${regId}_${currentStatus}_${Date.now()}`,
            regId,
            passCode: reg.pass_code,
            title: eventTitle,
            message: eventMsg,
            status: eventStatus,
            timestamp: new Date().toISOString(),
            read: false,
          });
          setToastMsg(`🔔 ${eventTitle}: ${reg.visitor_name}`);
        }
      }
    });

    if (newNotifs.length > 0) {
      setNotifications((prev) => {
        const merged = [...newNotifs, ...prev];
        const unique = [];
        const seen = new Set();
        merged.forEach((item) => {
          const key = item.id || `${item.regId}_${item.status}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        });
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const pruned = unique.filter((n) => new Date(n.timestamp).getTime() > oneWeekAgo).slice(0, 100);
        try {
          localStorage.setItem('MYASHRAM_HOST_NOTIFICATIONS_V1', JSON.stringify(pruned));
        } catch (e) {}
        return pruned;
      });
    }
  };

  const fetchHostData = async () => {
    try {
      const res = await getHostRegistrations();
      if (res?.registrations) {
        setRegistrations(res.registrations);
        try {
          localStorage.setItem('MYASRAM_HOST_REGISTRATIONS_CACHE', JSON.stringify(res.registrations));
        } catch (cErr) {}
      }
    } catch (e) {
      console.warn('Error fetching host registrations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostData();
    const code = effectivePassCode || 'HOST-PASS-01';
    QRCode.toDataURL(code, { width: 600, margin: 2 })
      .then(url => setHostQrUrl(url))
      .catch(err => console.error('Failed to generate host QR code:', err));
  }, [user, effectivePassCode]);

  const handleRefresh = async (event) => {
    await fetchHostData();
    event.detail.complete();
  };

  const pendingApprovals = registrations.filter(
    (r) => r.status === 'PENDING_L1'
  );

  const activeVisitors = registrations.filter(
    (r) => r.status === 'INSIDE_CAMPUS' || r.status === 'APPROVED' || r.presence_status === 'currently_inside' || r.presence_status === 'over_stayed'
  );

  const insideVisitors = registrations.filter(
    (r) => r.status === 'INSIDE_CAMPUS' || r.presence_status === 'currently_inside'
  );

  const isVipOrHodHost = user?.role === 'HOD' || user?.user_type === 'HOD' || user?.role === 'VIP_HOST' || user?.user_type === 'VIP_HOST' || (user?.user_type && user.user_type.includes('VIP_HOST')) || (user?.role && user.role.includes('VIP_HOST'));

  const hostTypeLabel = user?.role === 'RESIDENT' ? 'Resident Host' :
    isVipOrHodHost ? (user?.role === 'HOD' || user?.user_type === 'HOD' ? 'Department HOD' : 'VIP Host') :
    'Employee Host';

  // Filtered Visitors matching search & filter chips
  const now = new Date();

  // Helper categorization matching Issue #38
  const isYetToCome = (r) => {
    const isInside = r.status === 'INSIDE_CAMPUS' || r.presence_status === 'currently_inside';
    const isCheckedOut = r.status === 'CHECKED_OUT';
    const isPastSDT = r.valid_until && new Date(r.valid_until) < now;
    return !isInside && !isCheckedOut && !isPastSDT && (r.status === 'APPROVED' || r.status === 'PENDING_L1');
  };

  const isLapsedArchival = (r) => {
    const isInside = r.status === 'INSIDE_CAMPUS' || r.presence_status === 'currently_inside';
    const isCheckedOut = r.status === 'CHECKED_OUT';
    const isPastSDT = r.valid_until && new Date(r.valid_until) < now;
    return !isInside && !isCheckedOut && isPastSDT;
  };

  const filteredVisitors = registrations.filter((r) => {
    // Multi-field search
    const q = (searchQuery || '').trim().toLowerCase();
    const visName = (r.visitor_name || r.full_name || r.name || '').toLowerCase();
    const passCode = (r.pass_code || '').toLowerCase();
    const phone = (r.visitor_phone || r.phone || '');
    const purpose = (r.purpose || '').toLowerCase();
    const vehNo = (r.vehicle_no || r.registered_plate_number || '').toLowerCase();

    const matchesSearch = !q || 
      visName.includes(q) ||
      passCode.includes(q) ||
      phone.includes(q) ||
      purpose.includes(q) ||
      vehNo.includes(q);

    if (!matchesSearch) return false;

    // Filter Chips & Categorization
    if (activeFilter === 'PENDING') return r.status === 'PENDING_L1';
    if (activeFilter === 'INSIDE') return r.status === 'INSIDE_CAMPUS' || r.presence_status === 'currently_inside';
    if (activeFilter === 'INVITED') return isYetToCome(r);
    if (activeFilter === 'ARCHIVAL') return isLapsedArchival(r);

    // Advanced filters from filter modal
    if (filterVisitType !== 'ALL' && (r.visit_type || 'HOME').toUpperCase() !== filterVisitType.toUpperCase()) return false;
    if (filterCategory !== 'ALL' && (r.visitor_category || 'GENERAL').toUpperCase() !== filterCategory.toUpperCase()) return false;

    return true;
  });

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'H';

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#ffffff', borderBottom: '1.5px solid #f0e6da', padding: '0.2rem 0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <OneWorldOneFamilyLogo size={36} showText={false} variant="navbar" speed="normal" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#1c1917', letterSpacing: '-0.01em' }}>Ashram Host</h2>
              <span style={{ fontSize: '0.72rem', color: '#78716c', fontWeight: '600' }}>Sathya Sai Grama</span>
            </div>
          </div>
          <IonButtons slot="end" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <div 
              onClick={() => { setShowNotifModal(true); markAllNotificationsAsRead(); }}
              style={{ position: 'relative', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center' }}
              title="Notifications"
            >
              <Bell size={22} color="#b84018" />
              {unreadNotifCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: '800',
                  borderRadius: '9999px',
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #ffffff'
                }}>
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </span>
              )}
            </div>
            <IonButton onClick={() => history.push('/profile')} style={{ color: '#b84018' }}>
              <IonIcon icon={personCircleOutline} style={{ fontSize: '28px' }} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#faf6f0' }}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* 1. Hero Profile Banner - Compact Vertical Fit (Issue #32) */}
        <div className="host-hero-banner">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Host'}
              </h1>
              <div style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500', marginTop: '2px' }}>
                {user?.flat_info || user?.department || 'Sathya Sai Grama'}
              </div>
            </div>
            <div style={{ 
              width: '34px', 
              height: '34px', 
              borderRadius: '50%', 
              background: 'rgba(0, 0, 0, 0.25)', 
              color: '#ffffff', 
              fontWeight: '800', 
              fontSize: '0.95rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              flexShrink: 0,
              marginLeft: '0.6rem'
            }}>
              {userInitial}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.45rem', paddingTop: '0.45rem', borderTop: '1px solid rgba(255, 255, 255, 0.18)' }}>
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.2)', 
              borderRadius: '9999px', 
              padding: '3px 9px', 
              color: '#ffffff', 
              fontSize: '0.72rem', 
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}></span>
              Host Scope Active
            </div>
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.2)', 
              borderRadius: '9999px', 
              padding: '3px 10px', 
              color: '#ffffff', 
              fontSize: '0.72rem', 
              fontWeight: '800'
            }}>
              {registrations.length} Visitors Registered
            </div>
          </div>
        </div>

        {/* Quick Action: Share Link (Issue #17 / #42 - Pre-register removed) */}
        <div style={{ margin: '0.85rem 0' }}>
          <button
            type="button"
            onClick={handleShareInvite}
            disabled={generatingToken}
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1.5px solid #fed7aa',
              borderRadius: '16px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(184, 64, 24, 0.06)',
              cursor: generatingToken ? 'wait' : 'pointer',
              transition: 'transform 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fdede3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b84018' }}>
                <Share2 size={20} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#1c1917' }}>Share Invite Link</div>
                <div style={{ fontSize: '0.72rem', color: '#78716c' }}>Single-use self-registration URL for guests</div>
              </div>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#b84018', background: '#fdede3', padding: '0.3rem 0.7rem', borderRadius: '9999px' }}>
              {generatingToken ? 'Generating...' : 'Share ➔'}
            </span>
          </button>
        </div>

        {/* 3. 2x2 Action Tiles Grid matching Attachment 2 */}
        <div className="host-tiles-grid">
          {/* Tile 1: Add Invite */}
          <div className="host-tile-card" onClick={() => history.push('/invite-visitor')}>
            <div className="host-tile-icon-circle icon-circle-peach">
              <UserPlus size={24} />
            </div>
            <h4 style={{ margin: '0 0 0.15rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#1c1917' }}>
              Invite Visitor
            </h4>
            <span style={{ fontSize: '0.72rem', color: '#78716c' }}>
              Create guest invite
            </span>
          </div>

          {/* Tile 2: Verify Approvals */}
          <div className="host-tile-card" onClick={() => history.push('/approval-status')}>
            <div className="host-tile-icon-circle icon-circle-blue" style={{ position: 'relative' }}>
              <Clock size={24} />
              {pendingApprovals.length > 0 && (
                <span style={{ position: 'absolute', top: '-3px', right: '-3px', background: '#b84018', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {pendingApprovals.length}
                </span>
              )}
            </div>
            <h4 style={{ margin: '0 0 0.15rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#1c1917' }}>
              Verify Approvals
            </h4>
            <span style={{ fontSize: '0.72rem', color: pendingApprovals.length > 0 ? '#b84018' : '#78716c', fontWeight: pendingApprovals.length > 0 ? '700' : '500' }}>
              {pendingApprovals.length > 0 ? `${pendingApprovals.length} pending review` : 'Review & validate'}
            </span>
          </div>

          {/* Tile 3: Active Visitors */}
          <div className="host-tile-card" onClick={() => history.push('/active-visitors')}>
            <div className="host-tile-icon-circle icon-circle-amber">
              <Users size={24} />
            </div>
            <h4 style={{ margin: '0 0 0.15rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#1c1917' }}>
              Active Visitors
            </h4>
            <span style={{ fontSize: '0.72rem', color: '#78716c' }}>
              Manage {activeVisitors.length} visitors
            </span>
          </div>

          {/* Tile 4: Past Visitors */}
          <div className="host-tile-card" onClick={() => history.push('/past-visitors')}>
            <div className="host-tile-icon-circle icon-circle-green">
              <History size={24} />
            </div>
            <h4 style={{ margin: '0 0 0.15rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#1c1917' }}>
              Past Visitors
            </h4>
            <span style={{ fontSize: '0.72rem', color: '#78716c' }}>
              Visit logs &amp; history
            </span>
          </div>
        </div>

        {/* 5. Search Bar with Filter Slider matching Attachment 1 & 2 */}
        <div className="host-search-container">
          <Search size={18} color="#78716c" />
          <input 
            type="text" 
            className="host-search-input"
            placeholder="Search visitors, pass code, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="host-search-divider"></div>
          <button 
            type="button" 
            onClick={() => setShowFilterModal(true)}
            style={{ background: 'none', border: 'none', padding: '0 4px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <SlidersHorizontal size={18} color="#b84018" />
          </button>
        </div>

        {/* 6. Horizontal Filter Chips matching Attachment 1 */}
        <div className="host-chips-row">
          <button 
            type="button"
            className={`host-filter-chip ${activeFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ALL')}
          >
            All Visitors ({registrations.length})
          </button>
          <button 
            type="button"
            className={`host-filter-chip ${activeFilter === 'INSIDE' ? 'active' : ''}`}
            onClick={() => setActiveFilter('INSIDE')}
          >
            🟢 Inside Campus ({insideVisitors.length})
          </button>
          <button 
            type="button"
            className={`host-filter-chip ${activeFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveFilter('PENDING')}
          >
            ⏳ Pending ({pendingApprovals.length})
          </button>
          </div>

        {/* 7. Section Header with Underline Accent matching Attachment 1 */}
        <div className="host-section-header">
          <div className="host-section-title-wrap">
            <h3 className="host-section-title">INVITED VISITORS</h3>
            <div className="host-section-underline"></div>
          </div>
          <div className="host-section-count">
            {filteredVisitors.length} Enrolled
          </div>
        </div>

        {/* 8. Visitor List Cards matching Attachment 1 (`media_1790425543026.jpg`) */}
        <div style={{ marginTop: '0.6rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#78716c', fontSize: '0.85rem' }}>
              Loading visitors...
            </div>
          ) : filteredVisitors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: '#ffffff', borderRadius: '22px', border: '1.5px dashed #ebdccc', color: '#78716c' }}>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '0.88rem' }}>No visitors found matching filter.</p>
              <button 
                type="button" 
                onClick={() => { setSearchQuery(''); setActiveFilter('ALL'); }}
                style={{ background: 'none', border: 'none', color: '#b84018', fontWeight: 'bold', fontSize: '0.78rem', marginTop: '0.4rem', cursor: 'pointer' }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredVisitors.slice(0, 10).map((r) => {
              const isApproved = r.status === 'APPROVED' || r.status === 'INSIDE_CAMPUS';
              const isInside = r.status === 'INSIDE_CAMPUS' || r.presence_status === 'currently_inside';
              const isPending = r.status === 'PENDING_L1';

              return (
                <div 
                  key={r.id} 
                  className="host-visitor-card"
                  onClick={() => history.push(`/visitor-details/${r.pass_code || r.id}`)}
                >
                  {/* Top Bar with pastel sky-blue tint matching screenshot */}
                  <div className="host-visitor-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                        gap: '4px'
                      }}>
                        👤 {r.visitor_category === 'FAMILY_MEMBER' ? 'Family Member' : r.visitor_category === 'VIP' ? 'VIP Guest' : 'General Visitor'}
                      </span>

                      {/* Status Pill */}
                      <span style={{ 
                        background: isInside ? '#dcfce7' : isApproved ? '#e0f2fe' : isPending ? '#fef3c7' : '#fee2e2', 
                        color: isInside ? '#15803d' : isApproved ? '#0369a1' : isPending ? '#b45309' : '#b91c1c', 
                        borderRadius: '9999px', 
                        padding: '2px 9px', 
                        fontSize: '0.7rem', 
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <span>•</span> {isInside ? 'SERVING' : r.status?.replace(/_/g, ' ') || 'YET TO ARRIVE'}
                      </span>
                    </div>

                    {/* Circular Action Button */}
                    <div style={{ 
                      width: '26px', 
                      height: '26px', 
                      borderRadius: '50%', 
                      background: '#ffffff', 
                      border: '1px solid #e2e8f0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#64748b'
                    }}>
                      <ChevronRight size={15} />
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
                          Pass: <strong>{r.pass_code}</strong> • {r.purpose || 'Ashram Visit'}
                        </p>
                      </div>
                      <ChevronRight size={18} color="#a8a29e" />
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
                        <MapPin size={13} color="#b84018" />
                        <span>{r.visit_type || 'Home Visit'} • {user?.flat_info || 'Main Campus'}</span>
                      </div>
                      <div style={{ fontWeight: '700', color: '#1c1917', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Users size={13} color="#78716c" />
                        <span>{r.person_count || 1} Guests</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {filteredVisitors.length > 10 && (
            <button
              type="button"
              onClick={() => history.push('/past-visitors')}
              style={{
                width: '100%',
                padding: '0.85rem',
                background: '#ffffff',
                border: '1.5px solid #ebdccc',
                borderRadius: '14px',
                color: '#b84018',
                fontWeight: '700',
                fontSize: '0.82rem',
                marginTop: '0.5rem',
                marginBottom: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(184, 64, 24, 0.04)'
              }}
            >
              <span>View All {filteredVisitors.length} Visitors in Archives</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>

  
        {/* Filter Modal for Search & Categories (Issue #37) */}
        <IonModal isOpen={showFilterModal} onDidDismiss={() => setShowFilterModal(false)}>
          <div style={{ padding: '1.5rem', background: '#ffffff', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1.5px solid #f0e6da', paddingBottom: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SlidersHorizontal size={20} color="#b84018" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1c1917' }}>Filter Visitors</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowFilterModal(false)}
                style={{ background: '#f5eee6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label className="host-label" style={{ marginTop: 0 }}>Visitor Status</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.4rem' }}>
                {[
                  { key: 'ALL', label: 'All Statuses' },
                  { key: 'INVITED', label: 'Invited (Active)' },
                  { key: 'INSIDE', label: 'Inside Campus' },
                  { key: 'PENDING', label: 'Pending L1' },
                  { key: 'ARCHIVAL', label: 'Did Not Arrive' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setActiveFilter(opt.key)}
                    style={{
                      padding: '0.55rem 0.6rem',
                      borderRadius: '12px',
                      border: activeFilter === opt.key ? '2px solid #b84018' : '1px solid #ebdccc',
                      background: activeFilter === opt.key ? '#fdede3' : '#faf6f0',
                      color: activeFilter === opt.key ? '#9a3412' : '#57534e',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label className="host-label">Visit Type</label>
              <select 
                className="host-input" 
                value={filterVisitType} 
                onChange={(e) => setFilterVisitType(e.target.value)}
              >
                <option value="ALL">All Visit Types</option>
                <option value="HOME">Resident / Home Visit</option>
                <option value="OFFICE">Department / Office Visit</option>
                <option value="BHAJAN">Ashram Bhajan Visit</option>
                <option value="EVENT">Ashram Event Visit</option>
                <option value="TOUR">Ashram Tour Visit</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="host-label">Visitor Category</label>
              <select 
                className="host-input" 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="GENERAL">General Visitor</option>
                <option value="VIP">VIP Guest</option>
                <option value="FAMILY_MEMBER">Family Member</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('ALL');
                  setFilterVisitType('ALL');
                  setFilterCategory('ALL');
                  setShowFilterModal(false);
                }}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid #ebdccc', background: '#faf6f0', color: '#57534e', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="host-btn-primary"
                style={{ flex: 1, padding: '0.75rem', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </IonModal>

        {/* Share Link Modal on Home Screen (Issue #17) */}
        <IonModal isOpen={showShareModal} onDidDismiss={() => { setShowShareModal(false); setShareToken(''); }}>
          <div style={{ padding: '1.5rem', background: '#ffffff', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1.5px solid #f0e6da', paddingBottom: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Share2 size={20} color="#b84018" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1c1917' }}>Share Guest Invitation</h3>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowShareModal(false); setShareToken(''); }}
                style={{ background: '#f5eee6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#57534e', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
              Send this single-use link to your guest. They will fill in their personal details and a digital pass will be issued upon your confirmation.
            </p>

            <div style={{ background: '#faf6f0', border: '1.5px solid #ebdccc', borderRadius: '14px', padding: '0.9rem', marginBottom: '1rem', wordBreak: 'break-all', fontSize: '0.78rem', color: generatingToken || !shareToken ? '#b84018' : '#78716c', fontStyle: generatingToken || !shareToken ? 'italic' : 'normal' }}>
              {generatingToken ? 'Generating fresh single-use link...' : (inviteLink || 'Failed to generate token. Please close and try again.')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: 'auto' }}>
              <button
                type="button"
                className="host-btn-primary"
                disabled={generatingToken || !shareToken}
                onClick={() => {
                  if (!inviteLink) return;
                  const msg = `Jay Sai Ram! You are invited to Sathya Sai Grama by ${user?.name || 'Ashram Host'}. Please complete your visitor pass pre-registration here: ${inviteLink}`;
                  if (navigator.share) {
                    navigator.share({ title: 'Ashram Visitor Invite', text: msg, url: inviteLink }).catch(() => {});
                  } else {
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                  }
                }}
                style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', opacity: generatingToken || !shareToken ? 0.6 : 1 }}
              >
                <Share2 size={16} /> Share via WhatsApp
              </button>

              <button
                type="button"
                disabled={generatingToken || !shareToken}
                onClick={() => {
                  if (!inviteLink) return;
                  navigator.clipboard?.writeText(inviteLink);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                style={{ background: '#faf6f0', border: '1px solid #ebdccc', borderRadius: '12px', padding: '0.8rem', color: '#57534e', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: generatingToken || !shareToken ? 'not-allowed' : 'pointer', opacity: generatingToken || !shareToken ? 0.6 : 1 }}
              >
                {copiedLink ? <Check size={16} color="#15803d" /> : <Copy size={16} />}
                {copiedLink ? 'Copied to Clipboard!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </IonModal>
      
        {/* Issue #57: In-app Notification Bar with 1-Week Retention */}
        <IonModal isOpen={showNotifModal} onDidDismiss={() => setShowNotifModal(false)}>
          <div style={{ padding: '1.5rem', background: '#ffffff', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #f0e6da', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#1c1917' }}>Notifications</h3>
                <span style={{ fontSize: '0.74rem', color: '#78716c' }}>Retained for 1 week • Auto-purged after 7 days</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    style={{ background: 'none', border: 'none', color: '#b91c1c', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowNotifModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#78716c' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#78716c' }}>
                <BellOff size={40} color="#cbd5e1" style={{ margin: '0 auto 0.8rem auto', display: 'block' }} />
                <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem' }}>No recent notifications</p>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Notifications within the last 7 days will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {notifications.map((n) => {
                  const isPending = n.status === 'Pending Confirmation' || n.status === 'PENDING_L1';
                  const isCheckedIn = n.status === 'Checked-in' || n.status === 'INSIDE_CAMPUS';
                  const isCheckedOut = n.status === 'Checked-out' || n.status === 'CHECKED_OUT';
                  const isExpired = n.status === 'Expired' || n.status === 'EXPIRED';
                  const isRejected = n.status === 'Rejected' || n.status === 'REJECTED';

                  const badgeBg = isCheckedIn ? '#dcfce7' : isPending ? '#fef3c7' : isExpired ? '#fee2e2' : isRejected ? '#fee2e2' : '#e0f2fe';
                  const badgeColor = isCheckedIn ? '#15803d' : isPending ? '#b45309' : isExpired ? '#b91c1c' : isRejected ? '#b91c1c' : '#0369a1';

                  const timeAgo = (dateStr) => {
                    const diffMs = Date.now() - new Date(dateStr).getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    if (diffMins < 1) return 'Just now';
                    if (diffMins < 60) return `${diffMins}m ago`;
                    const diffHours = Math.floor(diffMins / 60);
                    if (diffHours < 24) return `${diffHours}h ago`;
                    const diffDays = Math.floor(diffHours / 24);
                    return `${diffDays}d ago`;
                  };

                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        setShowNotifModal(false);
                        if (isPending) {
                          history.push('/approval-status');
                        } else if (n.passCode) {
                          history.push(`/visitor-details/${n.passCode}`);
                        }
                      }}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '12px',
                        background: n.read ? '#ffffff' : '#fffaf5',
                        border: `1.5px solid ${n.read ? '#f1f5f9' : '#fed7aa'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ background: badgeBg, color: badgeColor, fontSize: '0.68rem', fontWeight: '800', padding: '2px 8px', borderRadius: '9999px' }}>
                          {n.status}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {timeAgo(n.timestamp)}
                        </span>
                      </div>
                      <h4 style={{ margin: '0.2rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#1c1917' }}>
                        {n.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#57534e', lineHeight: '1.35' }}>
                        {n.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </IonModal>

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={3500} onDidDismiss={() => setToastMsg('')} />

      </IonContent>
    </IonPage>
  );
}
