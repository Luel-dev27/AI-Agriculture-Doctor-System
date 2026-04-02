export default function DiseaseCard({
  diseaseName,
  confidence,
  recommendation,
  summary,
  medicineName,
  applicationRate,
  preventionPlan,
  severity,
  urgency,
  suspectedConditions,
  nextSteps,
  knowledgeMatches,
  cropName,
  imageUrl,
  imageName,
  fieldNotes,
  advisorySource,
  reviewStatus,
  reviewedByName,
  reviewNotes,
  reviewedAt,
  createdAt,
  provider,
  model,
}) {
  const severityClass = severity ? `severity-${severity}` : '';

  return (
    <article className={`card diagnosis-card ${severityClass}`.trim()}>
      <div className="card-topline">
        <div>
          <p className="eyebrow">Diagnosis</p>
          <h2>{diseaseName}</h2>
        </div>
        {severity ? <span className={`severity-pill ${severityClass}`}>{severity}</span> : null}
      </div>
      <div className="meta-grid">
        {cropName ? <p><span>Crop</span>{cropName}</p> : null}
        {imageName ? <p><span>Image</span>{imageName}</p> : null}
        <p><span>Confidence</span>{confidence}%</p>
        {urgency ? <p><span>Urgency</span>{urgency}</p> : null}
        {reviewStatus ? <p><span>Review</span>{reviewStatus}</p> : null}
        {provider ? <p><span>Provider</span>{provider}</p> : null}
        {model ? <p><span>Model</span>{model}</p> : null}
        {advisorySource ? <p><span>Advisory source</span>{advisorySource}</p> : null}
        {createdAt ? <p><span>Diagnosed</span>{new Date(createdAt).toLocaleString()}</p> : null}
      </div>
      {imageUrl ? (
        <div className="preview-stage">
          <img
            src={imageUrl}
            alt={imageName || `${cropName || 'Crop'} diagnosis`}
            className="preview-image"
          />
        </div>
      ) : null}
      {summary ? <p className="summary-text">{summary}</p> : null}
      {fieldNotes ? (
        <div className="insight-block">
          <p className="eyebrow">Field notes</p>
          <p className="summary-text">{fieldNotes}</p>
        </div>
      ) : null}
      <div className="recommendation-block medicine-panel">
        <p className="eyebrow">Suggested medicine</p>
        <p>{medicineName}</p>
        {applicationRate ? <p className="summary-text">{applicationRate}</p> : null}
      </div>
      {suspectedConditions?.length ? (
        <div className="insight-block">
          <p className="eyebrow">Suspected conditions</p>
          <div className="tag-list">
            {suspectedConditions.map((item) => (
              <span key={item} className="info-tag">{item}</span>
            ))}
          </div>
        </div>
      ) : null}
      <div className="recommendation-block">
        <p className="eyebrow">Recommendation</p>
        <p>{recommendation}</p>
      </div>
      {preventionPlan ? (
        <div className="recommendation-block">
          <p className="eyebrow">Prevention plan</p>
          <p>{preventionPlan}</p>
        </div>
      ) : null}
      {knowledgeMatches?.length ? (
        <div className="insight-block">
          <p className="eyebrow">Knowledge matches</p>
          <div className="tag-list">
            {knowledgeMatches.map((item) => (
              <span key={item} className="info-tag">{item}</span>
            ))}
          </div>
        </div>
      ) : null}
      {nextSteps?.length ? (
        <div className="insight-block">
          <p className="eyebrow">Next steps</p>
          <ul className="step-list">
            {nextSteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {reviewedByName || reviewNotes || reviewedAt ? (
        <div className="insight-block">
          <p className="eyebrow">Learning feedback</p>
          {reviewedByName ? <p className="summary-text">Reviewed by {reviewedByName}</p> : null}
          {reviewedAt ? <p className="summary-text">{new Date(reviewedAt).toLocaleString()}</p> : null}
          {reviewNotes ? <p className="summary-text">{reviewNotes}</p> : null}
        </div>
      ) : null}
    </article>
  );
}
