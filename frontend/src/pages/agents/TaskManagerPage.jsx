import React, { useEffect, useState } from 'react';
import { Clock, Play, RotateCcw, XCircle, CheckCircle2, AlertTriangle, FileText, Layers, ListFilter, Plus, RefreshCw, X, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';

export default function TaskManagerPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskLogs, setTaskLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // New task modal state
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignee, setNewAssignee] = useState('bot_a');
  const [newPriority, setNewPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterAssignee) params.assigned_to = filterAssignee;
      const data = await api.getAgentTasks(params);
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 4000);
    return () => clearInterval(interval);
  }, [filterStatus, filterAssignee]);

  const handleOpenLogs = async (task) => {
    setSelectedTask(task);
    setLogsLoading(true);
    try {
      const data = await api.getAgentTaskLogs(task.id);
      setTaskLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleStart = async (taskId) => {
    try {
      await api.startAgentTask(taskId);
      await fetchTasks();
    } catch (err) {
      console.error('Start task error:', err);
    }
  };

  const handleCancel = async (taskId) => {
    try {
      await api.cancelAgentTask(taskId);
      await fetchTasks();
    } catch (err) {
      console.error('Cancel task error:', err);
    }
  };

  const handleRetry = async (taskId) => {
    try {
      await api.retryAgentTask(taskId);
      await fetchTasks();
    } catch (err) {
      console.error('Retry task error:', err);
    }
  };

  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    setSubmitting(true);
    try {
      await api.createAgentTask({
        title: newTitle.trim(),
        description: newDesc.trim(),
        assigned_to: newAssignee,
        priority: newPriority,
        auto_start: true,
      });
      setShowModal(false);
      setNewTitle('');
      setNewDesc('');
      await fetchTasks();
    } catch (err) {
      console.error('Create task error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-xl" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>Task Management Center</h2>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
            Assign, schedule, prioritize, and inspect execution audit trails for Bot A, Bot B, and collaborative pipelines.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowModal(true)}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>Create New Task</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchTasks}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} style={{ width: '14px', height: '14px' }} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#94a3b8' }}>
            <ListFilter style={{ width: '15px', height: '15px' }} />
            <span>Filter By:</span>
          </div>

          <select
            className="input-text"
            style={{ width: '160px', padding: '6px 10px', fontSize: '0.8rem' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            className="input-text"
            style={{ width: '170px', padding: '6px 10px', fontSize: '0.8rem' }}
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
          >
            <option value="">All Assignees</option>
            <option value="bot_a">Bot A (COA)</option>
            <option value="bot_b">Bot B (AI Eng)</option>
            <option value="collaborative">Collaborative (Both)</option>
          </select>
        </div>

        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Showing <strong>{tasks.length}</strong> tasks
        </span>
      </div>

      {/* Tasks Table / Card List */}
      {loading && tasks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          <div className="animate-spin" style={{ width: '28px', height: '28px', border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px' }} />
          <span>Loading tasks from SQLite database...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
          <Clock style={{ width: '48px', height: '48px', color: '#475569', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#cbd5e1' }}>No Tasks Found</h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '6px' }}>
            Click "Create New Task" above or use presets on Bot A/B pages to dispatch assignments.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tasks.map((t) => {
            const isCollaborative = t.assigned_to === 'collaborative' || t.assigned_to === 'both';
            const isBotA = t.assigned_to === 'bot_a';

            return (
              <div
                key={t.id}
                className="glass-panel"
                style={{
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  borderLeft: `5px solid ${
                    isCollaborative ? '#ec4899' : isBotA ? '#8b5cf6' : '#10b981'
                  }`
                }}
              >
                {/* Left Task Info */}
                <div style={{ flex: '1 1 350px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                      {t.title}
                    </h4>
                    <span className={`badge ${
                      t.status === 'completed'
                        ? 'badge-green'
                        : t.status === 'in_progress'
                        ? 'badge-amber'
                        : t.status === 'failed'
                        ? 'badge-red'
                        : 'badge-blue'
                    }`}>
                      {t.status.replace('_', ' ')}
                    </span>
                    <span className={`badge ${
                      t.priority === 'critical'
                        ? 'badge-red'
                        : t.priority === 'high'
                        ? 'badge-amber'
                        : 'badge-blue'
                    }`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                      {t.priority}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.4, marginBottom: '8px' }}>
                    {t.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap' }}>
                    <span>Assigned to: <strong style={{ color: isCollaborative ? '#f472b6' : isBotA ? '#c084fc' : '#34d399' }}>{t.assigned_to.toUpperCase()}</strong></span>
                    <span>Created: {new Date(t.created_at).toLocaleTimeString()}</span>
                    {t.completed_at && (
                      <span>Completed: {new Date(t.completed_at).toLocaleTimeString()}</span>
                    )}
                  </div>

                  {t.result_summary && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: '#cbd5e1' }}>
                      {t.result_summary}
                    </div>
                  )}
                </div>

                {/* Right Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenLogs(t)}
                  >
                    <Layers style={{ width: '14px', height: '14px' }} />
                    <span>View Audit Logs</span>
                  </button>

                  {t.status === 'pending' && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleStart(t.id)}
                    >
                      <Play style={{ width: '14px', height: '14px' }} />
                      <span>Start</span>
                    </button>
                  )}

                  {t.status === 'in_progress' && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancel(t.id)}
                    >
                      <XCircle style={{ width: '14px', height: '14px' }} />
                      <span>Cancel</span>
                    </button>
                  )}

                  {(t.status === 'failed' || t.status === 'cancelled') && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRetry(t.id)}
                    >
                      <RotateCcw style={{ width: '14px', height: '14px' }} />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Execution Logs Modal / Drawer */}
      {selectedTask && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  Execution Audit Trail: {selectedTask.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Task ID: <code>{selectedTask.id}</code> | Assignee: <strong>{selectedTask.assigned_to.toUpperCase()}</strong> | Status: <strong>{selectedTask.status}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
              {logsLoading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Loading execution logs...</div>
              ) : taskLogs.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                  No execution log steps recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {taskLogs.map((log) => {
                    const phaseColor =
                      log.phase === 'PLAN' ? '#818cf8' :
                      log.phase === 'EXECUTE' ? '#fbbf24' :
                      log.phase === 'OBSERVE' ? '#34d399' :
                      log.phase === 'VERIFY' ? '#60a5fa' :
                      log.phase === 'REPORT' ? '#c084fc' : '#f87171';

                    return (
                      <div
                        key={log.id}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(255,255,255,0.06)',
                              color: phaseColor,
                              fontWeight: 700,
                              fontFamily: 'monospace'
                            }}>
                              STEP {log.step_number}: {log.phase}
                            </span>
                            {log.tool_name && (
                              <span style={{ color: '#a5b4fc', fontFamily: 'monospace' }}>
                                tool: {log.tool_name}()
                              </span>
                            )}
                          </div>
                          <span style={{ color: '#64748b' }}>
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{log.action}</p>

                        {log.tool_input && (
                          <div style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', fontFamily: 'monospace', fontSize: '0.74rem', color: '#94a3b8' }}>
                            <strong>Input:</strong> {JSON.stringify(log.tool_input)}
                          </div>
                        )}

                        {log.tool_output && (
                          <div style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.4)', fontFamily: 'monospace', fontSize: '0.74rem', color: '#a5b4fc', maxHeight: '160px', overflowY: 'auto' }}>
                            <strong>Output:</strong> {JSON.stringify(log.tool_output, null, 2)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Task Creation Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>Create & Dispatch New Task</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Task Title
                </label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="e.g., Benchmark PyTorch inference latency"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Description / Execution Criteria
                </label>
                <textarea
                  className="input-text"
                  rows="3"
                  placeholder="Detailed instructions for the autonomous agent..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Assignee
                  </label>
                  <select
                    className="input-text"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  >
                    <option value="bot_a">Bot A (COA Researcher)</option>
                    <option value="bot_b">Bot B (AI Engineer)</option>
                    <option value="collaborative">Collaborative (Both Bots)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Priority
                  </label>
                  <select
                    className="input-text"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <Play className={submitting ? 'animate-spin' : ''} style={{ width: '15px', height: '15px' }} />
                  <span>Dispatch Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
