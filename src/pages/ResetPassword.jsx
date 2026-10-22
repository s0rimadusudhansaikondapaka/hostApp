import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import { verifyResetToken, resetPassword } from '../services/api';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import OneWorldOneFamilyLogo from '../components/OneWorldOneFamilyLogo';

export default function ResetPassword({ history, location }) {
  const query = new URLSearchParams(location?.search || window.location.search);
  const initialToken = query.get('token') || query.get('reset_token') || '';

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(!!initialToken);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (initialToken) {
      setVerifying(true);
      verifyResetToken(initialToken)
        .then((res) => {
          if (res?.success) {
            setUserEmail(res.user?.email || '');
            setUserName(res.user?.name || '');
          } else {
            setErrorMessage(res?.message || 'Password reset link is invalid or expired.');
          }
        })
        .catch((err) => {
          setErrorMessage(err.response?.data?.message || 'Invalid or expired password reset link.');
        })
        .finally(() => setVerifying(false));
    }
  }, [initialToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token.trim()) {
      setErrorMessage('Reset token is required.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(token.trim(), newPassword);
      if (res?.success) {
        setSuccess(true);
      } else {
        setErrorMessage(res?.message || 'Failed to reset password.');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Server error resetting password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#b84018', '--color': '#ffffff' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" style={{ color: '#ffffff' }} />
          </IonButtons>
          <IonTitle style={{ fontWeight: 'bold' }}>Reset Password</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#faf6f0' }}>
        <div style={{ maxWidth: '420px', margin: '1.5rem auto', textAlign: 'center' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.8rem' }}>
            <OneWorldOneFamilyLogo size={75} showText={false} />
          </div>

          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1c1917', margin: '0 0 0.3rem 0' }}>
            Set New Password
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#78716c', margin: '0 0 1.2rem 0' }}>
            Ashram Host Portal Security
          </p>

          {userName && (
            <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.3rem 0.8rem', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 'bold', display: 'inline-block', marginBottom: '1.2rem' }}>
              Host: {userName} ({userEmail})
            </div>
          )}

          {verifying && (
            <div style={{ padding: '2rem 0', color: '#78716c' }}>
              <IonSpinner name="crescent" color="primary" />
              <p style={{ fontSize: '0.82rem', marginTop: '0.5rem' }}>Verifying reset token...</p>
            </div>
          )}

          {success ? (
            <div style={{ background: '#ffffff', borderRadius: '20px', border: '1.5px solid #ede5da', padding: '1.8rem', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              <div style={{ width: '56px', height: '56px', background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#15803d', margin: '0 0 0.4rem 0' }}>
                Password Updated!
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#78716c', margin: '0 0 1.4rem 0', lineHeight: 1.4 }}>
                Your password has been changed successfully. You can now sign in to Ashram Host.
              </p>
              <button
                type="button"
                onClick={() => history.replace('/login')}
                className="host-btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                Sign In Now <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            !verifying && (
              <div style={{ background: '#ffffff', borderRadius: '20px', border: '1.5px solid #ede5da', padding: '1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', textAlign: 'left' }}>
                <form onSubmit={handleSubmit}>
                  {errorMessage && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.65rem 0.85rem', borderRadius: '12px', fontSize: '0.78rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <div>{errorMessage}</div>
                    </div>
                  )}

                  {!initialToken && (
                    <div style={{ marginBottom: '0.9rem' }}>
                      <label className="host-label" style={{ marginTop: 0 }}>Reset Token / Code *</label>
                      <input
                        type="text"
                        className="host-input"
                        placeholder="Paste reset token from link/email"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <label className="host-label" style={{ marginTop: 0 }}>New Password (min 6 chars) *</label>
                  <div style={{ position: 'relative', marginBottom: '0.9rem' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="host-input"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#a8a29e' }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <label className="host-label">Confirm New Password *</label>
                  <div style={{ position: 'relative', marginBottom: '1.3rem' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="host-input"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="host-btn-primary"
                    style={{ width: '100%', padding: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: loading ? 'not-allowed' : 'pointer' }}
                  >
                    <KeyRound size={16} />
                    {loading ? 'Updating Password...' : 'Save New Password'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '1.2rem', paddingTop: '0.9rem', borderTop: '1px solid #f0e6da' }}>
                    <button
                      type="button"
                      onClick={() => history.replace('/login')}
                      style={{ background: 'none', border: 'none', color: '#78716c', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              </div>
            )
          )}
        </div>

        <IonToast isOpen={!!toastMsg} message={toastMsg} duration={2500} onDidDismiss={() => setToastMsg('')} />
      </IonContent>
    </IonPage>
  );
}
