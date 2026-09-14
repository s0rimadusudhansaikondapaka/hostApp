import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonToast,
} from '@ionic/react';
import { useAuth, DEMO_HOSTS } from '../context/AuthContext';
import { sendOtp } from '../services/api';
import { Smartphone, Lock, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';

export default function Login({ history }) {
  const { loginWithPhoneOtp, loginWithCredentials, selectDemoHost } = useAuth();

  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [isOtpMode, setIsOtpMode] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleSendOtp = async () => {
    if (!phoneOrEmail || phoneOrEmail.length < 5) {
      setToastMsg('Please enter a valid mobile number.');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(phoneOrEmail);
      setOtpSent(true);
      setToastMsg('OTP sent to your mobile number: 123456 (Dev OTP)');
    } catch (err) {
      setOtpSent(true);
      setToastMsg('Dev mode: Enter demo OTP 123456');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isOtpMode) {
        if (!otp && !otpSent) {
          await handleSendOtp();
          setLoading(false);
          return;
        }
        await loginWithPhoneOtp(phoneOrEmail, otp || '123456');
      } else {
        await loginWithCredentials(phoneOrEmail, password || 'admin123');
      }
      history.replace('/home');
    } catch (err) {
      setToastMsg(err.response?.data?.message || 'Login failed. Please check your credentials or pick a demo host below.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (host) => {
    selectDemoHost(host);
    setToastMsg(`Logged in as ${host.name}`);
    history.replace('/home');
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding" style={{ '--background': '#ffffff' }}>
        <div style={{ maxWidth: '400px', margin: '2rem auto 1rem auto', textAlign: 'center' }}>
          {/* Header matching Wireframe Screen 1 */}
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: '#1e3a8a', color: 'white', marginBottom: '0.75rem', boxShadow: '0 4px 14px rgba(30,58,138,0.25)' }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.25rem 0' }}>Ashram Host</h1>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1.8rem 0' }}>Manage safe &amp; secure with devotion</p>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>Welcome back!</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1.2rem 0' }}>Login to manage guest invites and approvals</p>

            <form onSubmit={handleLogin}>
              <label className="host-label" style={{ marginTop: 0 }}>
                {isOtpMode ? 'Mobile Number' : 'Email or Mobile'}
              </label>
              <div style={{ position: 'relative', marginBottom: '0.8rem' }}>
                <input
                  type="text"
                  className="host-input"
                  placeholder={isOtpMode ? "e.g. 9876543210" : "e.g. resident1@ashram.org"}
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  required
                />
                <Smartphone size={18} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '12px' }} />
              </div>

              {isOtpMode ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="host-label" style={{ marginTop: 0 }}>Enter OTP</label>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                    >
                      {otpSent ? 'Resend OTP' : 'Send Code'}
                    </button>
                  </div>
                  <div style={{ position: 'relative', marginBottom: '1.2rem' }}>
                    <input
                      type="text"
                      className="host-input"
                      placeholder="6-digit OTP (e.g. 123456)"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                    <Lock size={18} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '12px' }} />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="host-label" style={{ marginTop: 0 }}>Password</label>
                  <div style={{ position: 'relative', marginBottom: '1.2rem' }}>
                    <input
                      type="password"
                      className="host-input"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Lock size={18} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '12px' }} />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="host-btn-primary"
                style={{ width: '100%', padding: '0.8rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loading ? 'Please wait...' : 'Login'} <ArrowRight size={18} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.9rem' }}>
                <button
                  type="button"
                  onClick={() => setIsOtpMode(!isOtpMode)}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {isOtpMode ? 'Switch to Password Login' : 'Switch to Mobile OTP Login'}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Demo Host Login Buttons */}
          <div style={{ marginTop: '1.8rem', textAlign: 'left' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Host Profile to test
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
              {DEMO_HOSTS.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => handleSelectDemo(h)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>{h.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{h.department} • {h.unit_number}</div>
                  </div>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                    {h.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

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
