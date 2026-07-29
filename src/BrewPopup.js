import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const API_BASE = '/api/brews';

// Fellow Ode Gen 2 values: 1 to 11 in 0.1 increments
const ODE_VALUES = Array.from({ length: 101 }, (_, i) => {
  const v = 1 + i * 0.1;
  return parseFloat(v.toFixed(1));
});

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Map a recipe's grindLevel to a starting Ode value
function getOdeStart(grindLevel) {
  if (!grindLevel) return null;
  const gl = grindLevel.toLowerCase();
  let range;
  if (gl.includes('espresso') || gl.includes('powder')) range = '1 ~ 2';
  else if (gl.includes('sand') || gl.includes('salt') || gl.includes('very fine')) range = '3 ~ 3.1';
  else if (gl.includes('medium-fine') || gl.includes('medium fine') || gl.includes('finer end')) range = '3.1 ~ 4';
  else if (gl.includes('medium') && (gl.includes('coarse') || gl.includes('corse') || gl.includes('course'))) range = '5 ~ 6';
  else if (gl.includes('coarse') || gl.includes('french') || gl.includes('cold brew')) range = '6 ~ 7';
  else if (gl.includes('medium')) range = '4 ~ 5';
  else if (gl.includes('fine')) range = '3.1 ~ 4';
  else return null;
  return parseFloat(range.split('~')[0].trim());
}

export default function BrewPopup({ recipe, onClose, onSaved }) {
  const [phase, setPhase] = useState('config'); // config | brewing | done
  const [elapsed, setElapsed] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  // Compute default Ode from recipe's grindLevel
  const defaultOde = useMemo(() => {
    // First try history grindSetting (from rebrew)
    if (recipe.grindSetting) {
      const v = parseFloat(recipe.grindSetting);
      if (!isNaN(v) && v >= 1 && v <= 11) return v;
    }
    // Then try recipe's grindLevel → Ode mapping
    const start = getOdeStart(recipe.grindLevel);
    if (start) return start;
    return 4; // default: Medium
  }, [recipe]);

  // Editable params
  const [params, setParams] = useState({
    coffeeWeight: recipe.weight || recipe.coffeeWeight || 15,
    waterAmount: recipe.waterLevel || recipe.waterAmount || 200,
    temperature: recipe.temperature || 93,
    duration: recipe.duration || 120,
    grindSetting: String(defaultOde),
  });

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedBeforePause = useRef(0);

  const steps = Array.isArray(recipe.steps) && recipe.steps.length > 0
    ? recipe.steps.map(s => typeof s === 'object' ? (s.text || s.instruction || '') : s)
    : [
        'Rinse paper filter & preheat AeroPress',
        'Add coffee grounds',
        'Pour water and start timer',
        'Stir / swirl',
        'Press',
        'Dilute & enjoy!',
      ];

  // Timer logic (count-up only, no auto-step-advance)
  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const total = elapsedBeforePause.current + (Date.now() - startTimeRef.current) / 1000;
      setElapsed(total);
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const handleStart = () => {
    setPhase('brewing');
    setPaused(false);
    setCurrentStep(0);
    elapsedBeforePause.current = 0;
    startTimer();
  };

  const handlePause = () => {
    if (paused) {
      setPaused(false);
      elapsedBeforePause.current = elapsed;
      startTimer();
    } else {
      setPaused(true);
      stopTimer();
      elapsedBeforePause.current = elapsed;
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    stopTimer();
    setPhase('done');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        recipeTitle: recipe.recipeTitle,
        recipeSlug: recipe.recipe_slug,
        params: {
          coffeeWeight: params.coffeeWeight,
          waterAmount: params.waterAmount,
          temperature: params.temperature,
          duration: params.duration,
          grindSetting: params.grindSetting || recipe.grindLevel || '',
        },
        steps,
        elapsedSeconds: Math.round(elapsed),
        completedAt: new Date().toISOString(),
        status: 'completed',
        notes: '',
        rating: 0,
      };

      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save failed');

      const saved = await res.json();
      setSaveResult(saved);
      if (onSaved) onSaved();
    } catch (err) {
      setSaveResult({ error: err.message });
    } finally {
      setSaving(false);
    }
  };

  const updateParam = (key, val) => {
    setParams(prev => ({ ...prev, [key]: val }));
  };

  const isLastStep = currentStep >= steps.length - 1;

  return (
    <div className="detail-overlay" onClick={onClose} style={{ zIndex: 250 }}>
      <div className="detail-panel brew-panel" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh' }}>
        <button className="close-btn" onClick={onClose}>✕</button>

        {/* ===== CONFIG PHASE ===== */}
        {phase === 'config' && (
          <>
            <div className="detail-header" style={{ padding: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', paddingRight: '32px' }}>
                ☕ {recipe.recipeTitle}
              </h2>
              <p style={{ opacity: 0.7, fontSize: '13px', marginTop: '4px' }}>Adjust your brew parameters</p>
            </div>
            <div className="detail-body">
              <div className="brew-params-grid">
                <div className="brew-param-item">
                  <label>Coffee (g)</label>
                  <input type="number" step="0.5" value={params.coffeeWeight} onChange={e => updateParam('coffeeWeight', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="brew-param-item">
                  <label>Water (ml)</label>
                  <input type="number" step="5" value={params.waterAmount} onChange={e => updateParam('waterAmount', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="brew-param-item">
                  <label>Temp (°C)</label>
                  <input type="number" step="1" value={params.temperature} onChange={e => updateParam('temperature', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="brew-param-item">
                  <label>Time (s)</label>
                  <input type="number" step="5" value={params.duration} onChange={e => updateParam('duration', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="brew-param-item brew-param-full">
                  <label>Ode Gen 2 setting</label>
                  <select
                    className="brew-grind-select"
                    value={params.grindSetting}
                    onChange={e => updateParam('grindSetting', e.target.value)}
                  >
                    {ODE_VALUES.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <div className="brew-grind-hint">
                    Ode 1-11 · {recipe.grindLevel && `Recipe: ${recipe.grindLevel}`}
                  </div>
                </div>
              </div>
              <div className="brew-ratio-display">
                Ratio: <strong>1:{params.waterAmount && params.coffeeWeight ? (params.waterAmount / params.coffeeWeight).toFixed(1) : '?'}</strong>
              </div>
              <button className="brew-start-btn" onClick={handleStart}>
                ▶ Start Brew
              </button>
            </div>
          </>
        )}

        {/* ===== BREWING PHASE ===== */}
        {phase === 'brewing' && (
          <>
            <div className="detail-header" style={{ padding: '20px 24px' }}>
              <div className="brew-timer-display">{formatTime(Math.floor(elapsed))}</div>
              <div className="brew-timer-label">
                step {currentStep + 1} / {steps.length}
              </div>
              <div className="brew-progress-track">
                <div className="brew-progress-fill" style={{ width: `${Math.min((elapsed / params.duration) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="detail-body brew-body">
              {/* Current step card */}
              <div className="brew-current-step">
                <span className="brew-step-num">{currentStep + 1}</span>
                <span className="brew-step-text">{steps[currentStep]}</span>
              </div>

              {/* Step navigation */}
              <div className="brew-step-nav">
                <button
                  className="brew-prev-btn"
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                >
                  ◀ Prev
                </button>
                {isLastStep ? (
                  <button className="brew-next-btn brew-next-last" onClick={handleFinish}>
                    ✅ Finish
                  </button>
                ) : (
                  <button className="brew-next-btn" onClick={handleNextStep}>
                    Next ▶
                  </button>
                )}
              </div>

              {/* Step list */}
              <div className="brew-step-list">
                {steps.map((step, i) => (
                  <div key={i} className={`brew-step-item ${i < currentStep ? 'done' : ''} ${i === currentStep ? 'active' : ''}`}>
                    <span className="brew-step-dot">{i < currentStep ? '✓' : i + 1}</span>
                    <span className="brew-step-label">{step}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="brew-actions">
                <button className="brew-pause-btn" onClick={handlePause}>
                  {paused ? '▶ Resume' : '⏸ Pause'}
                </button>
                <button className="brew-finish-btn" onClick={handleFinish}>
                  ✅ Finish Brew
                </button>
              </div>
            </div>
          </>
        )}

        {/* ===== DONE PHASE ===== */}
        {phase === 'done' && (
          <>
            <div className="detail-header" style={{ padding: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>✅ Brew Complete!</h2>
              <p style={{ opacity: 0.7, fontSize: '13px', marginTop: '4px' }}>
                {recipe.recipeTitle} · {formatTime(Math.floor(elapsed))}
              </p>
            </div>
            <div className="detail-body">
              <div className="brew-summary">
                <div className="brew-summary-item"><strong>{params.coffeeWeight}g</strong> coffee</div>
                <div className="brew-summary-item"><strong>{params.waterAmount}ml</strong> water</div>
                <div className="brew-summary-item"><strong>{params.temperature}°C</strong></div>
                <div className="brew-summary-item"><strong>Ode {params.grindSetting}</strong></div>
              </div>
              {saveResult && !saveResult.error && (
                <div className="brew-save-success">✅ Saved to history!</div>
              )}
              {saveResult && saveResult.error && (
                <div className="brew-save-error">❌ Save failed: {saveResult.error}</div>
              )}
              <div className="brew-done-actions">
                <button className="brew-start-btn" onClick={handleSave} disabled={saving || (saveResult && !saveResult.error)}>
                  {saving ? 'Saving...' : '💾 Save to History'}
                </button>
                <button className="brew-close-btn" onClick={onClose}>Close</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}