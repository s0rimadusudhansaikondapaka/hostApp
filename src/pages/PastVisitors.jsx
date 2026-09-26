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
import { getVisitHistory, getHostRegistrations } from '../services/api';
import { History, Calendar, CheckCircle2 } from 'lucide-react';

export default function PastVisitors({ history }) {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await getVisitHistory();
      if (res?.history && res.history.length > 0) {
        setHistoryList(res.history);
      } else {
        // Fallback to checked-out or older registrations
        const hostRes = await getHostRegistrations();
        if (hostRes?.registrations) {
          const past = hostRes.registrations.filter((r) => r.status === 'CHECKED_OUT' || r.status === 'REJECTED');
          setHistoryList(past);
        }
      }
    } catch (e) {
      console.warn('Error fetching past visitors:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRefresh = async (e) => {
    await fetchHistory();
    e.detail.complete();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#faf6f0', borderBottom: '1px solid #ebdccc' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="" color="dark" />
          </IonButtons>
          <IonTitle style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>Past Visitors</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ '--background': '#faf6f0' }}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Section Header matching Attachment 1 */}
        <div className="host-section-header" style={{ marginTop: '0.2rem', marginBottom: '0.9rem' }}>
          <div className="host-section-title-wrap">
            <h3 className="host-section-title">Visit Archives</h3>
            <div className="host-section-underline"></div>
          </div>
          <div className="host-section-count">
            {historyList.length} Archived
          </div>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#78716c', margin: '0 0 1rem 0', fontWeight: '500' }}>
          Archived records of completed or past visits to your flat or department.
        </p>

        {historyList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#ffffff', borderRadius: '22px', border: '1.5px dashed #ebdccc', color: '#78716c' }}>
            <History size={36} color="#d6c7b2" style={{ marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#1c1917' }}>No past visitor records</p>
            <span style={{ fontSize: '0.78rem', color: '#78716c' }}>When visitors complete their visit and check out, their history will appear here.</span>
          </div>
        ) : (
          historyList.map((r, i) => (
            <div
              key={r.id || i}
              className="host-visitor-card"
              style={{ marginBottom: '0.85rem' }}
            >
              <div className="host-visitor-card-header">
                <span style={{ 
                  background: '#ffffff', 
                  border: '1px solid #dbeafe', 
                  color: '#1e40af', 
                  borderRadius: '9999px', 
                  padding: '2px 9px', 
                  fontSize: '0.7rem', 
                  fontWeight: '700' 
                }}>
                  👤 {r.visitor_category || 'General Visitor'}
                </span>
                <span style={{ 
                  background: '#f5eee6', 
                  color: '#78716c', 
                  borderRadius: '9999px', 
                  padding: '2px 9px', 
                  fontSize: '0.7rem', 
                  fontWeight: '700' 
                }}>
                  {r.status || 'CHECKED_OUT'}
                </span>
              </div>
              <div className="host-visitor-card-body">
                <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.05rem', fontWeight: '800', color: '#1c1917' }}>
                  {r.visitor_name}
                </h3>
                <p style={{ margin: 0, fontSize: '0.76rem', color: '#78716c' }}>
                  {r.visitor_phone} • {r.purpose || 'Ashram Visit'}
                </p>
                <div style={{ 
                  borderTop: '1px solid #f5eee6', 
                  marginTop: '0.65rem', 
                  paddingTop: '0.55rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.35rem', 
                  fontSize: '0.74rem', 
                  color: '#57534e' 
                }}>
                  <Calendar size={13} color="#b84018" />
                  <span>Visited on: {formatDate(r.valid_from || r.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </IonContent>
    </IonPage>
  );
}

