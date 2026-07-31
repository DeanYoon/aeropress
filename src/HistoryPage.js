import React, { useState, useEffect } from 'react';

const API_BASE = '/api/brews';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function StarRating({ value, onChange }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className={`star ${n <= value ? 'filled' : ''}`}
          onClick={() => onChange?.(n)}
        >
          {n <= value ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

export default function HistoryPage({ onRebrew, refreshKey = 0 }) {
  const [brews, setBrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [editingNotes, setEditingNotes] = useState({});
  const [editingParams, setEditingParams] = useState({});

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}?limit=100`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setBrews(data);
    } catch (err) {
      console.error('Load history error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, [refreshKey]);

  const handleRating = async (id, rating) => {
    try {
      await fetch(API_BASE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id, rating }),
      });
      setBrews(prev => prev.map(b => b._id === id ? { ...b, rating } : b));
    } catch (err) {
      console.error('Rating failed:', err);
    }
  };

  const handleSaveNotes = async (id) => {
    const notes = editingNotes[id];
    if (notes === undefined) return;
    try {
      await fetch(API_BASE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id, notes }),
      });
      setBrews(prev => prev.map(b => b._id === id ? { ...b, notes } : b));
      setEditingNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
    } catch (err) {
      console.error('Save notes failed:', err);
    }
  };

  const handleSaveParams = async (id) => {
    const params = editingParams[id];
    if (!params) return;
    try {
      await fetch(API_BASE, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id, params }),
      });
      setBrews(prev => prev.map(b => b._id === id ? { ...b, params } : b));
      setEditingParams(prev => { const n = { ...prev }; delete n[id]; return n; });
    } catch (err) {
      console.error('Save params failed:', err);
    }
  };

  const setParam = (id, key, value) => {
    setEditingParams(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [key]: value },
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this brew record?')) return;
    try {
      await fetch(`${API_BASE}?_id=${id}`, { method: 'DELETE' });
      setBrews(prev => prev.filter(b => b._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="history-page">
      <div className="results-info history-page-info">
        📋 {loading ? 'Loading...' : `${brews.length} brews recorded`}
      </div>
      
      {loading ? (
        <div className="history-loading">Loading...</div>
      ) : brews.length === 0 ? (
        <div className="history-empty">
          <p>No brews yet.</p>
          <p className="empty-hint">Start a brew from any recipe!</p>
        </div>
      ) : (
        <div className="history-list">
          {brews.map(brew => {
            const isOpen = selectedId === brew._id;
            const p = brew.params || {};
            const ep = editingParams[brew._id] || {};
            return (
              <div key={brew._id} className={`history-card ${isOpen ? 'open' : ''}`}>
                <div className="history-card-header" onClick={() => {
                  setSelectedId(isOpen ? null : brew._id);
                  setEditingNotes(prev => { const n = { ...prev }; delete n[brew._id]; return n; });
                  setEditingParams(prev => { const n = { ...prev }; delete n[brew._id]; return n; });
                }}>
                  <div className="history-card-info">
                    <span className="history-card-title">{brew.recipeTitle}</span>
                    <span className="history-card-date">{formatDate(brew.completedAt || brew.createdAt)}</span>
                  </div>
                  <div className="history-card-meta">
                    {brew.rating > 0 && <span className="history-rating-badge">{'★'.repeat(brew.rating)}</span>}
                    <span className="history-toggle">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="history-card-body">
                    <div className="history-params">
                      <div className="history-param-input-group">
                        <label>Coffee</label>
                        <div className="history-param-input-row">
                          <input
                            className="history-param-input"
                            type="number"
                            step="0.1"
                            value={ep.coffeeWeight !== undefined ? ep.coffeeWeight : (p.coffeeWeight || '')}
                            onChange={e => setParam(brew._id, 'coffeeWeight', parseFloat(e.target.value) || 0)}
                          />
                          <span>g</span>
                        </div>
                      </div>
                      <div className="history-param-input-group">
                        <label>Water</label>
                        <div className="history-param-input-row">
                          <input
                            className="history-param-input"
                            type="number"
                            step="1"
                            value={ep.waterAmount !== undefined ? ep.waterAmount : (p.waterAmount || '')}
                            onChange={e => setParam(brew._id, 'waterAmount', parseFloat(e.target.value) || 0)}
                          />
                          <span>ml</span>
                        </div>
                      </div>
                      <div className="history-param-input-group">
                        <label>Temp</label>
                        <div className="history-param-input-row">
                          <input
                            className="history-param-input"
                            type="number"
                            step="1"
                            value={ep.temperature !== undefined ? ep.temperature : (p.temperature || '')}
                            onChange={e => setParam(brew._id, 'temperature', parseFloat(e.target.value) || 0)}
                          />
                          <span>°C</span>
                        </div>
                      </div>
                      <div className="history-param-input-group">
                        <label>Time</label>
                        <div className="history-param-input-row">
                          <input
                            className="history-param-input"
                            type="number"
                            step="5"
                            value={ep.duration !== undefined ? ep.duration : (p.duration || '')}
                            onChange={e => setParam(brew._id, 'duration', parseFloat(e.target.value) || 0)}
                          />
                          <span>s</span>
                        </div>
                      </div>
                      <div className="history-param-input-group">
                        <label>Ode</label>
                        <div className="history-param-input-row">
                          <input
                            className="history-param-input"
                            type="number"
                            step="0.3"
                            min="1"
                            max="11"
                            value={ep.grindSetting !== undefined ? ep.grindSetting : (p.grindSetting || '')}
                            onChange={e => setParam(brew._id, 'grindSetting', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>

                    {editingParams[brew._id] && (
                      <div className="history-save-params-row">
                        <button
                          className="history-save-btn"
                          onClick={() => handleSaveParams(brew._id)}
                        >
                          💾 Save Params
                        </button>
                      </div>
                    )}

                    <div className="history-rating-section">
                      <label>Your Rating</label>
                      <StarRating value={brew.rating || 0} onChange={v => handleRating(brew._id, v)} />
                    </div>

                    <div className="history-notes-section">
                      <label>Notes</label>
                      <textarea
                        className="history-notes-input"
                        placeholder="How was it? Any adjustments?"
                        value={editingNotes[brew._id] !== undefined ? editingNotes[brew._id] : (brew.notes || '')}
                        onChange={e => setEditingNotes(prev => ({ ...prev, [brew._id]: e.target.value }))}
                      />
                      <button
                        className="history-save-notes-btn"
                        onClick={() => handleSaveNotes(brew._id)}
                        disabled={editingNotes[brew._id] === undefined}
                      >
                        💾 Save Notes
                      </button>
                    </div>

                    <div className="history-actions-row">
                      <button className="history-rebrew-btn" onClick={() => onRebrew?.(brew)}>
                        🔄 Rebrowse
                      </button>
                      <button className="history-delete-btn" onClick={() => handleDelete(brew._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}