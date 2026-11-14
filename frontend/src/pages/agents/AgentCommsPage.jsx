import React, { useEffect, useState, useRef } from 'react';
import { MessageSquare, Send, Bot, User, RefreshCw, Layers, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

export default function AgentCommsPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterChannel, setFilterChannel] = useState('all'); // 'all', 'user_a', 'user_b', 'internal'
  const [inputText, setInputText] = useState('');
  const [targetRecipient, setTargetRecipient] = useState('bot_a'); // 'bot_a', 'bot_b', 'all'
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const data = await api.getAgentMessages({ limit: 100 });
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setSending(true);
    try {
      await api.sendAgentMessage({
        sender: 'user',
        recipient: targetRecipient,
        content: inputText.trim(),
        message_type: 'chat',
      });
      setInputText('');
      await fetchMessages();
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (filterChannel === 'all') return true;
    if (filterChannel === 'internal') {
      return (m.sender === 'bot_a' && m.recipient === 'bot_b') || (m.sender === 'bot_b' && m.recipient === 'bot_a');
    }
    if (filterChannel === 'user_a') {
      return (m.sender === 'user' && m.recipient === 'bot_a') || (m.sender === 'bot_a' && m.recipient === 'user');
    }
    if (filterChannel === 'user_b') {
      return (m.sender === 'user' && m.recipient === 'bot_b') || (m.sender === 'bot_b' && m.recipient === 'user');
    }
    return true;
  });

  return (
    <div className="container-xl" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>Agent Communication Center</h2>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
            Live tripartite communication bus connecting User, Bot A (COA), and Bot B (AI Engineer).
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchMessages}
          disabled={loading}
        >
          <RefreshCw className={loading ? 'animate-spin' : ''} style={{ width: '14px', height: '14px' }} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="glass-panel" style={{ padding: '10px 16px', marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn btn-sm ${filterChannel === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterChannel('all')}
        >
          All Channels ({messages.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filterChannel === 'internal' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterChannel('internal')}
        >
          Bot A ↔ Bot B (Internal Telemetry)
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filterChannel === 'user_a' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterChannel('user_a')}
        >
          User ↔ Bot A (COA)
        </button>
        <button
          type="button"
          className={`btn btn-sm ${filterChannel === 'user_b' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterChannel('user_b')}
        >
          User ↔ Bot B (AI Eng)
        </button>
      </div>

      {/* Main Chat Stream Box */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: '0', overflow: 'hidden' }}>
        {/* Messages Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredMessages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#64748b' }}>
              <MessageSquare style={{ width: '40px', height: '40px', margin: '0 auto 10px', color: '#475569' }} />
              <p>No messages in this channel yet.</p>
            </div>
          ) : (
            filteredMessages.map((m) => {
              const isUser = m.sender === 'user';
              const isBotA = m.sender === 'bot_a';
              const isBotB = m.sender === 'bot_b';
              const isSystem = m.sender === 'system';

              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    backgroundColor: isUser
                      ? 'rgba(99, 102, 241, 0.2)'
                      : isBotA
                      ? 'rgba(139, 92, 246, 0.12)'
                      : isBotB
                      ? 'rgba(16, 185, 129, 0.12)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${
                      isUser
                        ? '#6366f1'
                        : isBotA
                        ? '#8b5cf6'
                        : isBotB
                        ? '#10b981'
                        : 'rgba(255, 255, 255, 0.1)'
                    }`,
                    borderRadius: '14px',
                    padding: '12px 16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '6px', fontSize: '0.74rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ color: isUser ? '#a5b4fc' : isBotA ? '#c084fc' : isBotB ? '#34d399' : '#e2e8f0' }}>
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

                    <span style={{ color: '#64748b', fontSize: '0.7rem' }}>
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.88rem', color: '#ffffff', whiteSpace: 'pre-line', lineHeight: 1.45 }}>
                    {m.content}
                  </p>

                  {m.task_id && (
                    <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#94a3b8' }}>
                      Linked Task: <code>{m.task_id}</code>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 20px', backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            className="input-text"
            style={{ width: '160px', padding: '10px 12px', fontSize: '0.85rem' }}
            value={targetRecipient}
            onChange={(e) => setTargetRecipient(e.target.value)}
          >
            <option value="bot_a">To: Bot A (COA)</option>
            <option value="bot_b">To: Bot B (AI Eng)</option>
            <option value="all">To: Broadcast All</option>
          </select>

          <input
            type="text"
            className="input-text"
            placeholder="Type your message or instruction for the autonomous agents..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ flex: 1 }}
          />

          <button type="submit" className="btn btn-primary" disabled={sending || !inputText.trim()}>
            <Send style={{ width: '15px', height: '15px' }} />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
