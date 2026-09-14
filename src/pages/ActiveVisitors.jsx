import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import { getHostRegistrations } from '../services/api';
import { Users, Calendar, Car, ChevronRight, ShieldCheck } from 'lucide-react';

export default function ActiveVisitors({ history }) {
  const [activeList, setActiveList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActive = async () => {
    try {
      const res = await getHostRegistrations();
      if (res?.registrations) {
        const active = res.registrations.filter(
          (r) => r.status === 'INSIDE_CAMPUS' || r.status === 'APPROVED'
        );
        setActiveList(active);
      }
    } catch (e) {
      console.warn('Error fetching active visitors:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActive();
  }, []);

  const handleRefresh = async (e) => {
    await fetchActive();
    e.detail.complete();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="" />
          </IonButtons>
          <IonTitle style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>Active Visitors</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#f8fafc' }}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.5rem 0 1rem 0' }}>
          Visitors currently inside campus or approved and expected to arrive today.
        </p>

        {activeList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <Users size={40} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>No active visitors currently</p>
            <span style={{ fontSize: '0.78rem' }}>When your invited visitors are approved or enter the gate, they will appear here.</span>
          </div>
        ) : (
          activeList.map((r) => (
            <div
              key={r.id}
              className="host-action-card"
              onClick={() => history.push(`/visitor-details/${r.pass_code || r.id}`)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {r.visitor_name ? r.visitor_name.charAt(0).toUpperCase() : 'V'}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>{r.visitor_name}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.visitor_phone}</span>
                  </div>
                </div>
                <span className="host-badge" style={{ background: r.status === 'INSIDE_CAMPUS' ? '#e0e7ff' : '#dcfce7', color: r.status === 'INSIDE_CAMPUS' ? '#3730a3' : '#15803d' }}>
                  {r.status === 'INSIDE_CAMPUS' ? '🏢 Inside' : '✓ Approved'}
                </span>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: '1.4' }}>
                <div><strong>Purpose:</strong> {r.purpose || 'Ashram Visit'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                  <Calendar size={13} color="#64748b" />
                  <span>Valid until: {formatDate(r.valid_until)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </IonContent>
    </IonPage>
  );
}
