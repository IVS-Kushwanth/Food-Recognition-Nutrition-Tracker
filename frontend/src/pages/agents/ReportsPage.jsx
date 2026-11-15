import React, { useEffect, useState } from 'react';
import { FileText, Download, Eye, RefreshCw, Layers, CheckCircle2, Bot, Calendar, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportContent, setReportContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');

  const fetchReports = async () => {
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (agentFilter) params.agent_id = agentFilter;
      const data = await api.getAgentReports(params);
      setReports(data.reports || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, [categoryFilter, agentFilter]);

  const handleViewReport = async (report) => {
    setSelectedReport(report);
    setContentLoading(true);
    try {
      const data = await api.getAgentReportContent(report.id);
      setReportContent(data.content);
    } catch (err) {
      console.error('Failed to load report content:', err);
      setReportContent('Error loading report file from disk.');
    } finally {
      setContentLoading(false);
    }
  };

  const handleDownload = (report, content) => {
    const blob = new Blob([content || ''], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = report.file_path.split('/').pop() || 'report.md';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container-xl" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>Autonomous Agent Reports & Deliverables</h2>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
            Browse and download verified technical deliverables, CPU memory hierarchy reports, and ML inference benchmarks.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchReports}
          disabled={loading}
        >
          <RefreshCw className={loading ? 'animate-spin' : ''} style={{ width: '14px', height: '14px' }} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select
            className="input-text"
            style={{ width: '180px', padding: '6px 10px', fontSize: '0.8rem' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="coa">COA Research</option>
            <option value="ai_engineer">AI Engineering</option>
            <option value="benchmarks">Benchmarks</option>
          </select>

          <select
            className="input-text"
            style={{ width: '180px', padding: '6px 10px', fontSize: '0.8rem' }}
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
          >
            <option value="">All Authors</option>
            <option value="bot_a">Bot A (COA Researcher)</option>
            <option value="bot_b">Bot B (AI Engineer)</option>
          </select>
        </div>

        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Showing <strong>{reports.length}</strong> verified deliverables on disk
        </span>
      </div>

      {/* Main Grid: Reports List & Content Viewer */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedReport ? '360px 1fr' : '1fr', gap: '20px' }}>
        {/* Reports List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading && reports.length === 0 ? (
            <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
              Loading reports from repository...
            </div>
          ) : reports.length === 0 ? (
            <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <FileText style={{ width: '40px', height: '40px', color: '#475569', margin: '0 auto 12px' }} />
              <p>No deliverables match the selected filters.</p>
            </div>
          ) : (
            reports.map((r) => {
              const isSelected = selectedReport?.id === r.id;
              const isBotA = r.agent_id === 'bot_a';

              return (
                <div
                  key={r.id}
                  onClick={() => handleViewReport(r)}
                  className="glass-panel"
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : undefined,
                    borderColor: isSelected ? '#6366f1' : undefined,
                    borderLeft: `4px solid ${isBotA ? '#8b5cf6' : '#10b981'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className={`badge ${isBotA ? 'badge-purple' : 'badge-green'}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                      {r.agent_id.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                    {r.title}
                  </h4>

                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.35, marginBottom: '8px' }}>
                    {r.summary}
                  </p>

                  <div style={{ fontSize: '0.72rem', color: '#a5b4fc', fontFamily: 'monospace' }}>
                    {r.file_path}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Report Content Viewer */}
        {selectedReport && (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                  {selectedReport.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
                  <span>Author: <strong>{selectedReport.agent_id.toUpperCase()}</strong></span>
                  <span>Category: <strong>{selectedReport.category}</strong></span>
                  <span>Path: <code>{selectedReport.file_path}</code></span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleDownload(selectedReport, reportContent)}
                  disabled={contentLoading || !reportContent}
                >
                  <Download style={{ width: '14px', height: '14px' }} />
                  <span>Download .md</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedReport(null)}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Markdown Display Box */}
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              maxHeight: '680px',
              overflowY: 'auto',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              color: '#e2e8f0',
              whiteSpace: 'pre-wrap'
            }}>
              {contentLoading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                  Reading report file from disk...
                </div>
              ) : (
                reportContent
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
