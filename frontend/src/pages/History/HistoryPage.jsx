import { useEffect, useState } from 'react';
import DiseaseCard from '../../components/DiseaseCard/DiseaseCard.jsx';
import DiagnosisReviewForm from '../../components/DiagnosisReviewForm/DiagnosisReviewForm.jsx';
import Alert from '../../components/Alert/Alert.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import { getDiagnosisHistory } from '../../services/diagnosisService.js';

export default function HistoryPage({ authState }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadHistory() {
      try {
        const data = await getDiagnosisHistory();
        if (isActive) {
          setHistoryItems(data);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error.message || 'Failed to load history.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      isActive = false;
    };
  }, []);

  const highSeverityCases = historyItems.filter((item) => item.severity === 'high').length;
  const latestCase = historyItems[0];
  const reviewedCases = historyItems.filter((item) => item.reviewStatus === 'reviewed').length;
  const canReview =
    authState?.user?.role === 'agronomist' || authState?.user?.role === 'admin';

  const handleReviewed = (updatedDiagnosis) => {
    setHistoryItems((current) =>
      current.map((item) => (item.id === updatedDiagnosis.id ? updatedDiagnosis : item)),
    );
  };

  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Case archive</p>
          <h1>Diagnosis history</h1>
        </div>
        <p className="section-copy">Track how crop cases have been classified over time and review previous recommendations.</p>
      </div>
      {authState?.user ? (
        <div className="history-summary">
          <article className="summary-chip">
            <span>Signed in as</span>
            <strong>{authState.user.name}</strong>
          </article>
          <article className="summary-chip">
            <span>Account</span>
            <strong>{authState.user.email}</strong>
          </article>
        </div>
      ) : null}
      {!isLoading && !errorMessage && historyItems.length > 0 ? (
        <div className="history-summary">
          <article className="summary-chip">
            <span>Total cases</span>
            <strong>{historyItems.length}</strong>
          </article>
          <article className="summary-chip">
            <span>High severity</span>
            <strong>{highSeverityCases}</strong>
          </article>
          <article className="summary-chip">
            <span>Reviewed</span>
            <strong>{reviewedCases}</strong>
          </article>
          <article className="summary-chip">
            <span>Latest crop</span>
            <strong>{latestCase?.cropName || 'Unknown'}</strong>
          </article>
        </div>
      ) : null}
      {isLoading ? <Loader /> : null}
      {errorMessage ? <Alert message={errorMessage} /> : null}
      {!isLoading && !errorMessage && historyItems.length === 0 ? (
        <div className="empty-state">
          <p>No diagnosis records yet.</p>
          <a href="#/upload-crop" className="secondary-link">Start the first diagnosis</a>
        </div>
      ) : null}
      <div className="stack stagger-stack">
        {historyItems.map((item) => (
          <div key={item.id} className="stack">
            <DiseaseCard {...item} />
            {canReview ? (
              <DiagnosisReviewForm diagnosis={item} onReviewed={handleReviewed} />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
