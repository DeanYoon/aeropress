import React, { useState, useMemo, useEffect, useCallback } from 'react';
import recipesData from './data/recipes.json';
import BrewPopup from './BrewPopup';
import HistoryPage from './HistoryPage';
import './App.css';

// ========== Fellow Ode Gen 2 Conversion ==========
// Ode dial: 1 ~ 11, 0.3 steps (1, 1.3, 1.6, 2, 2.3, ... 11)

function getOdeSetting(grindLevel) {
  if (!grindLevel) return null;
  const gl = grindLevel.toLowerCase();
  // Medium-Coarse must be checked before plain Medium to avoid false match
  if (gl.includes('medium') && (gl.includes('coarse') || gl.includes('corse') || gl.includes('course'))) return '7 ~ 9.3';
  if (gl.includes('medium-fine') || gl.includes('medium fine') || gl.includes('finer end')) return '2.3 ~ 4.6';
  if (gl.includes('coarse') || gl.includes('french') || gl.includes('cold brew')) return '9.3 ~ 11';
  if (gl.includes('medium')) return '4.6 ~ 7';
  if (gl.includes('espresso') || gl.includes('powder') || gl.includes('sand') || gl.includes('salt') || gl.includes('very fine') || gl.includes('fine')) return '1 ~ 2.3';
  return null;
}

const FULL_CONVERSION = [
  { grind: 'Fine',          ode: '1 ~ 2.3',   micron: '275 ~ 400',  desc: 'AeroPress Fine, Espresso, Flat White' },
  { grind: 'Medium Fine ⭐',ode: '2.3 ~ 4.6', micron: '400 ~ 600',  desc: 'James Hoffmann, Jonathan Gagné' },
  { grind: 'Medium',        ode: '4.6 ~ 7',   micron: '600 ~ 800',  desc: 'Tim Wendelboe, 일반 스탠다드' },
  { grind: 'Medium Coarse', ode: '7 ~ 9.3',   micron: '800 ~ 1000', desc: '인버티드, 바이패스 방식' },
  { grind: 'Coarse',        ode: '9.3 ~ 11',  micron: '1000 ~ 1150',desc: '13g WAC 챔피언, 콜드브루' },
];

// ========== Components ==========

function RecipeCard({ recipe, onClick, onBrew }) {
  const { recipeTitle, RecipeCreator, brewMethod, duration, temperature, weight, waterLevel, saved_count, category, tags, coffeeType, grindLevel } = recipe;
  
  const isCold = tags?.includes('Cold') || category?.some(c => c.toLowerCase().includes('ice')) || recipe.isCold;
  const methodIcon = brewMethod === 'inverted' ? '🔄' : '☕';
  
  return (
    <article className="recipe-card" onClick={() => onClick(recipe)}>
      <div className="card-header">
        <h3 className="recipe-title">{recipeTitle}</h3>
        <span className="method-badge">{methodIcon} {brewMethod === 'inverted' ? 'Inverted' : 'Standard'}</span>
      </div>
      
      <div className="recipe-meta">
        <span className="creator">by {RecipeCreator || 'Unknown'}</span>
        {category && category.length && (
          <span className="category">{category[0]}</span>
        )}
      </div>
      
      <div className="recipe-stats">
        <div className="stat">
          <span className="stat-value">{weight || '?'}g</span>
          <span className="stat-label">Coffee</span>
        </div>
        <div className="stat">
          <span className="stat-value">{waterLevel || '?'}ml</span>
          <span className="stat-label">Water</span>
        </div>
        <div className="stat">
          <span className="stat-value">{temperature || '?'}°C</span>
          <span className="stat-label">Temp</span>
        </div>
        <div className="stat">
          <span className="stat-value">{duration || '?'}s</span>
          <span className="stat-label">Time</span>
        </div>
      </div>
      
      <div className="recipe-tags">
        {coffeeType && <span className="tag coffee">{coffeeType}</span>}
        {grindLevel && <span className="tag grind">{grindLevel}</span>}
        {isCold && <span className="tag cold">Iced</span>}
        {saved_count && <span className="tag saves">❤️ {saved_count}</span>}
      </div>
      
      <button className="card-brew-btn" onClick={(e) => { e.stopPropagation(); onBrew(recipe); }}>
        ▶ Brew This Recipe
      </button>
    </article>
  );
}

function RecipeDetail({ recipe, onClose, odeGuideOpen, onBrew }) {
  const { 
    recipeTitle, RecipeCreator, brewMethod, brewCategory,
    duration, temperature, weight, waterLevel, coffeeType, grindLevel,
    filterType, equipment, tags, steps, recipeDescription, 
    recipeDescriptionShort, numberOfClicks, saved_count, videoURL,
    source_url, coffeeWeight, waterAmount, recipeSpeed, credit
  } = recipe;
  
  const isCold = tags?.includes('Cold') || recipe.isCold;
  const methodIcon = brewMethod === 'inverted' ? '🔄' : '☕';
  const description = recipeDescription || recipeDescriptionShort || '';
  const odeSetting = getOdeSetting(grindLevel);
  
  const renderDescription = (text) => {
    if (!text) return null;
    const withBold = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const withLinks = withBold.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    const withBreaks = withLinks.replace(/\n/g, '<br/>');
    return <p className="detail-description" dangerouslySetInnerHTML={{ __html: withBreaks }} />;
  };
  
  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        
        <header className="detail-header">
          <h1 className="detail-title">{recipeTitle}</h1>
          <div className="detail-meta">
            <span className="creator">by {RecipeCreator || 'Unknown'}</span>
            <span className="method">{methodIcon} {brewMethod === 'inverted' ? 'Inverted' : 'Standard'}</span>
            {brewCategory && <span className="category">{brewCategory}</span>}
          </div>
          
          <div className="detail-stats">
            <div className="stat-item">
              <span className="stat-icon">⚖️</span>
              <div>
                <span className="stat-value-detail">{weight || coffeeWeight || '?'}g</span>
                <span className="stat-label-detail">Coffee</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💧</span>
              <div>
                <span className="stat-value-detail">{waterLevel || waterAmount || '?'}ml</span>
                <span className="stat-label-detail">Water</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🌡️</span>
              <div>
                <span className="stat-value-detail">{temperature || '?'}°C</span>
                <span className="stat-label-detail">Temperature</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⏱️</span>
              <div>
                <span className="stat-value-detail">{duration || '?'}s</span>
                <span className="stat-label-detail">Brew Time</span>
              </div>
            </div>
            {numberOfClicks && (
              <div className="stat-item">
                <span className="stat-icon">🔘</span>
                <div>
                  <span className="stat-value-detail">{numberOfClicks}</span>
                  <span className="stat-label-detail">Clicks</span>
                </div>
              </div>
            )}
            {recipeSpeed && (
              <div className="stat-item">
                <span className="stat-icon">⚡</span>
                <div>
                  <span className="stat-value-detail">{recipeSpeed}</span>
                  <span className="stat-label-detail">Speed</span>
                </div>
              </div>
            )}
          </div>
        </header>
        
        <div className="detail-body">
          {description && (
            <section className="detail-section">
              <h2 className="section-title">📝 Description</h2>
              {renderDescription(description)}
            </section>
          )}
          
          <section className="detail-section">
            <h2 className="section-title">☕ Coffee Details</h2>
            <div className="detail-grid">
              {coffeeType && <div><strong>Roast:</strong> {coffeeType}</div>}
              {grindLevel && <div><strong>Grind:</strong> {grindLevel}</div>}
              {filterType && <div><strong>Filter:</strong> {filterType}</div>}
              {isCold && <div><strong>Style:</strong> 🧊 Iced</div>}
            </div>
            {odeSetting && (
              <div className="ode-conversion-card">
                <div className="ode-conversion-header">
                  <span className="ode-conversion-icon">⚙️</span>
                  <span>Fellow Ode Gen 2</span>
                </div>
                <div className="ode-conversion-value">
                  Set to <strong>{odeSetting}</strong>
                  <button className="ode-conversion-guide-btn" onClick={(e) => { e.stopPropagation(); odeGuideOpen(); }}>
                    전체 변환표
                  </button>
                </div>
              </div>
            )}
          </section>
          
          {Array.isArray(tags) && tags.length > 0 && (
            <section className="detail-section">
              <h2 className="section-title">🏷️ Tags</h2>
              <div className="tags-row">
                {tags.map((tag, i) => (
                  <span key={i} className="tag-badge">{tag}</span>
                ))}
              </div>
            </section>
          )}
          
          {Array.isArray(steps) && steps.length > 0 && (
            <section className="detail-section">
              <h2 className="section-title">👨‍🍳 Steps ({steps.length})</h2>
              <ol className="steps-list">
                {steps.map((step, i) => (
                  <li key={i} className="step-item">
                    <span className="step-number">{i + 1}</span>
                    <span className="step-text">{typeof step === 'object' ? step.text || step.instruction || JSON.stringify(step) : step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          
          {Array.isArray(equipment) && equipment.length > 0 && (
            <section className="detail-section">
              <h2 className="section-title">🔧 Equipment</h2>
              <div className="equipment-list">
                {equipment.map((item, i) => (
                  <span key={i} className="equipment-item">{item}</span>
                ))}
              </div>
            </section>
          )}
          
          <div className="detail-brew-cta">
            <button className="detail-brew-btn" onClick={(e) => { e.stopPropagation(); onBrew(recipe); }}>
              ▶ Start Brew with This Recipe
            </button>
          </div>
          
          <div className="detail-footer">
            {saved_count > 0 && <span className="footer-stat">❤️ Saved {saved_count} times</span>}
            {credit && <span className="footer-credit">Credits: {credit}</span>}
            {videoURL && (
              <a href={videoURL} target="_blank" rel="noopener noreferrer" className="video-link">
                ▶️ Watch Video
              </a>
            )}
            {source_url && (
              <a href={source_url} target="_blank" rel="noopener noreferrer" className="source-link">
                🔗 View on AeroRecipe
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [recipes] = useState(() => {
    const seen = new Map();
    [...recipesData].sort((a, b) => (b.saved_count || 0) - (a.saved_count || 0)).forEach(r => {
      const saved = r.saved_count || 0;
      if (saved < 10) return;
      if (r.recipe_slug && !seen.has(r.recipe_slug)) {
        seen.set(r.recipe_slug, r);
      }
    });
    return Array.from(seen.values());
  });
  
  // Compute unique filter options from data
  const filterOptions = useMemo(() => {
    const tagSet = new Set();
    const catSet = new Set();
    recipes.forEach(r => {
      if (Array.isArray(r.tags)) r.tags.forEach(t => tagSet.add(t));
      if (Array.isArray(r.category)) r.category.forEach(c => catSet.add(c));
    });
    // Keep all unique tags (except Cold — covered by Iced button) + categories
    const otherOptions = [];
    tagSet.forEach(t => { if (t !== 'Cold') otherOptions.push({ label: t, value: `tag:${t}` }); });
    catSet.forEach(c => otherOptions.push({ label: c !== 'From an Enthusiast' ? c : 'Enthusiast', value: `cat:${c}` }));
    return otherOptions.sort((a, b) => a.label.localeCompare(b.label));
  }, [recipes]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showOdeGuide, setShowOdeGuide] = useState(false);
  const [brewRecipe, setBrewRecipe] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const handleRebrew = useCallback((brew) => {
    // Build a recipe-like object from history brew data
    const rebrewRecipe = {
      recipeTitle: brew.recipeTitle,
      recipe_slug: brew.recipeSlug,
      weight: brew.params?.coffeeWeight,
      waterLevel: brew.params?.waterAmount,
      temperature: brew.params?.temperature,
      duration: brew.params?.duration,
      grindSetting: brew.params?.grindSetting || '',
      steps: brew.steps || [],
    };
    setBrewRecipe(rebrewRecipe);
  }, []);
  
  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      // Tag-based quick filters
      if (selectedFilter === 'iced') {
        if (!Array.isArray(r.tags) || !r.tags.includes('Cold')) return false;
      } else if (selectedFilter === 'latte') {
        if (!(r.recipeTitle || '').toLowerCase().includes('latte')) return false;
      } else if (selectedFilter.startsWith('tag:')) {
        const tag = selectedFilter.slice(4);
        if (!Array.isArray(r.tags) || !r.tags.includes(tag)) return false;
      } else if (selectedFilter.startsWith('cat:')) {
        const cat = selectedFilter.slice(4);
        const cats = Array.isArray(r.category) ? r.category : [r.category || ''];
        if (!cats.includes(cat)) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (r.recipeTitle || '').toLowerCase();
        const creator = (r.RecipeCreator || '').toLowerCase();
        const tags = Array.isArray(r.tags) ? r.tags.join(' ').toLowerCase() : '';
        const catText = Array.isArray(r.category) ? r.category.join(' ').toLowerCase() : (r.category || '').toLowerCase();
        if (!title.includes(q) && !creator.includes(q) && !tags.includes(q) && !catText.includes(q)) return false;
      }
      return true;
    });
  }, [recipes, searchQuery, selectedFilter]);
  
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setSelectedRecipe(null);
        setShowOdeGuide(false);
        setBrewRecipe(null);
        setShowHistory(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="App">
      <header className="app-header">        
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search recipes, creators, tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>
        
        <div className="filter-bar">
          <div className="method-filters">
            {[
              { key: 'all', label: 'All' },
              { key: 'iced', label: '🧊 Iced' },
              { key: 'latte', label: '🥛 Latte' },
            ].map(f => (
              <button
                key={f.key}
                className={`filter-btn ${selectedFilter === f.key ? 'active' : ''}`}
                onClick={() => setSelectedFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          
          <select
            className="filter-select"
            value={selectedFilter.startsWith('tag:') || selectedFilter.startsWith('cat:') ? selectedFilter : ''}
            onChange={e => setSelectedFilter(e.target.value || 'all')}
          >
            <option value="">More...</option>
            {filterOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          <button className="ode-guide-header-btn" onClick={() => setShowOdeGuide(true)}>⚙️ Ode</button>
        </div>
      </header>
      
      {/* Navigation tabs */}
      <nav className="app-nav">
        <button
          className={`nav-tab ${!showHistory ? 'active' : ''}`}
          onClick={() => setShowHistory(false)}
        >
          📖 Recipes
        </button>
        <button
          className={`nav-tab ${showHistory ? 'active' : ''}`}
          onClick={() => setShowHistory(true)}
        >
          📋 History
        </button>
      </nav>
      
      <main className="app-main">
        {showHistory ? (
          <HistoryPage onRebrew={handleRebrew} />
        ) : filteredRecipes.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <p>No recipes found</p>
            <p className="empty-hint">Try a different search or filter</p>
            <button className="reset-btn" onClick={() => { setSearchQuery(''); setSelectedFilter('all'); }}>
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="results-info">
              Showing {filteredRecipes.length} of {recipes.length} recipes
            </div>
            <div className="recipes-grid">
              {filteredRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.recipe_slug}
                  recipe={recipe}
                  onClick={setSelectedRecipe}
                  onBrew={setBrewRecipe}
                />
              ))}
            </div>
          </>
        )}
      </main>
      
      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          odeGuideOpen={() => setShowOdeGuide(true)}
          onBrew={setBrewRecipe}
        />
      )}
      
      {showOdeGuide && (
        <OdeGuideModalView onClose={() => setShowOdeGuide(false)} />
      )}
      
      {brewRecipe && (
        <BrewPopup
          recipe={brewRecipe}
          onClose={() => setBrewRecipe(null)}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}

function OdeGuideModalView({ onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);
  
  return (
    <div className="detail-overlay" onClick={onClose} style={{ zIndex: 300 }}>
      <div className="detail-panel ode-guide-panel" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
        <button className="close-btn" onClick={onClose}>✕</button>
        
        <div className="detail-header" style={{ padding: '24px' }}>
          <h1 className="detail-title" style={{ fontSize: '22px', paddingRight: '36px' }}>
            ⚙️ Fellow Ode Gen 2 가이드
          </h1>
          <p className="app-subtitle" style={{ opacity: 0.8, fontSize: '13px', marginTop: '4px', color: 'rgba(255,255,255,0.8)' }}>
            Ode Gen 2: 1~11 다이얼 (0.3 단위: 1, 1.3, 1.6, 2, 2.3, ...)
          </p>
        </div>
        
        <div className="detail-body">
          <section className="detail-section">
            <h2 className="section-title">📊 변환표</h2>
            <div className="ode-table">
              {FULL_CONVERSION.map((row, i) => (
                <div key={i} className={`ode-row ${i === 1 ? 'ode-row-highlight' : ''}`}>
                  <div className="ode-row-header">
                    <span className="ode-grind-label">{row.grind}</span>
                    {i === 1 && <span className="ode-most-used">Most Used</span>}
                  </div>
                  <div className="ode-row-details">
                    <span className="ode-detail-item"><strong>Ode</strong> {row.ode}</span>
                    <span className="ode-detail-item"><strong>입자</strong> {row.micron}㎛</span>
                  </div>
                  <div className="ode-row-desc">{row.desc}</div>
                </div>
              ))}
            </div>
          </section>
          
          <section className="detail-section">
            <h2 className="section-title">💡 팁</h2>
            <ul className="ode-tips">
              <li>Ode 1~2.3: <strong>Fine</strong> — AeroPress fine, espresso, flat white</li>
              <li>Ode 2.3~4.6: <strong>Medium Fine</strong> — 가장 많이 쓰는 범위 ⭐</li>
              <li>Ode 4.6~7: <strong>Medium</strong> — 일반 스탠다드</li>
              <li>Ode 7~9.3: <strong>Medium Coarse</strong> — 인버티드, 바이패스</li>
              <li>Ode 9.3~11: <strong>Coarse</strong> — 콜드브루, 프렌치프레스</li>
              <li>다이얼은 0.3 단위로 조절 가능 (예: 3, 3.3, 3.6, 4)</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;