import React, { useState, useEffect, useCallback } from 'react';

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

export default function HistoryPage() {
  const [brews, setBrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [editingNotes, setEditingNotes] = useState({});

  const loadHistory = useCallback(async () => {
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
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

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
            return (
              <div key={brew._id} className={`history-card ${isOpen ? 'open' : ''}`}>
                <div className="history-card-header" onClick={() => setSelectedId(isOpen ? null : brew._id)}>
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
                      <span>{brew.params?.coffeeWeight}g</span>
                      <span>{brew.params?.waterAmount}ml</span>
                      <span>{brew.params?.temperature}°C</span>
                      <span>{brew.params?.duration}s</span>
                      {brew.params?.grindSetting && <span>{brew.params.grindSetting}</span>}
                    </div>

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
                        Save Notes
                      </button>
                    </div>

                    <button className="history-delete-btn" onClick={() => handleDelete(brew._id)}>
                      Delete
                    </button>
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