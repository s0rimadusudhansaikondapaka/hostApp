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
} from '@ionic/react';
import { useAuth, DEMO_HOSTS } from '../context/AuthContext';
import {
  getResidentFamilyMembers,
  addResidentFamilyMember,
  deleteResidentFamilyMember,
  getBaseUrl,
  setBaseUrl,
  getFrontendUrl,
  setFrontendUrl,
} from '../services/api';
import { User, Users, Plus, Trash2, Globe, LogOut, Shield, Home, Building, QrCode, ZoomIn, ZoomOut, Share2, Download, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';

export default function ProfileSettings({ history }) {
  const { user, selectDemoHost, logout } = useAuth();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [fmName, setFmName] = useState('');
  const [fmPhone, setFmPhone] = useState('');
  const [fmRelation, setFmRelation] = useState('Spouse');
  const [apiUrl, setApiUrlState] = useState(getBaseUrl());
  const [frontendUrl, setFrontendUrlState] = useState(getFrontendUrl());
  const [toastMsg, setToastMsg] = useState('');
  const [hostQrUrl, setHostQrUrl] = useState('');
  const [showHostPassModal, setShowHostPassModal] = useState(false);
  const [qrZoomLevel, setQrZoomLevel] = useState(1);
  const [copiedPass, setCopiedPass] = useState(false);

  useEffect(() => {
    if (user?.pass_code) {
      QRCode.toDataURL(user.pass_code, { width: 600, margin: 2 })
        .then(url => setHostQrUrl(url))
        .catch(() => {});
    }
  }, [user]);

  const isResident = user?.role === 'RESIDENT' || user?.residency_status === 'Resident';

  const fetchFamily = async () => {
    if (!isResident) return;
    try {
      const res = await getResidentFamilyMembers();
      if (res?.family_members) {
        setFamilyMembers(res.family_members);
      }
    } catch (e) {
      console.warn('Failed to fetch family members:', e);
    }
  };

  useEffect(() => {
    fetchFamily();
  }, [user]);

  const handleAddFamily = async (e) => {
    e.preventDefault();
    try {
      const res = await addResidentFamilyMember({
        full_name: fmName,
        phone: fmPhone,
        relationship: fmRelation,
      });
      if (res?.success) {
        setToastMsg('Family member registered successfully!');
        setShowAddFamilyModal(false);
        setFmName('');
        setFmPhone('');
        fetchFamily();
      } else {
        setToastMsg(res?.message || 'Failed to add family member.');
      }
    } catch (err) {
      setToastMsg('Failed to add family member.');
    }
  };

  const handleDeleteFamily = async (id) => {
    try {
      const res = await deleteResidentFamilyMember(id);
      if (res?.success) {
        setToastMsg('Family member removed.');
        fetchFamily();
      }
    } catch (err) {
      setToastMsg('Failed to delete family member.');
    }
  };

  const handleSaveApiUrl = () => {
    setBaseUrl(apiUrl);
    setFrontendUrl(frontendUrl);
    setToastMsg('Server & Portal URLs updated!');
  };

  const handleLogout = () => {
    logout();
    history.replace('/login');
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#faf6f0', borderBottom: '1px solid #ebdccc' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="" color="dark" />
          </IonButtons>
          <IonTitle style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>Host Profile &amp; Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#faf6f0' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '3rem' }}>
          
          {/* 1. Terracotta Gradient Hero Banner matching Attachment 2 */}
          <div className="host-hero-banner" style={{ marginBottom: '1.2rem' }}>
            <div className="host-hero-tag">
              <span>☀️</span> SATHYA SAI GRAMA HOST
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', margin: '0.9rem 0' }}>
              <div className="host-avatar-initial">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="host-hero-name">
                  {user?.name || 'Ashram Host'}
                </h2>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.85)', marginTop: '0.15rem' }}>
                  {user?.role} • {user?.department || user?.flat_info || 'Sri Sathya Sai Ashram'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.8rem', borderTop: '1px solid rgba(255, 255, 255, 0.18)', paddingTop: '0.7rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="host-active-pill">
                  <span className="host-active-dot"></span>
                  Active Host
                </span>
                <span style={{ background: 'rgba(255,255,255,0.18)', color: '#ffffff', borderRadius: '9999px', padding: '3px 10px', fontSize: '0.72rem', fontWeight: '800' }}>
                  {user?.pass_code || 'HOST-PASS'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => { setQrZoomLevel(1); setShowHostPassModal(true); }}
                style={{ 
                  background: '#ffffff', 
                  color: '#9a3412', 
                  border: 'none', 
                  borderRadius: '9999px', 
                  padding: '0.35rem 0.8rem', 
                  fontSize: '0.74rem', 
                  fontWeight: '800', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.35rem', 
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                <QrCode size={14} color="#b84018" /> Gate Pass
              </button>
            </div>
          </div>

          {/* 2. Family Members Section (For Residents) */}
          {isResident && (
            <div style={{ background: '#ffffff', border: '1.5px solid #ede5da', borderRadius: '20px', padding: '1.2rem', marginBottom: '1.2rem', boxShadow: '0 2px 8px rgba(184, 64, 24, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={18} color="#b84018" />
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '800', color: '#1c1917' }}>Registered Family Members</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddFamilyModal(true)}
                  style={{ background: '#fdede3', border: '1.5px solid #fed7aa', color: '#b84018', padding: '0.3rem 0.65rem', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer' }}
                >
                  <Plus size={13} /> Add Member
                </button>
              </div>

              {familyMembers.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: '#78716c', margin: 0 }}>
                  No resident family members linked yet. Family members receive pre-approved ashram entry passes.
                </p>
              ) : (
                familyMembers.map((fm) => (
                  <div
                    key={fm.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#faf6f0', padding: '0.7rem 0.9rem', borderRadius: '14px', border: '1.5px solid #ede5da', marginBottom: '0.5rem' }}
                  >
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#1c1917' }}>{fm.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#78716c' }}>{fm.relationship} • {fm.phone}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFamily(fm.id)}
                      style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', padding: '0.2rem' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 3. Switch Host Profile */}
          <div style={{ background: '#ffffff', border: '1.5px solid #ede5da', borderRadius: '20px', padding: '1.2rem', marginBottom: '1.2rem', boxShadow: '0 2px 8px rgba(184, 64, 24, 0.04)' }}>
            <h3 style={{ margin: '0 0 0.7rem 0', fontSize: '0.98rem', fontWeight: '800', color: '#1c1917' }}>
              Switch Host Persona (For Testing)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {DEMO_HOSTS.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    selectDemoHost(h);
                    setToastMsg(`Switched to ${h.name}`);
                  }}
                  style={{
                    background: user?.id === h.id ? '#fdede3' : '#faf6f0',
                    border: user?.id === h.id ? '2px solid #b84018' : '1.5px solid #ede5da',
                    borderRadius: '14px',
                    padding: '0.65rem 0.9rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.86rem', fontWeight: '800', color: '#1c1917' }}>{h.name}</span>
                    <span style={{ fontSize: '0.72rem', color: '#78716c', display: 'block', marginTop: '0.1rem' }}>{h.department}</span>
                  </div>
                  {user?.id === h.id && <span style={{ fontSize: '0.74rem', color: '#b84018', fontWeight: '800' }}>Active</span>}
                </button>
              ))}
            </div>
          </div>

          {/* 4. API Server Configuration */}
          <div style={{ background: '#ffffff', border: '1.5px solid #ede5da', borderRadius: '20px', padding: '1.2rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(184, 64, 24, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <Globe size={18} color="#b84018" />
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '800', color: '#1c1917' }}>Backend Server API URL</h3>
            </div>
            <input
              type="text"
              className="host-input"
              value={apiUrl}
              onChange={(e) => setApiUrlState(e.target.value)}
              placeholder="e.g. http://localhost:5004/api"
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
              <button
                type="button"
                onClick={() => setApiUrlState('http://localhost:5004/api')}
                style={{ flex: 1, padding: '0.45rem', border: '1.5px solid #ede5da', background: '#faf6f0', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '700', color: '#57534e', cursor: 'pointer' }}
              >
                Local (5004)
              </button>
              <button
                type="button"
                onClick={() => setApiUrlState('https://smsavmsserver.onrender.com/api')}
                style={{ flex: 1, padding: '0.45rem', border: '1.5px solid #ede5da', background: '#faf6f0', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '700', color: '#57534e', cursor: 'pointer' }}
              >
                Cloud (Render)
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '1.1rem', marginBottom: '0.4rem' }}>
              <Globe size={18} color="#b84018" />
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '800', color: '#1c1917' }}>Guest Portal / Frontend URL</h3>
            </div>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.74rem', color: '#78716c' }}>
              Used for guest invite links and online visitor gate passes.
            </p>
            <input
              type="text"
              className="host-input"
              value={frontendUrl}
              onChange={(e) => setFrontendUrlState(e.target.value)}
              placeholder="e.g. https://vms-qrf6.onrender.com"
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
              <button
                type="button"
                onClick={() => setFrontendUrlState('http://localhost:5173')}
                style={{ flex: 1, padding: '0.45rem', border: '1.5px solid #ede5da', background: '#faf6f0', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '700', color: '#57534e', cursor: 'pointer' }}
              >
                Local (5173)
              </button>
              <button
                type="button"
                onClick={() => setFrontendUrlState('https://vms-qrf6.onrender.com')}
                style={{ flex: 1, padding: '0.45rem', border: '1.5px solid #ede5da', background: '#faf6f0', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '700', color: '#57534e', cursor: 'pointer' }}
              >
                Cloud (Render)
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveApiUrl}
              className="host-btn-primary"
              style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', cursor: 'pointer' }}
            >
              Save Configuration
            </button>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              padding: '0.85rem', 
              cursor: 'pointer', 
              border: '1.5px solid #fecaca', 
              background: '#fee2e2', 
              color: '#b91c1c', 
              borderRadius: '9999px',
              fontWeight: '800',
              fontSize: '0.88rem',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.4rem' 
            }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* Add Family Member Modal matching Attachment 3 */}
        <IonModal isOpen={showAddFamilyModal} onDidDismiss={() => setShowAddFamilyModal(false)}>
          <div style={{ padding: '1.5rem', background: '#ffffff', height: '100%', overflowY: 'auto' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '1.5px solid #f0e6da', paddingBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#b84018" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>Add Family Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddFamilyModal(false)}
                style={{ background: '#f5eee6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#57534e', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFamily}>
              <div style={{ background: '#faf6f0', border: '1.5px solid #ede5da', borderRadius: '18px', padding: '1rem', marginBottom: '1.2rem' }}>
                <label className="host-label" style={{ marginTop: 0 }}>Full Name *</label>
                <input
                  type="text"
                  required
                  className="host-input"
                  placeholder="Family member full name"
                  value={fmName}
                  onChange={(e) => setFmName(e.target.value)}
                />

                <label className="host-label">Relationship *</label>
                <select className="host-input" value={fmRelation} onChange={(e) => setFmRelation(e.target.value)}>
                  <option value="Spouse">Spouse (Husband / Wife)</option>
                  <option value="Parent">Parent (Father / Mother)</option>
                  <option value="Child">Child (Son / Daughter)</option>
                  <option value="Sibling">Sibling (Brother / Sister)</option>
                  <option value="Relative">Other Relative</option>
                </select>

                <label className="host-label">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  className="host-input"
                  placeholder="e.g. 9876543210"
                  value={fmPhone}
                  onChange={(e) => setFmPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  type="submit"
                  className="host-btn-primary"
                  style={{ flex: 1.5, padding: '0.85rem', cursor: 'pointer' }}
                >
                  Save Family Member
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddFamilyModal(false)}
                  className="host-btn-outline"
                  style={{ flex: 1, padding: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </IonModal>

        {/* Enlarged Host Pass Modal matching Attachment 3 */}
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

            {/* Pill Badge */}
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
                {user?.pass_code || 'HOST-PASS-01'}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(user?.pass_code || '');
                  setCopiedPass(true);
                  setTimeout(() => setCopiedPass(false), 2000);
                }}
                style={{ background: '#fdede3', border: 'none', color: '#b84018', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {copiedPass ? <Check size={12} /> : <Copy size={12} />} {copiedPass ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            {/* Action Buttons */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.6rem' }}>
              <button
                type="button"
                className="host-btn-primary"
                onClick={() => {
                  const fUrl = getFrontendUrl();
                  const passUrl = `${fUrl}/?pass=${user?.pass_code}`;
                  const shareText = `Jay Sai Ram! Here is my official Ashram Host Gate Pass:\n\nHost: ${user?.name}\nRole: ${user?.role}\nPasscode: ${user?.pass_code}\nValidity: Permanent\n\nDigital Pass: ${passUrl}`;
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

