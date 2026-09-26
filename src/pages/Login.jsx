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
      <IonContent fullscreen className="ion-padding" style={{ '--background': '#faf6f0' }}>
        <div style={{ maxWidth: '420px', margin: '2.5rem auto 1.5rem auto', textAlign: 'center' }}>
          
          {/* Header matching Attachment 2 & 3 */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '64px', 
            height: '64px', 
            borderRadius: '22px', 
            background: 'linear-gradient(135deg, #c84a1a 0%, #b43403 50%, #9a3412 100%)', 
            color: 'white', 
            marginBottom: '0.85rem', 
            boxShadow: '0 8px 24px rgba(184, 64, 24, 0.3)' 
          }}>
            <ShieldCheck size={36} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1c1917', margin: '0 0 0.25rem 0', letterSpacing: '-0.02em' }}>Ashram Host</h1>
          <p style={{ fontSize: '0.84rem', color: '#78716c', margin: '0 0 1.8rem 0', fontWeight: '500' }}>Manage safe &amp; secure visitor access with devotion</p>

          <div style={{ background: '#ffffff', border: '1.5px solid #ede5da', borderRadius: '24px', padding: '1.6rem', textAlign: 'left', boxShadow: '0 4px 20px rgba(184, 64, 24, 0.05)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1c1917', margin: '0 0 0.25rem 0' }}>Welcome back!</h2>
            <p style={{ fontSize: '0.8rem', color: '#78716c', margin: '0 0 1.2rem 0' }}>Login to manage guest invites and approvals</p>

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
                <Smartphone size={18} color="#a8a29e" style={{ position: 'absolute', right: '14px', top: '13px' }} />
              </div>

              {isOtpMode ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="host-label" style={{ marginTop: 0 }}>Enter OTP</label>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      style={{ background: 'none', border: 'none', color: '#b84018', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', padding: 0 }}
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
                    <Lock size={18} color="#a8a29e" style={{ position: 'absolute', right: '14px', top: '13px' }} />
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
                    <Lock size={18} color="#a8a29e" style={{ position: 'absolute', right: '14px', top: '13px' }} />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="host-btn-primary"
                style={{ width: '100%', padding: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loading ? 'Please wait...' : 'Login to Ashram Host'} <ArrowRight size={18} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsOtpMode(!isOtpMode)}
                  style={{ background: 'none', border: 'none', color: '#78716c', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}
                >
                  {isOtpMode ? 'Switch to Password Login' : 'Switch to Mobile OTP Login'}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Demo Host Login Buttons */}
          <div style={{ marginTop: '1.8rem', textAlign: 'left' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Select Host Profile to test
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginTop: '0.6rem' }}>
              {DEMO_HOSTS.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => handleSelectDemo(h)}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #ede5da',
                    borderRadius: '16px',
                    padding: '0.75rem 0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: '0 2px 6px rgba(184, 64, 24, 0.03)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#1c1917' }}>{h.name}</div>
                    <div style={{ fontSize: '0.73rem', color: '#78716c', marginTop: '0.1rem' }}>{h.department} • {h.unit_number}</div>
                  </div>
                  <span style={{ background: '#fdede3', color: '#b84018', border: '1px solid #fed7aa', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: '800' }}>
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
