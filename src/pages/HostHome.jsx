import React, { useState, useEffect } from 'react';
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
} from '@ionic/react';
import { personCircleOutline } from 'ionicons/icons';
import { useAuth, getHostPassCode } from '../context/AuthContext';
import { getHostRegistrations, getFrontendUrl } from '../services/api';
import { 
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
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hostQrUrl, setHostQrUrl] = useState('');
  const [showHostPassModal, setShowHostPassModal] = useState(false);
  const [qrZoomLevel, setQrZoomLevel] = useState(1);
  const [copiedPass, setCopiedPass] = useState(false);

  // Search & Filter State matching Attachment 1 & 2
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'PENDING', 'INSIDE', 'VIP'

  const effectivePassCode = user?.pass_code || getHostPassCode(user);

  const fetchHostData = async () => {
    try {
      const res = await getHostRegistrations();
      if (res?.registrations) {
        setRegistrations(res.registrations);
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
    (r) => r.status === 'INSIDE_CAMPUS' || r.status === 'APPROVED'
  );

  const insideVisitors = registrations.filter(
    (r) => r.status === 'INSIDE_CAMPUS' || r.presence_status === 'currently_inside'
  );

  const isVipOrHodHost = user?.role === 'HOD' || user?.user_type === 'HOD' || user?.role === 'VIP_HOST' || user?.user_type === 'VIP_HOST' || (user?.user_type && user.user_type.includes('VIP_HOST')) || (user?.role && user.role.includes('VIP_HOST'));

  const hostTypeLabel = user?.role === 'RESIDENT' ? 'Resident Host' :
    isVipOrHodHost ? (user?.role === 'HOD' || user?.user_type === 'HOD' ? 'Department HOD' : 'VIP Host') :
    'Employee Host';

  // Filtered Visitors matching search & filter chips
  const filteredVisitors = registrations.filter((r) => {
    const matchesSearch = !searchQuery || 
      (r.visitor_name && r.visitor_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.pass_code && r.pass_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.visitor_phone && r.visitor_phone.includes(searchQuery));

    if (!matchesSearch) return false;

    if (activeFilter === 'PENDING') return r.status === 'PENDING_L1';
    if (activeFilter === 'INSIDE') return r.status === 'INSIDE_CAMPUS' || r.presence_status === 'currently_inside';
    if (activeFilter === 'VIP') return r.visitor_category === 'VIP' || r.is_vvip;
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
              <span style={{ fontSize: '0.72rem', color: '#78716c', fontWeight: '600' }}>Sri Sathya Sai Ashram</span>
            </div>
          </div>
          <IonButtons slot="end">
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

        {/* 1. Hero Profile Banner matching Attachment 2 */}
        <div className="host-hero-banner">
          {/* Top Row: Translucent Tag + Avatar Initial */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.7rem' }}>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.22)', 
              backdropFilter: 'blur(8px)', 
              borderRadius: '9999px', 
              padding: '4px 10px', 
              fontSize: '0.7rem', 
              fontWeight: '800', 
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>☀️</span> {hostTypeLabel.toUpperCase()} &amp; OPS
            </div>
            <div style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '50%', 
              background: 'rgba(0, 0, 0, 0.25)', 
              color: '#ffffff', 
              fontWeight: '800', 
              fontSize: '1.05rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1.5px solid rgba(255, 255, 255, 0.3)'
            }}>
              {userInitial}
            </div>
          </div>

          {/* Middle: Big bold name & subtitle */}
          <div style={{ marginBottom: '0.85rem' }}>
            <h1 style={{ margin: '0 0 0.2rem 0', fontSize: '1.45rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em' }}>
              {user?.name || 'Ramesh Kumar'} (Host)
            </h1>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.88)', fontWeight: '500' }}>
              {hostTypeLabel} • {user?.flat_info || user?.department || 'Karnataka Region'}
            </div>
          </div>

          {/* Bottom Row: Scope active & count badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.2)', 
              borderRadius: '9999px', 
              padding: '4px 11px', 
              color: '#ffffff', 
              fontSize: '0.75rem', 
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}></span>
              Host Scope Active
            </div>
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.2)', 
              borderRadius: '9999px', 
              padding: '4px 12px', 
              color: '#ffffff', 
              fontSize: '0.75rem', 
              fontWeight: '800'
            }}>
              {registrations.length} Visitors Registered
            </div>
          </div>
        </div>

        {/* Carousel indicator dots underneath matching Attachment 2 */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', margin: '0.65rem 0 0.2rem 0' }}>
          <span style={{ width: '18px', height: '6px', borderRadius: '9999px', background: '#b84018', display: 'inline-block' }}></span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f5d0bd', display: 'inline-block' }}></span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f5d0bd', display: 'inline-block' }}></span>
        </div>

        {/* 2. Motivational Seva Card matching Attachment 2 */}
        <div className="host-seva-card">
          <div style={{ 
            width: '46px', 
            height: '46px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #c84a1a, #b43403)', 
            color: '#ffffff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 3px 10px rgba(184, 64, 24, 0.25)'
          }}>
            <Shield size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: '0 0 0.15rem 0', fontSize: '0.92rem', fontWeight: '800', color: '#1c1917' }}>
              Together, we welcome every guest
            </h3>
            <p style={{ margin: 0, fontSize: '0.74rem', color: '#78716c', lineHeight: '1.3' }}>
              Thank you for your commitment to Seva &amp; safe hospitality.
            </p>
          </div>
          <div style={{ 
            background: '#fef3c7', 
            color: '#b45309', 
            padding: '3px 8px', 
            borderRadius: '9999px', 
            fontSize: '0.68rem', 
            fontWeight: '800',
            flexShrink: 0
          }}>
            SEVA
          </div>
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

        {/* 4. Host Permanent Gate Pass Card */}
        <div 
          onClick={() => { setQrZoomLevel(1); setShowHostPassModal(true); }}
          style={{ 
            background: '#ffffff', 
            border: '1.5px solid #ebdccc', 
            borderRadius: '22px', 
            padding: '0.95rem 1.1rem', 
            marginTop: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            cursor: 'pointer',
            boxShadow: '0 3px 12px rgba(184, 64, 24, 0.05)',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ position: 'relative' }}>
            {hostQrUrl ? (
              <img src={hostQrUrl} alt="Host Pass" style={{ width: '56px', height: '56px', borderRadius: '12px', border: '1.5px solid #b84018', background: 'white' }} />
            ) : (
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#fdede3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode size={26} color="#c2410c" />
              </div>
            )}
            <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#b84018', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
              🔍
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.68rem', color: '#b84018', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Host Permanent Gate Pass</span>
              <span style={{ fontSize: '0.68rem', background: '#fdede3', color: '#b84018', padding: '0.15rem 0.45rem', borderRadius: '9999px', fontWeight: 'bold' }}>Tap to Enlarge</span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1c1917', margin: '0.1rem 0' }}>{effectivePassCode}</div>
            <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: '600' }}>✓ Scan at Gate Terminal</span>
          </div>
          <ChevronRight size={18} color="#b84018" />
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
            onClick={() => setActiveFilter(activeFilter === 'ALL' ? 'PENDING' : 'ALL')}
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
          <button 
            type="button"
            className={`host-filter-chip ${activeFilter === 'VIP' ? 'active' : ''}`}
            onClick={() => setActiveFilter('VIP')}
          >
            ✨ VIP Guests
          </button>
        </div>

        {/* 7. Section Header with Underline Accent matching Attachment 1 */}
        <div className="host-section-header">
          <div className="host-section-title-wrap">
            <h3 className="host-section-title">Assigned Visitors</h3>
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
        </div>

        {/* Enlarged Host Pass Modal matching Attachment 3 design */}
        <IonModal isOpen={showHostPassModal} onDidDismiss={() => setShowHostPassModal(false)}>
          <div style={{ padding: '1.5rem', background: '#ffffff', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '1.5px solid #f0e6da', paddingBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={20} color="#b84018" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>Personal Gate Pass</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHostPassModal(false)}
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
              <span>✦</span> OFFICIAL HOST IDENTIFICATION
            </div>

            {/* Host Details */}
            <div style={{ width: '100%', background: '#faf6f0', border: '1.5px solid #ede5da', borderRadius: '18px', padding: '0.85rem', marginBottom: '0.8rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#1c1917' }}>{user?.name || 'Ashram Host'}</h4>
              <div style={{ fontSize: '0.78rem', color: '#78716c', marginTop: '0.2rem', fontWeight: '600' }}>
                {user?.role} • {user?.department || user?.flat_info || 'Sri Sathya Sai Ashram'}
              </div>
            </div>

            {/* Enlarged QR Code Container */}
            <div 
              onClick={() => setQrZoomLevel(qrZoomLevel === 1 ? 1.35 : 1)}
              title="Tap to toggle zoom"
              style={{
                background: '#ffffff',
                border: '3px solid #b84018',
                borderRadius: '22px',
                padding: '1.2rem',
                boxShadow: '0 8px 30px rgba(184, 64, 24, 0.18)',
                margin: '0.4rem 0',
                cursor: 'pointer',
                display: 'inline-block',
              }}
            >
              {hostQrUrl ? (
                <img
                  src={hostQrUrl}
                  alt="Enlarged Host Pass QR"
                  style={{
                    width: `${230 * qrZoomLevel}px`,
                    height: `${230 * qrZoomLevel}px`,
                    maxWidth: '80vw',
                    maxHeight: '80vw',
                    display: 'block',
                    margin: '0 auto',
                    borderRadius: '12px',
                    transition: 'width 0.2s ease, height 0.2s ease',
                  }}
                />
              ) : (
                <div style={{ width: '230px', height: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#78716c' }}>
                  QR Pass
                </div>
              )}
            </div>

            {/* Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0.6rem 0' }}>
              <button
                type="button"
                onClick={() => setQrZoomLevel(Math.max(0.85, Number((qrZoomLevel - 0.2).toFixed(2))))}
                style={{ background: '#f5eee6', border: '1px solid #ebdccc', borderRadius: '8px', padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontWeight: '700' }}
              >
                <ZoomOut size={14} /> Smaller
              </button>
              <span style={{ fontSize: '0.78rem', color: '#57534e', fontWeight: '800', minWidth: '60px' }}>
                {Math.round(qrZoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setQrZoomLevel(Math.min(1.6, Number((qrZoomLevel + 0.2).toFixed(2))))}
                style={{ background: '#fdede3', border: '1px solid #fed7aa', color: '#b84018', borderRadius: '8px', padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontWeight: '700' }}
              >
                <ZoomIn size={14} /> Enlarge
              </button>
            </div>

            {/* Passcode with Copy */}
            <div style={{ width: '100%', background: '#fff8f0', border: '1.5px solid #fed7aa', borderRadius: '18px', padding: '0.85rem', margin: '0.6rem 0' }}>
              <span style={{ fontSize: '0.7rem', color: '#b84018', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Permanent Gate Passcode
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#9a3412', letterSpacing: '0.08em', margin: '0.2rem 0' }}>
                {effectivePassCode}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(effectivePassCode);
                  setCopiedPass(true);
                  setTimeout(() => setCopiedPass(false), 2000);
                }}
                style={{ background: '#fdede3', border: 'none', color: '#b84018', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {copiedPass ? <Check size={12} /> : <Copy size={12} />} {copiedPass ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            {/* Action Buttons matching Attachment 3 */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.6rem' }}>
              <button
                type="button"
                className="host-btn-primary"
                onClick={() => {
                  const frontendUrl = getFrontendUrl();
                  const passUrl = `${frontendUrl}/?pass=${effectivePassCode}`;
                  const shareText = `Jay Sai Ram! Here is my official Ashram Host Gate Pass:\n\nHost: ${user?.name || 'Ashram Host'}\nRole: ${user?.role || 'Host'}\nPasscode: ${effectivePassCode}\nValidity: Permanent\n\nDigital Pass: ${passUrl}`;
                  if (navigator.share) {
                    navigator.share({ title: 'Host Gate Pass', text: shareText, url: passUrl }).catch(() => {});
                  } else {
                    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                  }
                }}
                style={{ width: '100%', padding: '0.85rem' }}
              >
                <Share2 size={16} /> Share via WhatsApp
              </button>

              <button
                type="button"
                onClick={() => setShowHostPassModal(false)}
                style={{ width: '100%', background: 'transparent', color: '#78716c', border: 'none', padding: '0.6rem', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Maybe Later / Close
              </button>
            </div>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
