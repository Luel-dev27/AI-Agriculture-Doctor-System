export default function ImageUploader({ file, onSelect, onSubmit, isSubmitting }) {
  const handleChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (onSelect) {
      onSelect(file);
    }
  };

  return (
    <div className="uploader">
      <label className="file-picker">
        <span>Leaf or crop image</span>
        <input type="file" accept="image/*" onChange={handleChange} />
      </label>
      <button type="button" onClick={onSubmit} disabled={!file || isSubmitting}>
        {isSubmitting ? 'Analyzing...' : 'Upload & Diagnose'}
      </button>
    </div>
  );
}
