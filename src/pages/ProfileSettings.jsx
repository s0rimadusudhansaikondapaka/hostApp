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
    setToastMsg('API Server URL updated!');
  };

  const handleLogout = () => {
    logout();
    history.replace('/login');
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="" />
          </IonButtons>
          <IonTitle style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>Host Profile &amp; Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#f8fafc' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto', paddingBottom: '3rem' }}>
          {/* Host Card */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.2rem', textAlign: 'center', marginBottom: '1.2rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#1e3a8a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem auto', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {user?.name ? user.name.charAt(0) : 'H'}
            </div>
            <h2 style={{ margin: '0 0 0.2rem 0', fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>{user?.name || 'Ashram Host'}</h2>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{user?.phone} • {user?.email}</span>

            <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {user?.role}
              </span>
              <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                Passcode: {user?.pass_code || 'HOST-PASS'}
              </span>
            </div>

            <div style={{ marginTop: '0.8rem' }}>
              <button
                type="button"
                onClick={() => { setQrZoomLevel(1); setShowHostPassModal(true); }}
                style={{ background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '8px', padding: '0.45rem 0.9rem', fontSize: '0.78rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(30,58,138,0.2)' }}
              >
                <QrCode size={16} /> View &amp; Enlarge Gate Pass
              </button>
            </div>

            <div style={{ textAlign: 'left', background: '#f8fafc', borderRadius: '10px', padding: '0.8rem', marginTop: '1rem', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
              <div><strong>Department / Unit:</strong> {user?.department || 'Sathya Sai Grama'}</div>
              <div><strong>Residence / Office:</strong> {user?.unit_number || 'Main Ashram'}</div>
            </div>
          </div>

          {/* Family Members Section (For Residents) */}
          {isResident && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.2rem', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={18} color="#1e3a8a" />
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '800', color: '#0f172a' }}>Registered Family Members</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddFamilyModal(true)}
                  style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer' }}
                >
                  <Plus size={14} /> Add Member
                </button>
              </div>

              {familyMembers.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  No resident family members linked yet. Family members receive pre-approved ashram entry passes.
                </p>
              ) : (
                familyMembers.map((fm) => (
                  <div
                    key={fm.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '0.4rem' }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#0f172a' }}>{fm.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{fm.relationship} • {fm.phone}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFamily(fm.id)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.2rem' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Switch Host Profile */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.2rem', marginBottom: '1.2rem' }}>
            <h3 style={{ margin: '0 0 0.6rem 0', fontSize: '0.98rem', fontWeight: '800', color: '#0f172a' }}>
              Switch Host Persona (For Testing)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {DEMO_HOSTS.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    selectDemoHost(h);
                    setToastMsg(`Switched to ${h.name}`);
                  }}
                  style={{
                    background: user?.id === h.id ? '#eff6ff' : '#f8fafc',
                    border: user?.id === h.id ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.5rem 0.8rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#0f172a' }}>{h.name}</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>{h.department}</span>
                  </div>
                  {user?.id === h.id && <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 'bold' }}>Active</span>}
                </button>
              ))}
            </div>
          </div>

          {/* API Server Configuration */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.2rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <Globe size={18} color="#1e3a8a" />
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '800', color: '#0f172a' }}>Backend Server API URL</h3>
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
                style={{ flex: 1, padding: '0.4rem', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}
              >
                Local (5004)
              </button>
              <button
                type="button"
                onClick={() => setApiUrlState('https://smsavmsserver.onrender.com/api')}
                style={{ flex: 1, padding: '0.4rem', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}
              >
                Cloud (Render)
              </button>
              <button
                type="button"
                onClick={handleSaveApiUrl}
                style={{ flex: 1, padding: '0.4rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Save URL
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="host-btn-outline"
            style={{ width: '100%', padding: '0.8rem', cursor: 'pointer', borderColor: '#dc2626', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

        {/* Add Family Member Modal */}
        <IonModal isOpen={showAddFamilyModal} onDidDismiss={() => setShowAddFamilyModal(false)}>
          <div style={{ padding: '1.5rem', background: '#ffffff', height: '100%' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.8rem 0' }}>
              Add Resident Family Member
            </h2>
            <form onSubmit={handleAddFamily}>
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

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  className="host-btn-primary"
                  style={{ flex: 1, padding: '0.75rem', border: 'none', cursor: 'pointer' }}
                >
                  Save Family Member
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddFamilyModal(false)}
                  className="host-btn-outline"
                  style={{ padding: '0.75rem 1rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </IonModal>

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

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={2500} onDidDismiss={() => setToastMsg('')} />
      </IonContent>
    </IonPage>
  );
}
