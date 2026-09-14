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
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonModal,
} from '@ionic/react';
import { personCircleOutline, notificationsOutline, logOutOutline, qrCodeOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { getHostRegistrations } from '../services/api';
import { UserPlus, Clock, Users, History, ChevronRight, Shield, QrCode, ZoomIn, ZoomOut, Share2, Download, Maximize2, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';

export default function HostHome({ history }) {
  const { user, logout } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hostQrUrl, setHostQrUrl] = useState('');
  const [showHostPassModal, setShowHostPassModal] = useState(false);
  const [qrZoomLevel, setQrZoomLevel] = useState(1);
  const [copiedPass, setCopiedPass] = useState(false);

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
    if (user?.pass_code) {
      QRCode.toDataURL(user.pass_code, { width: 600, margin: 2 })
        .then(url => setHostQrUrl(url))
        .catch(() => {});
    }
  }, [user]);

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

  const isVipOrHodHost = user?.role === 'HOD' || user?.user_type === 'HOD' || user?.role === 'VIP_HOST' || user?.user_type === 'VIP_HOST' || (user?.user_type && user.user_type.includes('VIP_HOST')) || (user?.role && user.role.includes('VIP_HOST'));

  const hostTypeLabel = user?.role === 'RESIDENT' ? 'Resident Host' :
    isVipOrHodHost ? (user?.role === 'HOD' || user?.user_type === 'HOD' ? 'Department HOD (Direct Pass)' : 'VIP Host (Direct Pass)') :
    'Employee Host';

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Shield size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>Ashram Host</h2>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{hostTypeLabel}</span>
            </div>
          </div>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/profile')} color="primary">
              <IonIcon icon={personCircleOutline} style={{ fontSize: '26px' }} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#f8fafc' }}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Welcome Section matching Wireframe Screen 2 */}
        <div style={{ margin: '0.5rem 0 0.8rem 0' }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.2rem 0' }}>
            Welcome, {user?.name || 'Host'}!
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
            Thank you for being a part of Ashram stay. Manage guest invites and entry permissions safely.
          </p>
        </div>

        {/* VIP / HOD Direct Pass Privileges Banner */}
        {isVipOrHodHost && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '0.7rem 0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.3rem' }}>⚡</span>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#166534' }}>
                Direct Gate Pass Privileges
              </div>
              <div style={{ fontSize: '0.74rem', color: '#15803d' }}>
                Your invited visitors are directly approved with instant QR gate passes. No L2 approval required.
              </div>
            </div>
          </div>
        )}

        {/* 4 Primary Action Cards matching Wireframe Screen 2 */}
        <div style={{ marginTop: '1rem' }}>
          {/* 1. Invite Visitor Card */}
          <div className="host-action-card" onClick={() => history.push('/invite-visitor')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3730a3' }}>
                <UserPlus size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '700', color: '#0f172a' }}>Invite Visitor</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Create a new visitor invite or share link</p>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </div>

          {/* 2. My Pending Approvals Card */}
          <div className="host-action-card" onClick={() => history.push('/approval-status')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
                <Clock size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '700', color: '#0f172a' }}>My Pending Approvals</h3>
                  {pendingApprovals.length > 0 && (
                    <span style={{ background: '#f59e0b', color: '#ffffff', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.15rem 0.45rem', borderRadius: '9999px' }}>
                      {pendingApprovals.length}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                  {pendingApprovals.length > 0 ? `${pendingApprovals.length} guest request(s) awaiting your review` : 'No pending approval requests'}
                </p>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </div>

          {/* 3. Active Visitors Card */}
          <div className="host-action-card" onClick={() => history.push('/active-visitors')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }}>
                <Users size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '700', color: '#0f172a' }}>Active Visitors</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Check arriving &amp; active visitors ({activeVisitors.length})</p>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </div>

          {/* 4. Past Visitors Card */}
          <div className="host-action-card" onClick={() => history.push('/past-visitors')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                <History size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '700', color: '#0f172a' }}>Past Visitors</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>View past visit archives &amp; logs</p>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </div>
        </div>

        {/* Host Personal Gate Pass Banner - Enlargeable on Tap */}
        <div 
          onClick={() => { setQrZoomLevel(1); setShowHostPassModal(true); }}
          style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', 
            border: '1.5px solid #86efac', 
            borderRadius: '14px', 
            padding: '1rem', 
            marginTop: '1.2rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.1)',
          }}
        >
          <div style={{ position: 'relative' }}>
            {hostQrUrl ? (
              <img src={hostQrUrl} alt="Host Pass" style={{ width: '64px', height: '64px', borderRadius: '8px', border: '1.5px solid #16a34a', background: 'white' }} />
            ) : (
              <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode size={30} color="#64748b" />
              </div>
            )}
            <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#16a34a', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
              🔍
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Host Permanent Gate Pass</span>
              <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#166534', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>Tap to Enlarge</span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '0.1rem 0' }}>{user?.pass_code || 'HOST-PASS-01'}</div>
            <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: '600' }}>✓ Scan at Gate Terminal</span>
          </div>
          <ChevronRight size={18} color="#16a34a" />
        </div>

        {/* Enlarged Host Pass Modal */}
        <IonModal isOpen={showHostPassModal} onDidDismiss={() => setShowHostPassModal(false)}>
          <div style={{ padding: '1.5rem', background: '#ffffff', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={20} color="#1e3a8a" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>Personal Gate Pass</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHostPassModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            {/* Host Details */}
            <div style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.8rem', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{user?.name || 'Ashram Host'}</h4>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                {user?.role} • {user?.department || user?.unit_number || 'Sathya Sai Grama'}
              </div>
            </div>

            {/* Enlarged QR Code Container with Zoom */}
            <div 
              onClick={() => setQrZoomLevel(qrZoomLevel === 1 ? 1.35 : 1)}
              title="Tap to toggle zoom"
              style={{
                background: '#ffffff',
                border: '3px solid #1e3a8a',
                borderRadius: '18px',
                padding: '1.2rem',
                boxShadow: '0 8px 30px rgba(30, 58, 138, 0.15)',
                margin: '0.5rem 0',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
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
                    borderRadius: '8px',
                    transition: 'width 0.2s ease, height 0.2s ease',
                  }}
                />
              ) : (
                <div style={{ width: '230px', height: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  QR Pass
                </div>
              )}
            </div>

            {/* Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0.6rem 0' }}>
              <button
                type="button"
                onClick={() => setQrZoomLevel(Math.max(0.85, Number((qrZoomLevel - 0.2).toFixed(2))))}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <ZoomOut size={14} /> Smaller
              </button>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 'bold', minWidth: '60px' }}>
                {Math.round(qrZoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setQrZoomLevel(Math.min(1.6, Number((qrZoomLevel + 0.2).toFixed(2))))}
                style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a8a', borderRadius: '6px', padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <ZoomIn size={14} /> Enlarge
              </button>
            </div>

            {/* Passcode with Copy */}
            <div style={{ width: '100%', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '12px', padding: '0.8rem', margin: '0.8rem 0' }}>
              <span style={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Permanent Gate Passcode
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#5b21b6', letterSpacing: '0.08em', margin: '0.2rem 0' }}>
                {user?.pass_code || 'HOST-PASS-01'}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(user?.pass_code || '');
                  setCopiedPass(true);
                  setTimeout(() => setCopiedPass(false), 2000);
                }}
                style={{ background: '#ede9fe', border: 'none', color: '#6d28d9', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {copiedPass ? <Check size={12} /> : <Copy size={12} />} {copiedPass ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <span style={{ fontSize: '0.74rem', color: '#057a55', fontWeight: '700', marginBottom: '1.2rem', display: 'block' }}>
              ⚡ High-Brightness Screen Mode Ready for Gate Scanner
            </span>

            {/* Share & Download Actions */}
            <div style={{ width: '100%', display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  const shareText = `Jay Sai Ram! Here is my official Ashram Host Gate Pass:\n\nHost: ${user?.name}\nRole: ${user?.role}\nPasscode: ${user?.pass_code}\nValidity: Permanent`;
                  if (navigator.share) {
                    navigator.share({ title: 'Host Gate Pass', text: shareText }).catch(() => {});
                  } else {
                    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                  }
                }}
                style={{ flex: 1, background: '#25d366', color: 'white', border: 'none', borderRadius: '10px', padding: '0.65rem', fontWeight: 'bold', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer' }}
              >
                <Share2 size={15} /> WhatsApp
              </button>

              {hostQrUrl && (
                <a
                  href={hostQrUrl}
                  download={`HostPass_${user?.pass_code || 'HOST'}.png`}
                  style={{ flex: 1, textDecoration: 'none' }}
                >
                  <button
                    type="button"
                    style={{ width: '100%', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '10px', padding: '0.65rem', fontWeight: 'bold', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer' }}
                  >
                    <Download size={15} /> Save QR
                  </button>
                </a>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowHostPassModal(false)}
              style={{ width: '100%', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', padding: '0.65rem', fontWeight: 'bold', fontSize: '0.82rem', cursor: 'pointer', marginTop: '0.3rem' }}
            >
              Close
            </button>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
