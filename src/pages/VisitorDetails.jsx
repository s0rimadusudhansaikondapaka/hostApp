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
import { getHostRegistrations, getPublicPassDetails, updateApproval, getBaseUrl, getFrontendUrl } from '../services/api';
import { Share2, Ban, CheckCircle, Car, Users, Calendar, ShieldCheck, MapPin, ZoomIn, ZoomOut, Maximize2, Download, Copy, Check, Printer } from 'lucide-react';
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
    const frontendUrl = getFrontendUrl();
    const passUrl = `${frontendUrl}/?pass=${visitor.pass_code}`;
    const shareText = `Jay Sai Ram! Here is your official Gate Pass for Sathya Sai Grama:\n\nGuest: ${visitor.visitor_name}\nPasscode: ${visitor.pass_code}\nCategory: ${visitor.visitor_category || 'General'}\nStatus: ${visitor.status}\n\nDigital Pass: ${passUrl}\n\nShow this pass at Ashram Security Gate upon arrival.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ashram Gate Pass - ${visitor.pass_code}`,
          text: shareText,
          url: passUrl,
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
              <tr><td class="meta-label">Designated Host</td><td class="meta-val">${pass?.host_name || 'Ashram Host'}</td></tr>
              <tr><td class="meta-label">Scheduled Arrival (SAT)</td><td class="meta-val">${formatDate(pass?.valid_from)}</td></tr>
              <tr><td class="meta-label">Scheduled Departure (SDT)</td><td class="meta-val">${formatDate(pass?.valid_until)}</td></tr>
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
        <IonToolbar style={{ '--background': '#faf6f0', borderBottom: '1px solid #ebdccc' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="" color="dark" />
          </IonButtons>
          <IonTitle style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>Visitor Pass Details</IonTitle>
          <IonButtons slot="end">
            <button
              type="button"
              onClick={handleShare}
              style={{ background: '#fdede3', border: '1.5px solid #fed7aa', color: '#b84018', borderRadius: '9999px', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', marginRight: '0.5rem' }}
            >
              <Share2 size={13} /> Share Pass
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#faf6f0' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: '3rem' }}>
          {/* Card matching Attachment 1 & 2 */}
          <div style={{ background: '#ffffff', border: '1.5px solid #ede5da', borderRadius: '22px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 4px 16px rgba(184, 64, 24, 0.06)' }}>
            
            {/* QR Code Pass Display - Tap to Enlarge */}
            <div 
              onClick={() => { setQrZoomLevel(1); setShowEnlargedModal(true); }}
              title="Tap to enlarge QR Code for gate scanning"
              style={{ 
                background: '#faf6f0', 
                padding: '1.1rem', 
                borderRadius: '20px', 
                border: '2.5px solid #b84018', 
                display: 'inline-block', 
                margin: '0 auto 1rem auto', 
                cursor: 'pointer', 
                boxShadow: '0 6px 20px rgba(184, 64, 24, 0.15)', 
                transition: 'transform 0.15s ease' 
              }}
            >
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Gate Pass QR" style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto', borderRadius: '10px' }} />
              ) : (
                <div style={{ width: '180px', height: '180px', background: '#ede5da', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#78716c', fontWeight: 'bold' }}>
                  QR Code
                </div>
              )}
              <span style={{ fontSize: '0.72rem', color: '#b84018', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginTop: '0.5rem' }}>
                🔍 Tap to Enlarge &amp; Scan
              </span>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#1c1917', margin: '0 0 0.2rem 0' }}>
              {visitor?.visitor_name || 'Guest Visitor'}
            </h2>
            <div style={{ fontSize: '0.84rem', color: '#78716c', marginBottom: '0.5rem', fontWeight: '600' }}>
              {visitor?.visitor_phone}
            </div>

            <div style={{ display: 'inline-block', background: '#fdede3', color: '#9a3412', border: '1.5px solid #fed7aa', padding: '0.35rem 1rem', borderRadius: '9999px', fontSize: '0.92rem', fontWeight: '900', letterSpacing: '0.06em', marginBottom: '1.2rem' }}>
              {visitor?.pass_code || 'GATE-PASS'}
            </div>

            {(visitor?.status === 'REJECTED' || visitor?.rejection_reason) && (
              <div style={{
                textAlign: 'left',
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: '14px',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
                color: '#991b1b'
              }}>
                <div style={{ fontWeight: '800', fontSize: '0.9rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>❌</span> Pass Request Rejected
                </div>
                <div style={{ fontSize: '0.82rem', color: '#7f1d1d' }}>
                  <strong>Rejection Comments:</strong> {visitor?.rejection_reason || visitor?.remarks || 'No remarks provided.'}
                </div>
              </div>
            )}

            {/* Details Table */}
            <div style={{ textAlign: 'left', background: '#faf6f0', borderRadius: '18px', padding: '1rem', border: '1.5px solid #ede5da', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #ebdccc' }}>
                <span style={{ color: '#78716c' }}>Visitor Category</span>
                <strong style={{ color: '#1c1917' }}>{visitor?.visitor_category || 'GENERAL'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #ebdccc' }}>
                <span style={{ color: '#78716c' }}>Visit Status</span>
                <strong style={{ color: visitor?.status === 'APPROVED' || visitor?.status === 'INSIDE_CAMPUS' ? '#15803d' : '#b45309' }}>
                  {visitor?.status?.replace(/_/g, ' ') || 'PENDING'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #ebdccc' }}>
                <span style={{ color: '#78716c' }}>Scheduled Arrival (SAT)</span>
                <span style={{ color: '#1c1917', fontWeight: '700' }}>{formatDate(visitor?.valid_from)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #ebdccc' }}>
                <span style={{ color: '#78716c' }}>Scheduled Departure (SDT)</span>
                <span style={{ color: '#1c1917', fontWeight: '700' }}>{formatDate(visitor?.valid_until)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #ebdccc' }}>
                <span style={{ color: '#78716c' }}>Total Guests</span>
                <strong style={{ color: '#1c1917' }}>{visitor?.person_count || visitor?.adult_men_count || 1} Person(s)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #ebdccc' }}>
                <span style={{ color: '#78716c' }}>Accommodation</span>
                <strong style={{ color: visitor?.stay_required ? '#b84018' : '#78716c' }}>
                  {visitor?.stay_required ? 'Yes (Requested)' : 'No'}
                </strong>
              </div>

              {visitor?.vehicles && visitor?.vehicles.length > 0 && (
                <div style={{ padding: '0.45rem 0', borderBottom: '1px solid #ebdccc' }}>
                  <span style={{ color: '#78716c', display: 'block', marginBottom: '0.2rem' }}>Registered Vehicles ({visitor.vehicles.length}):</span>
                  {visitor.vehicles.map((v, i) => (
                    <div key={i} style={{ fontWeight: '800', color: '#1c1917', paddingLeft: '0.5rem' }}>
                      • {v.plate_number} ({v.vehicle_type})
                    </div>
                  ))}
                </div>
              )}

              <div style={{ padding: '0.45rem 0' }}>
                <span style={{ color: '#78716c', display: 'block' }}>Purpose / Remarks:</span>
                <span style={{ color: '#1c1917', fontWeight: '600' }}>{visitor?.purpose || 'Devotee Ashram Visit'}</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1.4rem' }}>
              <button
                type="button"
                onClick={handleShare}
                style={{ width: '100%', background: '#25d366', border: 'none', color: '#ffffff', fontWeight: '800', fontSize: '0.9rem', padding: '0.85rem', borderRadius: '9999px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)' }}
              >
                📲 Share Pass on WhatsApp
              </button>

              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => handleDownloadPng(qrDataUrl, visitor?.pass_code)}
                  style={{ flex: 1, padding: '0.75rem', fontSize: '0.82rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderRadius: '9999px', border: '1.5px solid #d1d5db', background: '#ffffff', cursor: 'pointer' }}
                >
                  <Download size={15} /> Download PNG
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(visitor, qrDataUrl)}
                  style={{ flex: 1, padding: '0.75rem', fontSize: '0.82rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderRadius: '9999px', border: '1.5px solid #d1d5db', background: '#ffffff', cursor: 'pointer' }}
                >
                  <Printer size={15} /> Print / PDF
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowAlert(true)}
                style={{ width: '100%', padding: '0.85rem', cursor: 'pointer', border: '1.5px solid #fecaca', background: '#fee2e2', color: '#b91c1c', borderRadius: '9999px', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Ban size={16} /> Cancel Visitor Invitation
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

        {/* Enlarged Visitor Pass Modal matching Attachment 3 */}
        <IonModal isOpen={showEnlargedModal} onDidDismiss={() => setShowEnlargedModal(false)}>
          <div style={{ padding: '1.5rem', background: '#ffffff', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '1.5px solid #f0e6da', paddingBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="#b84018" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>Visitor Gate Pass</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEnlargedModal(false)}
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
              <span>✦</span> VERIFIED GATE ENTRY PASS
            </div>

            {/* Visitor Details Banner */}
            <div style={{ width: '100%', background: '#faf6f0', border: '1.5px solid #ede5da', borderRadius: '18px', padding: '0.85rem', marginBottom: '0.8rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#1c1917' }}>{visitor?.visitor_name || 'Guest'}</h4>
              <div style={{ fontSize: '0.78rem', color: '#78716c', marginTop: '0.2rem', fontWeight: '600' }}>
                {visitor?.visitor_phone} • {visitor?.visitor_category || 'GENERAL'}
              </div>
            </div>

            {/* Enlarged QR Code Container with Zoom */}
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
                Authorized Gate Passcode
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#9a3412', letterSpacing: '0.08em', margin: '0.2rem 0' }}>
                {visitor?.pass_code || 'GATE-PASS'}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(visitor?.pass_code || '');
                  setCopiedPass(true);
                  setTimeout(() => setCopiedPass(false), 2000);
                }}
                style={{ background: '#fdede3', border: 'none', color: '#b84018', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {copiedPass ? <Check size={12} /> : <Copy size={12} />} {copiedPass ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            {/* Actions */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.6rem' }}>
              <button
                type="button"
                className="host-btn-primary"
                onClick={handleShare}
                style={{ width: '100%', padding: '0.85rem' }}
              >
                <Share2 size={16} /> Share via WhatsApp
              </button>

              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <button
                  type="button"
                  className="host-btn-outline"
                  onClick={() => handleDownloadPng(qrDataUrl, visitor?.pass_code)}
                  style={{ flex: 1, padding: '0.65rem', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <Download size={14} /> PNG
                </button>
                <button
                  type="button"
                  className="host-btn-outline"
                  onClick={() => handleDownloadPdf(visitor, qrDataUrl)}
                  style={{ flex: 1, padding: '0.65rem', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <Printer size={14} /> PDF
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowEnlargedModal(false)}
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

