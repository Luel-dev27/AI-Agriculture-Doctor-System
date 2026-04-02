import { useEffect, useState } from 'react';
import Alert from '../Alert/Alert.jsx';
import { reviewDiagnosis } from '../../services/diagnosisService.js';

const defaultFormState = {
  resolution: 'confirmed',
  confirmedDiseaseName: '',
  medicineName: '',
  applicationRate: '',
  notes: '',
};

export default function DiagnosisReviewForm({ diagnosis, onReviewed }) {
  const [formState, setFormState] = useState({
    ...defaultFormState,
    confirmedDiseaseName: diagnosis.diseaseName || '',
    medicineName: diagnosis.medicineName || '',
    applicationRate: diagnosis.applicationRate || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setFormState({
      ...defaultFormState,
      confirmedDiseaseName: diagnosis.diseaseName || '',
      medicineName: diagnosis.medicineName || '',
      applicationRate: diagnosis.applicationRate || '',
    });
  }, [diagnosis.applicationRate, diagnosis.diseaseName, diagnosis.medicineName]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const updated = await reviewDiagnosis(diagnosis.id, formState);

      setFormState((current) => ({
        ...current,
        notes: '',
      }));
      onReviewed?.(updated);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="card review-form" onSubmit={handleSubmit}>
      <div className="card-topline">
        <div>
          <p className="eyebrow">Expert feedback</p>
          <h2>Teach the diagnosis system</h2>
        </div>
      </div>
      <label className="field">
        <span>Resolution</span>
        <select name="resolution" value={formState.resolution} onChange={handleChange}>
          <option value="confirmed">Confirmed</option>
          <option value="corrected">Corrected</option>
          <option value="escalated">Escalated</option>
        </select>
      </label>
      <label className="field">
        <span>Confirmed disease</span>
        <input
          name="confirmedDiseaseName"
          value={formState.confirmedDiseaseName}
          onChange={handleChange}
          placeholder="e.g. Coffee leaf rust"
        />
      </label>
      <label className="field">
        <span>Medicine</span>
        <input
          name="medicineName"
          value={formState.medicineName}
          onChange={handleChange}
          placeholder="e.g. Copper hydroxide"
        />
      </label>
      <label className="field">
        <span>Application guidance</span>
        <input
          name="applicationRate"
          value={formState.applicationRate}
          onChange={handleChange}
          placeholder="e.g. Use approved local label rate"
        />
      </label>
      <label className="field">
        <span>Review notes</span>
        <textarea
          name="notes"
          value={formState.notes}
          onChange={handleChange}
          placeholder="Add what was confirmed, corrected, or why escalation is needed."
          rows={4}
          required
        />
      </label>
      {errorMessage ? <Alert message={errorMessage} /> : null}
      <button type="submit" className="primary-link form-submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving review...' : 'Save review'}
      </button>
    </form>
  );
}
