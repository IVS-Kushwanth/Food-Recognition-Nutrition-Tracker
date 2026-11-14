import React, { useEffect, useState } from 'react';
import { Zap, Activity, FileText, CheckCircle2, Clock, Send, Play, RefreshCw, MessageSquare, ArrowRight, Layers, Eye, ShieldCheck, Terminal } from 'lucide-react';
import { api } from '../../services/api';

const AI_TASK_PRESETS = [
  {
    title: 'Measure food image recognition inference time',
    desc: 'Run real PyTorch MobileNetV3 inference on held-out test data and capture high-resolution latency statistics (min, mean, p95).'
  },
  {
    title: 'Verify codebase stability and test suite',
    desc: 'Execute complete pytest automated test suite across all API, LRU cache, text matching, and nutrition modules.'
  },
  {
    title: 'Profile CPU and RAM during model inference',
    desc: 'Measure exact process memory RSS (MB) and CPU core utilization during forward pass execution.'
  }
];

export default function BotBPage({ onNavigateTab }) {
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState([]);
  const [messages, setMessages] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [priority, setPriority] = useState('high');

  const fetchBotBData = async () => {
    try {
      const taskRes = await api.getAgentTasks({ assigned_to: 'bot_b', limit: 20 });
      setTasks(taskRes.tasks || []);

      const reportRes = await api.getAgentReports({ agent_id: 'bot_b', limit: 20 });
      setReports(reportRes.reports || []);

      const msgRes = await api.getAgentMessages({ recipient: 'bot_b', limit: 20 });
      setMessages(msgRes.messages || []);

      const mRes = await api.getLiveMetrics();
      setMetrics(mRes);
    } catch (err) {
      console.error('Error fetching Bot B data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBotBData();
    const interval = setInterval(fetchBotBData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDesc.trim()) return;
    setSubmitting(true);
    try {
      await api.createAgentTask({
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        assigned_to: 'bot_b',
        priority,
        auto_start: true,
      });
      setTaskTitle('');
      setTaskDesc('');
      await fetchBotBData();
    } catch (err) {
      console.error('Failed to create task for Bot B:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const cpu = metrics?.cpu || {};
  const mem = metrics?.memory || {};
  const accel = metrics?.accelerator || {};

  return (
    <div className="container-xl" style={{ paddingBottom: '60px' }}>
      {/* Bot Header Card */}
      <div className="glass-panel" style={{ padding: '28px', borderLeft: '6px solid #10b981', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <Zap style={{ width: '32px', height: '32px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>Bot B – AI Engineer</h1>
                <span className="badge badge-green">Autonomous Implementation Agent</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', marginTop: '4px' }}>
                Machine Learning & Software Implementation Specialist
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={fetchBotBData} disabled={loading}>
              <RefreshCw className={loading ? 'animate-spin' : ''} style={{ width: '14px', height: '14px' }} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Live Gauges Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '20px' }}>
          <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>CPU Load</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#60a5fa', fontFamily: 'monospace' }}>
              {cpu.utilization_percent ?? 0}%
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{cpu.torch_intraop_threads ?? 0} PyTorch Threads</span>
          </div>

          <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Process Memory</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399', fontFamily: 'monospace' }}>
              {mem.process_rss_mb ?? 0} MB
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Resident Model: 5.88 MB</span>
          </div>

          <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Accelerator Audit</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: accel.cuda_available ? '#34d399' : '#fbbf24', fontFamily: 'monospace' }}>
              {accel.cuda_available ? 'CUDA Active' : 'CPU Only'}
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{accel.device_name}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left Column: Task Creator & Task History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Create Task Form */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '14px' }}>
              Assign New AI Engineering Task
            </h3>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Engineering Task Title
                </label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="e.g., Measure food image recognition inference time"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Detailed Scope / Requirements
                </label>
                <textarea
                  className="input-text"
                  rows="3"
                  placeholder="Describe test cases, benchmarking runs, or debugging instructions..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Priority
                  </label>
                  <select
                    className="input-text"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div style={{ alignSelf: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    <Play className={submitting ? 'animate-spin' : ''} style={{ width: '15px', height: '15px' }} />
                    <span>Dispatch to Bot B</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Presets */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>Quick Presets:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                {AI_TASK_PRESETS.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => { setTaskTitle(preset.title); setTaskDesc(preset.desc); }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: '#cbd5e1',
                      textAlign: 'left',
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    + {preset.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bot B Task History */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '14px' }}>
              Bot B Task History
            </h3>

            {tasks.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>No tasks assigned to Bot B yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.88rem' }}>{t.title}</span>
                      <span className={`badge ${t.status === 'completed' ? 'badge-green' : t.status === 'failed' ? 'badge-red' : 'badge-amber'}`}>
                        {t.status}
                      </span>
                    </div>
                    {t.result_summary && (
                      <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px' }}>{t.result_summary}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Engineering Deliverables & Messages from Bot A */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Deliverables List */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText style={{ width: '18px', height: '18px', color: '#34d399' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Generated Engineering Reports</h3>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab && onNavigateTab('reports')}>
                <span>Reports Explorer</span>
              </button>
            </div>

            {reports.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>No reports generated yet. Run an inference or test task.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {reports.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>{r.title}</h4>
                      <span style={{ fontSize: '0.74rem', color: '#a5b4fc', fontFamily: 'monospace' }}>{r.file_path}</span>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onNavigateTab && onNavigateTab('reports')}
                    >
                      <Eye style={{ width: '14px', height: '14px' }} />
                      <span>View</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages from Bot A */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <MessageSquare style={{ width: '18px', height: '18px', color: '#c084fc' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Requests Received from Bot A</h3>
            </div>

            {messages.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>No messages received from Bot A yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.slice(-5).map((m) => (
                  <div
                    key={m.id}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(139, 92, 246, 0.08)',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      fontSize: '0.82rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c084fc', fontWeight: 700, marginBottom: '4px' }}>
                      <span>From: BOT A (COA RESEARCHER)</span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{new Date(m.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p style={{ color: '#e2e8f0', whiteSpace: 'pre-line' }}>{m.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
