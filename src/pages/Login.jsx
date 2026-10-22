import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonToast,
  IonSpinner,
  IonModal,
} from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { sendOtp, forgotPassword, resetPassword } from '../services/api';
import { Smartphone, Lock, ShieldCheck, ArrowRight, Eye, EyeOff, Building, CheckCircle2, AlertCircle, KeyRound, X, Send, Copy, Check } from 'lucide-react';
import OneWorldOneFamilyLogo from '../components/OneWorldOneFamilyLogo';

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

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotTab, setForgotTab] = useState('request'); // 'request' | 'reset'
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotResetToken, setForgotResetToken] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotResetUrl, setForgotResetUrl] = useState('');
  const [copiedForgotUrl, setCopiedForgotUrl] = useState(false);

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

  const handleRequestResetLink = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');
    setForgotResetUrl('');

    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your email, phone, or username.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await forgotPassword(forgotIdentifier.trim());
      if (res?.success) {
        setForgotMsg(res.message || 'Password reset link sent to your registered email.');
        if (res.reset_url) setForgotResetUrl(res.reset_url);
      } else {
        setForgotError(res?.message || 'Failed to send reset link.');
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetWithToken = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');

    if (!forgotResetToken.trim()) {
      setForgotError('Reset token is required.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await resetPassword(forgotResetToken.trim(), forgotNewPassword);
      if (res?.success) {
        setForgotMsg('Password reset successful! You can now log in.');
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotMsg('');
          setIsOtpMode(false);
          setPassword(forgotNewPassword);
          setToastMsg('Password changed! Ready to log in.');
        }, 1500);
      } else {
        setForgotError(res?.message || 'Failed to reset password.');
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Server error resetting password.');
    } finally {
      setForgotLoading(false);
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
          
          {/* One World One Family 360° Rotating Emblem Banner */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.95rem' }}>
            <OneWorldOneFamilyLogo size={78} showText={false} variant="hero" speed="normal" />
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
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => { setShowForgotModal(true); setForgotError(''); setForgotMsg(''); setForgotResetUrl(''); }}
                      style={{ background: 'none', border: 'none', color: '#b84018', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                    >
                      Forgot Password?
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

        {/* Forgot Password / Reset Password Modal */}
        <IonModal
          isOpen={showForgotModal}
          onDidDismiss={() => setShowForgotModal(false)}
          style={{ '--max-width': '440px', '--height': 'auto', '--border-radius': '16px' }}
        >
          <div style={{ background: '#ffffff', padding: '1.4rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1.5px solid #f0e6da', paddingBottom: '0.6rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1c1917', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <KeyRound size={20} color="#b84018" /> Password Help
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', color: '#78716c', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Sub-tab selection */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => { setForgotTab('request'); setForgotError(''); setForgotMsg(''); }}
                style={{
                  flex: 1,
                  padding: '0.45rem',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: forgotTab === 'request' ? '#b84018' : '#faf6f0',
                  color: forgotTab === 'request' ? '#ffffff' : '#78716c',
                }}
              >
                Request Reset Link
              </button>
              <button
                type="button"
                onClick={() => { setForgotTab('reset'); setForgotError(''); setForgotMsg(''); }}
                style={{
                  flex: 1,
                  padding: '0.45rem',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: forgotTab === 'reset' ? '#b84018' : '#faf6f0',
                  color: forgotTab === 'reset' ? '#ffffff' : '#78716c',
                }}
              >
                Enter Reset Token
              </button>
            </div>

            {forgotError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.55rem 0.8rem', borderRadius: '10px', fontSize: '0.78rem', marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <div>{forgotError}</div>
              </div>
            )}

            {forgotMsg && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.55rem 0.8rem', borderRadius: '10px', fontSize: '0.78rem', marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <div>{forgotMsg}</div>
              </div>
            )}

            {forgotTab === 'request' ? (
              <form onSubmit={handleRequestResetLink}>
                <p style={{ fontSize: '0.78rem', color: '#78716c', margin: '0 0 0.8rem 0', lineHeight: 1.4 }}>
                  Enter your registered Email address, Phone, or Username to receive a secure link to create a new password.
                </p>

                <label className="host-label" style={{ marginTop: 0 }}>Registered Email / Phone *</label>
                <input
                  type="text"
                  className="host-input"
                  placeholder="e.g. resident@ashram.org or 9876543210"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  required
                  style={{ marginBottom: '1rem' }}
                />

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="host-btn-primary"
                  style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: forgotLoading ? 'not-allowed' : 'pointer' }}
                >
                  <Send size={15} />
                  {forgotLoading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
                </button>

                {forgotResetUrl && (
                  <div style={{ marginTop: '0.9rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.7rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 'bold', color: '#92400e' }}>Direct Reset Link:</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(forgotResetUrl);
                          setCopiedForgotUrl(true);
                          setTimeout(() => setCopiedForgotUrl(false), 2000);
                        }}
                        style={{ background: copiedForgotUrl ? '#166534' : '#b84018', color: '#ffffff', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}
                      >
                        {copiedForgotUrl ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <a href={forgotResetUrl} style={{ fontSize: '0.74rem', color: '#b84018', wordBreak: 'break-all' }}>
                      Click to Open Reset Page
                    </a>
                  </div>
                )}
              </form>
            ) : (
              <form onSubmit={handleResetWithToken}>
                <label className="host-label" style={{ marginTop: 0 }}>Reset Token / Code *</label>
                <input
                  type="text"
                  className="host-input"
                  placeholder="Paste 64-char reset token"
                  value={forgotResetToken}
                  onChange={(e) => setForgotResetToken(e.target.value)}
                  required
                  style={{ marginBottom: '0.8rem' }}
                />

                <label className="host-label">New Password (min 6 chars) *</label>
                <input
                  type="password"
                  className="host-input"
                  placeholder="Enter new password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ marginBottom: '0.8rem' }}
                />

                <label className="host-label">Confirm New Password *</label>
                <input
                  type="password"
                  className="host-input"
                  placeholder="Confirm new password"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ marginBottom: '1.2rem' }}
                />

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="host-btn-primary"
                  style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: forgotLoading ? 'not-allowed' : 'pointer' }}
                >
                  <KeyRound size={15} />
                  {forgotLoading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            )}
          </div>
        </IonModal>

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
