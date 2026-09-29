import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonToast,
  IonSpinner,
} from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { sendOtp } from '../services/api';
import { Smartphone, Lock, ShieldCheck, ArrowRight, Eye, EyeOff, Building, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Login({ history }) {
  const { loginWithPhoneOtp, loginWithCredentials } = useAuth();

  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpMode, setIsOtpMode] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    setErrorMessage('');
    const cleanPhone = phoneOrEmail.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const res = await sendOtp(cleanPhone);
      setOtpSent(true);
      setResendTimer(45);
      if (res?.dev_otp) {
        setToastMsg(`Verification code sent (Dev: ${res.dev_otp})`);
      } else {
        setToastMsg('Verification OTP sent to your registered mobile number.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      if (isOtpMode) {
        if (!otp && !otpSent) {
          await handleSendOtp();
          setLoading(false);
          return;
        }
        if (!otp || otp.trim().length === 0) {
          setErrorMessage('Please enter the verification code sent to your phone.');
          setLoading(false);
          return;
        }
        await loginWithPhoneOtp(phoneOrEmail.trim(), otp.trim());
      } else {
        if (!phoneOrEmail || !password) {
          setErrorMessage('Please enter both your identifier and password.');
          setLoading(false);
          return;
        }
        await loginWithCredentials(phoneOrEmail.trim(), password);
      }
      history.replace('/home');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please verify your credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding" style={{ '--background': '#faf6f0' }}>
        <div style={{ maxWidth: '420px', margin: '2rem auto 2rem auto', textAlign: 'center' }}>
          
          {/* Spiritual Terracotta Ashram Emblem Banner */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '68px', 
            height: '68px', 
            borderRadius: '24px', 
            background: 'linear-gradient(135deg, #c84a1a 0%, #b43403 50%, #9a3412 100%)', 
            color: 'white', 
            marginBottom: '0.85rem', 
            boxShadow: '0 8px 24px rgba(184, 64, 24, 0.3)' 
          }}>
            <ShieldCheck size={38} />
          </div>
          
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1c1917', margin: '0 0 0.25rem 0', letterSpacing: '-0.02em' }}>
            Ashram Host
          </h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#fdede3', border: '1px solid #fed7aa', color: '#9a3412', padding: '3px 12px', borderRadius: '9999px', fontSize: '0.74rem', fontWeight: '700', marginBottom: '1.4rem' }}>
            <span>☀️</span> Sri Sathya Sai Grama
          </div>

          <div style={{ background: '#ffffff', border: '1.5px solid #ede5da', borderRadius: '24px', padding: '1.6rem', textAlign: 'left', boxShadow: '0 4px 20px rgba(184, 64, 24, 0.05)' }}>
            
            {/* Mode Switch Tabs */}
            <div style={{ display: 'flex', background: '#faf6f0', padding: '4px', borderRadius: '14px', border: '1px solid #ebdccc', marginBottom: '1.2rem' }}>
              <button
                type="button"
                onClick={() => { setIsOtpMode(true); setErrorMessage(''); }}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.6rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: isOtpMode ? '#ffffff' : 'transparent',
                  color: isOtpMode ? '#b84018' : '#78716c',
                  fontWeight: isOtpMode ? '800' : '600',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: isOtpMode ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Mobile Number (OTP)
              </button>
              <button
                type="button"
                onClick={() => { setIsOtpMode(false); setErrorMessage(''); }}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.6rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: !isOtpMode ? '#ffffff' : 'transparent',
                  color: !isOtpMode ? '#b84018' : '#78716c',
                  fontWeight: !isOtpMode ? '800' : '600',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: !isOtpMode ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Email &amp; Password
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div style={{
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: '14px',
                padding: '0.75rem 0.9rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                color: '#991b1b',
                fontSize: '0.78rem',
                lineHeight: '1.35'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                <div>{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleLogin}>
              {isOtpMode ? (
                <div>
                  <label className="host-label" style={{ marginTop: 0 }}>
                    Registered Mobile Number *
                  </label>
                  <div style={{ position: 'relative', marginBottom: '0.9rem' }}>
                    <input
                      type="tel"
                      className="host-input"
                      placeholder="e.g. 9876543210"
                      value={phoneOrEmail}
                      onChange={(e) => setPhoneOrEmail(e.target.value)}
                      required
                    />
                    <Smartphone size={18} color="#a8a29e" style={{ position: 'absolute', right: '14px', top: '13px' }} />
                  </div>

                  {otpSent ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <label className="host-label" style={{ margin: 0 }}>Enter 6-Digit OTP *</label>
                        <button
                          type="button"
                          disabled={resendTimer > 0 || loading}
                          onClick={handleSendOtp}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: resendTimer > 0 ? '#a8a29e' : '#b84018',
                            fontSize: '0.74rem',
                            fontWeight: '700',
                            cursor: resendTimer > 0 ? 'default' : 'pointer',
                            padding: 0
                          }}
                        >
                          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                        </button>
                      </div>
                      <div style={{ position: 'relative', marginBottom: '1.2rem' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          autoFocus
                          className="host-input"
                          placeholder="6-digit verification code"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                        />
                        <Lock size={18} color="#a8a29e" style={{ position: 'absolute', right: '14px', top: '13px' }} />
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: '0 0 1.2rem 0', fontSize: '0.74rem', color: '#78716c', lineHeight: 1.4 }}>
                      We will send a one-time verification code to verify your Ashram Host profile.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="host-label" style={{ marginTop: 0 }}>Email or Mobile *</label>
                  <div style={{ position: 'relative', marginBottom: '0.9rem' }}>
                    <input
                      type="text"
                      className="host-input"
                      placeholder="e.g. resident@ashram.org or 9876543210"
                      value={phoneOrEmail}
                      onChange={(e) => setPhoneOrEmail(e.target.value)}
                      required
                    />
                    <Smartphone size={18} color="#a8a29e" style={{ position: 'absolute', right: '14px', top: '13px' }} />
                  </div>

                  <label className="host-label">Password *</label>
                  <div style={{ position: 'relative', marginBottom: '1.2rem' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="host-input"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#a8a29e' }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="host-btn-primary"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.92rem',
                  boxShadow: '0 4px 14px rgba(184, 64, 24, 0.28)'
                }}
              >
                {loading ? (
                  <>
                    <IonSpinner name="dots" color="light" style={{ width: '22px', height: '22px' }} />
                    <span>Verifying...</span>
                  </>
                ) : isOtpMode && !otpSent ? (
                  <>
                    <span>Request Verification OTP</span>
                    <ArrowRight size={18} />
                  </>
                ) : (
                  <>
                    <span>Sign In to Ashram Host</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid #f0e6da', textAlign: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: '#78716c' }}>
                Access restricted to Ashram Residents, Staff, and Authorized Hosts.
              </span>
            </div>
          </div>

          {/* Production Help & Support Information */}
          <div style={{ marginTop: '1.8rem', textAlign: 'center' }}>
            <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.74rem', color: '#78716c' }}>
              Gate Security Guards must use the dedicated <strong>Security Guard App</strong>.
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#a8a29e' }}>
              Sri Sathya Sai Grama Ashram Visitor Management System • Production Build v1.2.0
            </p>
          </div>
        </div>

        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          duration={3500}
          onDidDismiss={() => setToastMsg('')}
        />
      </IonContent>
    </IonPage>
  );
}
