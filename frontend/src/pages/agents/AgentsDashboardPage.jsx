import React, { useEffect, useState } from 'react';
import { Cpu, Bot, CheckCircle2, Clock, AlertTriangle, Play, RefreshCw, Zap, HardDrive, ArrowRight, Activity, MessageSquare, FileText } from 'lucide-react';
import { api } from '../../services/api';

export default function AgentsDashboardPage({ onNavigateTab }) {
  const [overview, setOverview] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      const data = await api.getAgentsOverview();
      setOverview(data);

      const msgs = await api.getAgentMessages({ limit: 8 });
      setRecentMessages(msgs.messages || []);
    } catch (err) {
      console.error('Failed to load agents overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickDispatch = async (title, description, assignedTo) => {
    setActionLoading(true);
    try {
      await api.createAgentTask({
        title,
        description,
        assigned_to: assignedTo,
        priority: 'high',
        auto_start: true,
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to dispatch quick task:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const agents = overview?.agents || [];
  const botA = agents.find((a) => a.id === 'bot_a') || {};
  const botB = agents.find((a) => a.id === 'bot_b') || {};
  const counts = overview?.counts || {};
  const hw = overview?.system_hardware || {};
  const cpu = hw.cpu || {};
  const mem = hw.memory || {};
  const accel = hw.accelerator || {};

  return (
    <div className="container-xl" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', marginBottom: '10px' }}>
            <Bot style={{ width: '15px', height: '15px', color: '#818cf8' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Autonomous Agents Control Center
            </span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            AI Agent Command & Telemetry Hub
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: '6px' }}>
            Manage, dispatch, and monitor autonomous Bot A (COA Researcher) and Bot B (AI Engineer).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} style={{ width: '14px', height: '14px' }} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Bot Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Bot A Card */}
        <div className="glass-panel" style={{ padding: '24px', borderLeft: '5px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                <Cpu style={{ width: '24px', height: '24px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>Bot A – COA Researcher</h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Computer Organization & Architecture</p>
              </div>
            </div>
            <span className={`badge ${botA.status === 'busy' ? 'badge-amber' : 'badge-green'}`}>
              {botA.status === 'busy' ? 'Executing Task' : 'Idle / Ready'}
            </span>
          </div>

          <p style={{ fontSize: '0.84rem', color: '#cbd5e1', marginBottom: '16px', lineHeight: 1.5 }}>
            Investigates CPU registers, ALU operations, L1/L2 SRAM caches, memory hierarchy tradeoffs, and synthesizes formal research reports.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.82rem', marginBottom: '16px' }}>
            <div>Completed: <strong style={{ color: '#34d399' }}>{botA.total_tasks_completed ?? 0}</strong></div>
            <div>Failed: <strong style={{ color: '#f87171' }}>{botA.total_tasks_failed ?? 0}</strong></div>
            <div>Current: <strong style={{ color: '#818cf8' }}>{botA.current_task_id || 'None'}</strong></div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ flex: 1 }}
              onClick={() => onNavigateTab && onNavigateTab('bot_a')}
            >
              <span>Manage Bot A</span>
              <ArrowRight style={{ width: '14px', height: '14px' }} />
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={actionLoading}
              onClick={() => handleQuickDispatch(
                'Research CPU registers and ALU operations',
                'Investigate SIMD register allocation and ALU MAC vector math in MobileNetV3 inference.',
                'bot_a'
              )}
            >
              <span>+ Research Task</span>
            </button>
          </div>
        </div>

        {/* Bot B Card */}
        <div className="glass-panel" style={{ padding: '24px', borderLeft: '5px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                <Zap style={{ width: '24px', height: '24px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>Bot B – AI Engineer</h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ML & Software Implementation Specialist</p>
              </div>
            </div>
            <span className={`badge ${botB.status === 'busy' ? 'badge-amber' : 'badge-green'}`}>
              {botB.status === 'busy' ? 'Executing Task' : 'Idle / Ready'}
            </span>
          </div>

          <p style={{ fontSize: '0.84rem', color: '#cbd5e1', marginBottom: '16px', lineHeight: 1.5 }}>
            Benchmarks PyTorch model inference, profiles CPU/RAM utilization, inspects multimodal text matching, and executes test suites.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.82rem', marginBottom: '16px' }}>
            <div>Completed: <strong style={{ color: '#34d399' }}>{botB.total_tasks_completed ?? 0}</strong></div>
            <div>Failed: <strong style={{ color: '#f87171' }}>{botB.total_tasks_failed ?? 0}</strong></div>
            <div>Current: <strong style={{ color: '#818cf8' }}>{botB.current_task_id || 'None'}</strong></div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ flex: 1 }}
              onClick={() => onNavigateTab && onNavigateTab('bot_b')}
            >
              <span>Manage Bot B</span>
              <ArrowRight style={{ width: '14px', height: '14px' }} />
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={actionLoading}
              onClick={() => handleQuickDispatch(
                'Measure food image recognition inference time',
                'Run real PyTorch inference on held-out test data and capture latency distribution.',
                'bot_b'
              )}
            >
              <span>+ Inference Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Hardware Gauges & Task Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Hardware Status */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Activity style={{ width: '18px', height: '18px', color: '#6366f1' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Live Host Hardware Profiler</h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.82rem' }}>
            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase' }}>CPU Load</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60a5fa', fontFamily: 'monospace' }}>
                {cpu.utilization_percent ?? 0}%
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{cpu.physical_cores ?? 0} Cores / {cpu.logical_cores ?? 0} Threads</span>
            </div>

            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Process Memory</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', fontFamily: 'monospace' }}>
                {mem.process_rss_mb ?? 0} MB
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Avail: {mem.available_system_mb ?? 0} MB</span>
            </div>

            <div style={{ gridColumn: 'span 2', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase' }}>GPU Accelerator</span>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: accel.cuda_available ? '#34d399' : '#fbbf24', marginTop: '2px' }}>
                {accel.cuda_available ? 'CUDA Available' : 'CPU Execution Only'}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{accel.device_name || 'No CUDA device detected'}</span>
            </div>
          </div>
        </div>

        {/* Task Counter Cards */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock style={{ width: '18px', height: '18px', color: '#6366f1' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Task Management Metrics</h4>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab && onNavigateTab('tasks')}
            >
              <span>View All Tasks</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <span style={{ fontSize: '0.75rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 600 }}>Completed</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', fontFamily: 'monospace' }}>
                {counts.completed ?? 0}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
              <span style={{ fontSize: '0.75rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 600 }}>In Progress</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'monospace' }}>
                {counts.in_progress ?? 0}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
              <span style={{ fontSize: '0.75rem', color: '#60a5fa', textTransform: 'uppercase', fontWeight: 600 }}>Pending</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#60a5fa', fontFamily: 'monospace' }}>
                {counts.pending ?? 0}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
              <span style={{ fontSize: '0.75rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 600 }}>Failed</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f87171', fontFamily: 'monospace' }}>
                {counts.failed ?? 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Inter-Agent Communication Feed */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare style={{ width: '18px', height: '18px', color: '#6366f1' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Recent Inter-Agent Communications</h4>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigateTab && onNavigateTab('comms')}
          >
            <span>Open Comms Channel</span>
          </button>
        </div>

        {recentMessages.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
            No agent messages recorded yet. Assign a task to watch Bot A and Bot B communicate.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentMessages.slice(-5).map((m) => {
              const isBotA = m.sender === 'bot_a';
              const isBotB = m.sender === 'bot_b';
              const isUser = m.sender === 'user';

              return (
                <div
                  key={m.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    backgroundColor: isBotA ? 'rgba(139, 92, 246, 0.08)' : isBotB ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isBotA ? 'rgba(139, 92, 246, 0.25)' : isBotB ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ color: isBotA ? '#c084fc' : isBotB ? '#34d399' : '#818cf8' }}>
                        {m.sender.toUpperCase()}
                      </strong>
                      <span style={{ color: '#64748b' }}>➔</span>
                      <strong style={{ color: m.recipient === 'bot_a' ? '#c084fc' : m.recipient === 'bot_b' ? '#34d399' : '#cbd5e1' }}>
                        {m.recipient.toUpperCase()}
                      </strong>
                      <span className="badge badge-purple" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                        {m.message_type}
                      </span>
                    </div>
                    <span style={{ color: '#64748b' }}>
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: '#e2e8f0', whiteSpace: 'pre-line' }}>
                    {m.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
