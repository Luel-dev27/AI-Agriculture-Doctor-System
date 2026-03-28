import { useEffect, useState } from 'react';
import ImageUploader from '../../components/ImageUploader/ImageUploader.jsx';
import Alert from '../../components/Alert/Alert.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import { diagnoseCropImage } from '../../services/diagnosisService.js';
import { getCrops } from '../../services/cropsService.js';

export default function UploadCropPage() {
  const [cropName, setCropName] = useState('');
  const [crops, setCrops] = useState([]);
  const [isLoadingCrops, setIsLoadingCrops] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadCrops() {
      try {
        const data = await getCrops();
        if (isActive) {
          setCrops(data);
          setCropName(data[0]?.name || '');
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error.message || 'Failed to load crops.');
        }
      } finally {
        if (isActive) {
          setIsLoadingCrops(false);
        }
      }
    }

    void loadCrops();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const handleSubmit = async () => {
    if (!selectedFile) {
      setErrorMessage('Please choose an image before starting diagnosis.');
      return;
    }

    if (!cropName.trim()) {
      setErrorMessage('Please choose a crop before starting diagnosis.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const diagnosis = await diagnoseCropImage({
        cropName: cropName.trim() || 'Unknown crop',
        file: selectedFile,
      });

      sessionStorage.setItem('latestDiagnosis', JSON.stringify(diagnosis));
      window.location.hash = '#/diagnosis-result';
    } catch (error) {
      setErrorMessage(error.message || 'Diagnosis request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page upload-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Diagnosis intake</p>
          <h1>Upload a crop image</h1>
        </div>
        <p className="section-copy">
          Choose the crop, attach a clear field image, and send it into the current AI-ready diagnosis pipeline.
        </p>
      </div>

      <div className="upload-layout">
        <div className="upload-form-card">
          <label className="field">
            <span>Crop name</span>
            {crops.length > 0 ? (
              <select
                value={cropName}
                onChange={(event) => setCropName(event.target.value)}
                disabled={isLoadingCrops}
              >
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.name}>
                    {crop.name}
                    {crop.variety ? ` (${crop.variety})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={cropName}
                onChange={(event) => setCropName(event.target.value)}
                placeholder="e.g. Tomato, Maize, Wheat"
                disabled={isLoadingCrops}
              />
            )}
          </label>
          {isLoadingCrops ? <Loader /> : null}
          <ImageUploader
            file={selectedFile}
            onSelect={setSelectedFile}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
          {selectedFile ? (
            <div className="selected-file">
              <p className="eyebrow">Selected image</p>
              <strong>{selectedFile.name}</strong>
              <span>{Math.max(1, Math.round(selectedFile.size / 1024))} KB</span>
            </div>
          ) : null}
          {isSubmitting ? <Loader /> : null}
          {errorMessage ? <Alert message={errorMessage} /> : null}
        </div>

        <aside className="info-panel">
          <p className="eyebrow">Best results</p>
          <h2>Capture clear leaf detail.</h2>
          <ul className="info-list">
            <li>Use bright natural light instead of deep shade.</li>
            <li>Frame the damaged area close enough to show texture and spread.</li>
            <li>Avoid blurry motion and heavily compressed screenshots.</li>
          </ul>
          <div className="mini-stat">
            <span>Supported flow</span>
            <strong>Crop selection + image diagnosis + saved history</strong>
          </div>
          <div className="preview-stage">
            {previewUrl ? (
              <img src={previewUrl} alt="Selected crop preview" className="preview-image" />
            ) : (
              <div className="preview-placeholder">
                <p className="eyebrow">Preview</p>
                <strong>Your uploaded crop image will appear here.</strong>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
