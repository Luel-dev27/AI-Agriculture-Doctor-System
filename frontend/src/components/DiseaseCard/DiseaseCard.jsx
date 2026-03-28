export default function DiseaseCard({
  diseaseName,
  confidence,
  recommendation,
  summary,
  severity,
  urgency,
  suspectedConditions,
  nextSteps,
  cropName,
  imageName,
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
        {provider ? <p><span>Provider</span>{provider}</p> : null}
        {model ? <p><span>Model</span>{model}</p> : null}
        {createdAt ? <p><span>Diagnosed</span>{new Date(createdAt).toLocaleString()}</p> : null}
      </div>
      {summary ? <p className="summary-text">{summary}</p> : null}
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
    </article>
  );
}
