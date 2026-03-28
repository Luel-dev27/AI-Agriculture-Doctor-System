import { useState } from 'react';
import DiseaseCard from '../../components/DiseaseCard/DiseaseCard.jsx';
import Alert from '../../components/Alert/Alert.jsx';

export default function DiagnosisResultPage() {
  const [diagnosis] = useState(() => {
    const storedDiagnosis = sessionStorage.getItem('latestDiagnosis');
    return storedDiagnosis ? JSON.parse(storedDiagnosis) : null;
  });

  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Latest case</p>
          <h1>Diagnosis result</h1>
        </div>
        <p className="section-copy">Review the latest structured diagnosis and move quickly into treatment planning.</p>
      </div>
      {diagnosis ? (
        <div className="result-stack">
          <DiseaseCard {...diagnosis} />
          <div className="action-strip">
            <a href="#/history" className="secondary-link">Open case archive</a>
            <a href="#/upload-crop" className="primary-link">Analyze another crop</a>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <Alert message="No diagnosis result is available yet. Upload a crop image first." />
          <a href="#/upload-crop" className="primary-link">Go to upload</a>
        </div>
      )}
    </section>
  );
}
