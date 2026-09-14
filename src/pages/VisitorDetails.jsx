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
  IonAlert,
  IonModal,
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { getHostRegistrations, getPublicPassDetails, updateApproval, getBaseUrl } from '../services/api';
import { Share2, Ban, CheckCircle, Car, Users, Calendar, ShieldCheck, MapPin, ZoomIn, ZoomOut, Maximize2, Download, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';

export default function VisitorDetails({ match, history }) {
  const codeOrId = match.params.codeOrId;
  const [visitor, setVisitor] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showEnlargedModal, setShowEnlargedModal] = useState(false);
  const [qrZoomLevel, setQrZoomLevel] = useState(1);
  const [copiedPass, setCopiedPass] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [codeOrId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      // 1. Try finding from host registrations
      const hostRes = await getHostRegistrations();
      if (hostRes?.registrations) {
        const found = hostRes.registrations.find(
          (r) => String(r.pass_code) === codeOrId || String(r.id) === codeOrId
        );
        if (found) {
          setVisitor(found);
          generateQr(found.pass_code || `PASS-${found.id}`);
          setLoading(false);
          return;
        }
      }

      // 2. Try fetching from public pass details endpoint
      const passRes = await getPublicPassDetails(codeOrId);
      if (passRes?.pass) {
        setVisitor(passRes.pass);
        generateQr(passRes.pass.pass_code);
      }
    } catch (err) {
      console.warn('Error loading visitor pass details:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateQr = (code) => {
    if (!code) return;
    QRCode.toDataURL(code, { width: 600, margin: 2 })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  };

  const handleShare = async () => {
    if (!visitor) return;
    const shareText = `Jay Sai Ram! Here is your official Gate Pass for Sathya Sai Grama:\n\nGuest: ${visitor.visitor_name}\nPasscode: ${visitor.pass_code}\nCategory: ${visitor.visitor_category || 'General'}\nStatus: ${visitor.status}\n\nShow this pass at Ashram Security Gate upon arrival.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ashram Gate Pass - ${visitor.pass_code}`,
          text: shareText,
        });
        return;
      } catch (e) {}
    }

    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleCancelVisit = async () => {
    if (!visitor) return;
    try {
      const res = await updateApproval(visitor.id, 'REJECT', 'Visit cancelled by host');
      if (res?.success) {
        setToastMsg('Visit cancelled successfully.');
        setTimeout(() => history.replace('/home'), 1200);
      }
    } catch (err) {
      setToastMsg('Failed to cancel visit.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader className="ion-no-border">
          <IonToolbar style={{ '--background': '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" text="" />
            </IonButtons>
            <IonTitle style={{ fontSize: '1.05rem', fontWeight: '800' }}>Visitor Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding" style={{ textAlign: 'center', paddingTop: '3rem' }}>
          <p style={{ color: '#64748b' }}>Loading visitor gate pass...</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="" />
          </IonButtons>
          <IonTitle style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>Visitor Details</IonTitle>
          <IonButtons slot="end">
            <button
              type="button"
              onClick={handleShare}
              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', borderRadius: '8px', padding: '0.4rem 0.65rem', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', marginRight: '0.5rem' }}
            >
              <Share2 size={14} /> Share Pass
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#f8fafc' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: '3rem' }}>
          {/* Card matching Wireframe Screen 5 */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            {/* QR Code Pass Display - Tap to Enlarge */}
            <div 
              onClick={() => { setQrZoomLevel(1); setShowEnlargedModal(true); }}
              title="Tap to enlarge QR Code for gate scanning"
              style={{ background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '2px solid #6366f1', display: 'inline-block', margin: '0 auto 1rem auto', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.12)', transition: 'transform 0.15s ease' }}
            >
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Gate Pass QR" style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto', borderRadius: '6px' }} />
              ) : (
                <div style={{ width: '180px', height: '180px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  QR Code
                </div>
              )}
              <span style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginTop: '0.5rem' }}>
                🔍 Tap to Enlarge &amp; Scan
              </span>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.2rem 0' }}>
              {visitor?.visitor_name || 'Guest Visitor'}
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>{visitor?.visitor_phone}</div>

            <div style={{ display: 'inline-block', background: '#e0e7ff', color: '#3730a3', padding: '0.3rem 0.85rem', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '1.2rem' }}>
              {visitor?.pass_code || 'GATE-PASS'}
            </div>

            {/* Details Table */}
            <div style={{ textAlign: 'left', background: '#f8fafc', borderRadius: '12px', padding: '1rem', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Visitor Category</span>
                <strong style={{ color: '#0f172a' }}>{visitor?.visitor_category || 'GENERAL'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Visit Status</span>
                <strong style={{ color: visitor?.status === 'APPROVED' ? '#15803d' : '#b45309' }}>
                  {visitor?.status || 'PENDING'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Scheduled Arrival</span>
                <span style={{ color: '#0f172a', fontWeight: '600' }}>{formatDate(visitor?.valid_from)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Scheduled Departure</span>
                <span style={{ color: '#0f172a', fontWeight: '600' }}>{formatDate(visitor?.valid_until)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Total Guests</span>
                <strong style={{ color: '#0f172a' }}>{visitor?.person_count || visitor?.adult_men_count || 1} Person(s)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Accommodation</span>
                <strong style={{ color: visitor?.stay_required ? '#2563eb' : '#64748b' }}>
                  {visitor?.stay_required ? 'Yes (Requested)' : 'No'}
                </strong>
              </div>

              {visitor?.vehicles && visitor?.vehicles.length > 0 && (
                <div style={{ padding: '0.4rem 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>Registered Vehicles ({visitor.vehicles.length}):</span>
                  {visitor.vehicles.map((v, i) => (
                    <div key={i} style={{ fontWeight: 'bold', color: '#0f172a', paddingLeft: '0.5rem' }}>
                      • {v.plate_number} ({v.vehicle_type})
                    </div>
                  ))}
                </div>
              )}

              <div style={{ padding: '0.4rem 0' }}>
                <span style={{ color: '#64748b', display: 'block' }}>Purpose / Remarks:</span>
                <span style={{ color: '#0f172a' }}>{visitor?.purpose || 'Devotee Ashram Visit'}</span>
              </div>
            </div>

            {/* Bottom Actions matching wireframe Screen 5 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1.4rem' }}>
              <button
                type="button"
                onClick={handleShare}
                style={{ width: '100%', background: '#25d366', border: 'none', color: '#ffffff', fontWeight: 'bold', fontSize: '0.9rem', padding: '0.8rem', borderRadius: '9999px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                📲 Share Pass on WhatsApp
              </button>

              <button
                type="button"
                onClick={() => setShowAlert(true)}
                className="host-btn-outline"
                style={{ width: '100%', padding: '0.8rem', cursor: 'pointer', borderColor: '#dc2626', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Ban size={18} /> Cancel Visit
              </button>
            </div>
          </div>
        </div>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Cancel Visitor Invitation?"
          message="Are you sure you want to revoke this pass? The visitor will not be allowed entry at the gate."
          buttons={[
            { text: 'Keep Pass', role: 'cancel' },
            { text: 'Yes, Cancel Visit', handler: handleCancelVisit },
          ]}
        />

        {/* Enlarged Visitor Pass Modal */}
        <IonModal isOpen={showEnlargedModal} onDidDismiss={() => setShowEnlargedModal(false)}>
          <div style={{ padding: '1.5rem', background: '#ffffff', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="#4f46e5" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>Visitor Gate Pass</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEnlargedModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            {/* Visitor Details Banner */}
            <div style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.8rem', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>{visitor?.visitor_name || 'Guest'}</h4>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                {visitor?.visitor_phone} • {visitor?.visitor_category || 'GENERAL'}
              </div>
            </div>

            {/* Enlarged QR Code Container with Zoom */}
            <div 
              onClick={() => setQrZoomLevel(qrZoomLevel === 1 ? 1.35 : 1)}
              title="Tap to toggle zoom"
              style={{
                background: '#ffffff',
                border: '3px solid #4f46e5',
                borderRadius: '18px',
                padding: '1.2rem',
                boxShadow: '0 8px 30px rgba(79, 70, 229, 0.15)',
                margin: '0.5rem 0',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-block',
              }}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Enlarged Gate Pass QR"
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
                style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#4f46e5', borderRadius: '6px', padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <ZoomIn size={14} /> Enlarge
              </button>
            </div>

            {/* Passcode with Copy */}
            <div style={{ width: '100%', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '0.8rem', margin: '0.8rem 0' }}>
              <span style={{ fontSize: '0.7rem', color: '#4f46e5', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Authorized Gate Passcode
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#312e81', letterSpacing: '0.08em', margin: '0.2rem 0' }}>
                {visitor?.pass_code || 'GATE-PASS'}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(visitor?.pass_code || '');
                  setCopiedPass(true);
                  setTimeout(() => setCopiedPass(false), 2000);
                }}
                style={{ background: '#e0e7ff', border: 'none', color: '#3730a3', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
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
                onClick={handleShare}
                style={{ flex: 1, background: '#25d366', color: 'white', border: 'none', borderRadius: '10px', padding: '0.65rem', fontWeight: 'bold', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer' }}
              >
                <Share2 size={15} /> WhatsApp
              </button>

              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`VisitorPass_${visitor?.pass_code || 'PASS'}.png`}
                  style={{ flex: 1, textDecoration: 'none' }}
                >
                  <button
                    type="button"
                    style={{ width: '100%', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '10px', padding: '0.65rem', fontWeight: 'bold', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer' }}
                  >
                    <Download size={15} /> Save QR
                  </button>
                </a>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowEnlargedModal(false)}
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
