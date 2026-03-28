import { useEffect, useState } from 'react';
import Alert from '../../components/Alert/Alert.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import { getAiStatus } from '../../services/aiService.js';
import { getDiagnosisHistory } from '../../services/diagnosisService.js';

export default function DashboardPage({ authState }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      try {
        const [data, status] = await Promise.all([getDiagnosisHistory(), getAiStatus()]);
        if (isActive) {
          setHistoryItems(data);
          setAiStatus(status);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error.message || 'Failed to load dashboard data.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isActive = false;
    };
  }, []);

  const totalDiagnoses = historyItems.length;
  const highSeverityCases = historyItems.filter((item) => item.severity === 'high').length;
  const averageConfidence = totalDiagnoses
    ? Math.round(historyItems.reduce((sum, item) => sum + item.confidence, 0) / totalDiagnoses)
    : 0;
  const openAiCases = historyItems.filter((item) => item.provider === 'openai').length;
  const lowSeverityCases = historyItems.filter((item) => item.severity === 'low').length;
  const mediumSeverityCases = historyItems.filter((item) => item.severity === 'medium').length;
  const recentCases = historyItems.slice(0, 3);
  const severityBreakdown = [
    { label: 'Low', value: lowSeverityCases, className: 'severity-low' },
    { label: 'Medium', value: mediumSeverityCases, className: 'severity-medium' },
    { label: 'High', value: highSeverityCases, className: 'severity-high' },
  ];

  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Operations overview</p>
          <h1>Field dashboard</h1>
        </div>
        <p className="section-copy">Monitor throughput, severity signals, and model usage from a single control surface.</p>
      </div>
      {authState?.user ? (
        <div className="history-summary">
          <article className="summary-chip">
            <span>Operator</span>
            <strong>{authState.user.name}</strong>
          </article>
          <article className="summary-chip">
            <span>Email</span>
            <strong>{authState.user.email}</strong>
          </article>
          <article className="summary-chip">
            <span>Role</span>
            <strong>{authState.user.role}</strong>
          </article>
        </div>
      ) : null}
      {isLoading ? <Loader /> : null}
      {errorMessage ? <Alert message={errorMessage} /> : null}
      {!isLoading && !errorMessage ? (
        <div className="stats-grid dashboard-grid">
          <article className="card metric-card">
            <h2>{totalDiagnoses}</h2>
            <p>Total diagnoses</p>
          </article>
          <article className="card metric-card">
            <h2>{highSeverityCases}</h2>
            <p>High severity cases</p>
          </article>
          <article className="card metric-card">
            <h2>{averageConfidence}%</h2>
            <p>Average confidence</p>
          </article>
          <article className="card metric-card">
            <h2>{openAiCases}</h2>
            <p>OpenAI-backed diagnoses</p>
          </article>
          <article className="card metric-card">
            <h2>{aiStatus?.configured ? 'Live' : 'Standby'}</h2>
            <p>AI provider status</p>
          </article>
          <article className="card dashboard-callout">
            <p className="eyebrow">Operational pulse</p>
            <h2>{highSeverityCases > 0 ? 'Escalation recommended' : 'Stable queue'}</h2>
            <p>
              {highSeverityCases > 0
                ? 'High-severity cases are present in the diagnosis archive. Review them first to reduce disease spread risk.'
                : 'No high-severity cases are currently recorded. Keep capturing new crop images to maintain coverage.'}
            </p>
            {aiStatus ? (
              <p>
                Current provider: {aiStatus.provider} using model {aiStatus.model}.
              </p>
            ) : null}
          </article>
          <article className="card severity-panel">
            <p className="eyebrow">Severity mix</p>
            <h2>Current case distribution</h2>
            <div className="severity-bars">
              {severityBreakdown.map((item) => {
                const width = totalDiagnoses ? `${Math.max(8, Math.round((item.value / totalDiagnoses) * 100))}%` : '8%';

                return (
                  <div key={item.label} className="severity-row">
                    <div className="severity-row-label">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <div className="severity-track">
                      <div className={`severity-fill ${item.className}`} style={{ width }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
          <article className="card recent-panel">
            <p className="eyebrow">Recent activity</p>
            <h2>Latest diagnoses</h2>
            {recentCases.length > 0 ? (
              <div className="recent-list">
                {recentCases.map((item) => (
                  <div key={item.id} className="recent-row">
                    <div>
                      <strong>{item.cropName}</strong>
                      <span>{item.diseaseName}</span>
                    </div>
                    <span className={`severity-pill ${item.severity ? `severity-${item.severity}` : ''}`.trim()}>
                      {item.severity || 'unknown'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="section-copy">No recent diagnoses yet.</p>
            )}
          </article>
        </div>
      ) : null}
    </section>
  );
}
