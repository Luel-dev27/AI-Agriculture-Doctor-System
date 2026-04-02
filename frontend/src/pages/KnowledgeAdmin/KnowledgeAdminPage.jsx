import { useEffect, useState } from 'react';
import Alert from '../../components/Alert/Alert.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import {
  getKnowledgeEntries,
  upsertKnowledgeEntry,
} from '../../services/knowledgeService.js';

const initialForm = {
  cropName: '',
  diseaseName: '',
  aliases: '',
  symptomKeywords: '',
  medicineName: '',
  applicationRate: '',
  treatmentPlan: '',
  preventionPlan: '',
  severity: 'medium',
  notes: '',
};

export default function KnowledgeAdminPage({ authState }) {
  const [entries, setEntries] = useState([]);
  const [cropFilter, setCropFilter] = useState('');
  const [formState, setFormState] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const canManage = authState?.user?.role === 'admin';

  useEffect(() => {
    let isActive = true;

    async function loadEntries() {
      try {
        const data = await getKnowledgeEntries(cropFilter);
        if (isActive) {
          setEntries(data);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error.message || 'Failed to load knowledge entries.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadEntries();

    return () => {
      isActive = false;
    };
  }, [cropFilter]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canManage) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const entry = await upsertKnowledgeEntry(formState);
      setEntries((current) => {
        const existingIndex = current.findIndex((item) => item.id === entry.id);

        if (existingIndex === -1) {
          return [entry, ...current];
        }

        const copy = [...current];
        copy[existingIndex] = entry;
        return copy;
      });
      setFormState(initialForm);
      setSuccessMessage('Knowledge entry saved.');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save knowledge entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authState?.accessToken) {
    return (
      <section className="page">
        <div className="empty-state">
          <Alert message="Sign in to view the knowledge base." />
          <a href="#/login" className="primary-link">Go to login</a>
        </div>
      </section>
    );
  }

  if (!canManage) {
    return (
      <section className="page">
        <div className="empty-state">
          <Alert message="Only admins can manage the crop knowledge base." />
          <a href="#/dashboard" className="secondary-link">Back to dashboard</a>
        </div>
      </section>
    );
  }

  return (
    <section className="page knowledge-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Knowledge base</p>
          <h1>Crop disease and medicine rules</h1>
        </div>
        <p className="section-copy">
          Add curated diseases, medicines, symptom terms, and prevention guidance that the AI should follow.
        </p>
      </div>

      <div className="knowledge-layout">
        <form className="card knowledge-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Crop name</span>
            <input name="cropName" value={formState.cropName} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>Disease name</span>
            <input name="diseaseName" value={formState.diseaseName} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>Aliases</span>
            <input
              name="aliases"
              value={formState.aliases}
              onChange={handleChange}
              placeholder="comma, separated, aliases"
              required
            />
          </label>
          <label className="field">
            <span>Symptom keywords</span>
            <input
              name="symptomKeywords"
              value={formState.symptomKeywords}
              onChange={handleChange}
              placeholder="rust, yellow spots, powder"
              required
            />
          </label>
          <label className="field">
            <span>Medicine</span>
            <input name="medicineName" value={formState.medicineName} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>Application rate</span>
            <input name="applicationRate" value={formState.applicationRate} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>Treatment plan</span>
            <textarea name="treatmentPlan" value={formState.treatmentPlan} onChange={handleChange} rows={4} required />
          </label>
          <label className="field">
            <span>Prevention plan</span>
            <textarea name="preventionPlan" value={formState.preventionPlan} onChange={handleChange} rows={4} required />
          </label>
          <label className="field">
            <span>Severity</span>
            <select name="severity" value={formState.severity} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="field">
            <span>Notes</span>
            <textarea name="notes" value={formState.notes} onChange={handleChange} rows={4} required />
          </label>
          {errorMessage ? <Alert message={errorMessage} /> : null}
          {successMessage ? <div className="success-note">{successMessage}</div> : null}
          <button type="submit" className="primary-link form-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving entry...' : 'Save knowledge entry'}
          </button>
        </form>

        <section className="stack">
          <div className="card filter-card">
            <label className="field">
              <span>Filter by crop</span>
              <input
                value={cropFilter}
                onChange={(event) => setCropFilter(event.target.value)}
                placeholder="e.g. Tomato"
              />
            </label>
          </div>
          {isLoading ? <Loader /> : null}
          {!isLoading && entries.length === 0 ? (
            <div className="card empty-state">
              <p>No knowledge entries found for this filter.</p>
            </div>
          ) : null}
          <div className="stack stagger-stack">
            {entries.map((entry) => (
              <article key={entry.id} className="card knowledge-card">
                <div className="card-topline">
                  <div>
                    <p className="eyebrow">{entry.cropName}</p>
                    <h2>{entry.diseaseName}</h2>
                  </div>
                  <span className={`severity-pill severity-${entry.severity}`}>{entry.severity}</span>
                </div>
                <div className="meta-grid">
                  <p><span>Medicine</span>{entry.medicineName}</p>
                  <p><span>Application</span>{entry.applicationRate}</p>
                </div>
                <div className="insight-block">
                  <p className="eyebrow">Aliases</p>
                  <div className="tag-list">
                    {entry.aliases.map((item) => (
                      <span key={item} className="info-tag">{item}</span>
                    ))}
                  </div>
                </div>
                <div className="insight-block">
                  <p className="eyebrow">Symptoms</p>
                  <div className="tag-list">
                    {entry.symptomKeywords.map((item) => (
                      <span key={item} className="info-tag">{item}</span>
                    ))}
                  </div>
                </div>
                <div className="recommendation-block">
                  <p className="eyebrow">Treatment plan</p>
                  <p>{entry.treatmentPlan}</p>
                </div>
                <div className="recommendation-block">
                  <p className="eyebrow">Prevention plan</p>
                  <p>{entry.preventionPlan}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
