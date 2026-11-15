import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';

const SAMPLE_PRESETS = [
  'Chicken Biryani',
  'Dosa',
  'Idli',
  'Paneer Tikka',
  'Dal Makhani',
  'Samosa',
  'Pizza',
  'Caesar Salad'
];

export default function ImageUploader({ onAnalyze, loading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [foodName, setFoodName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    setErrorMsg('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image file size exceeds the 10 MB limit.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select or drop a food image to analyze.');
      return;
    }
    onAnalyze(selectedFile, foodName);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>Food Image & Name Input</h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Upload your plate photograph and enter the dish name for AI recognition & text-matching.
            </p>
          </div>
          <span className="badge badge-blue">MobileNetV3-Small</span>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !previewUrl && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#6366f1' : previewUrl ? '#334155' : '#475569'}`,
            borderRadius: '14px',
            padding: previewUrl ? '16px' : '40px 20px',
            textAlign: 'center',
            cursor: previewUrl ? 'default' : 'pointer',
            backgroundColor: dragOver ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.5)',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/bmp"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {previewUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', maxWidth: '320px', maxHeight: '240px', overflow: 'hidden', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img
                  src={previewUrl}
                  alt="Food plate preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleClear(); }}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Remove image"
                >
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#94a3b8' }}>
                <ImageIcon style={{ width: '16px', height: '16px', color: '#6366f1' }} />
                <span>{selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(1)} KB)</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8'
              }}>
                <Upload style={{ width: '26px', height: '26px' }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, color: '#f1f5f9' }}>Click to browse or drag and drop food image</p>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>PNG, JPG, WebP up to 10MB</p>
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#f87171', fontSize: '0.85rem' }}>
            <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Text Input for Food Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#cbd5e1' }}>
            Food Name Entered by User:
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="input-text"
              placeholder="e.g., Chicken Biryani, Dosa, Idli, Dal Makhani..."
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
            />
            {foodName && (
              <button
                type="button"
                onClick={() => setFoodName('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            )}
          </div>
          {/* Quick preset chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Quick Presets:</span>
            {SAMPLE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setFoodName(preset)}
                style={{
                  background: foodName.toLowerCase() === preset.toLowerCase() ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${foodName.toLowerCase() === preset.toLowerCase() ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                  color: foodName.toLowerCase() === preset.toLowerCase() ? '#a5b4fc' : '#94a3b8',
                  borderRadius: '16px',
                  padding: '3px 10px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !selectedFile}
          style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
        >
          {loading ? (
            <>
              <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%' }} />
              <span>Running Inference & Memory Telemetry...</span>
            </>
          ) : (
            <>
              <Sparkles style={{ width: '18px', height: '18px' }} />
              <span>Analyze Food & Retrieve Nutrition</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
