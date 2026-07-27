import React, { useState, useMemo, useEffect } from 'react';
import recipesData from './data/recipes.json';
import './App.css';

// ========== Fellow Ode Gen 2 Conversion ==========

const ODE_RANGES = [
  { label: 'Fine (에스프레소급)', ode: '3 ~ 3.1', min: 8, max: 12, keywords: ['espresso', 'like sand', 'table salt', 'very fine'] },
  { label: 'Medium-Fine', ode: '3.1 ~ 4', min: 13, max: 16, keywords: ['medium-fine', 'medium fine', 'finer end of medium'] },
  { label: 'Medium', ode: '4 ~ 5', min: 17, max: 22, keywords: ['medium', 'standard'] },
  { label: 'Medium-Coarse', ode: '5 ~ 6', min: 23, max: 28, keywords: ['medium-coarse', 'medium coarse', 'medium - coarse'] },
  { label: 'Coarse', ode: '6 ~ 7', min: 29, max: 40, keywords: ['coarse', 'french press', 'very coarse'] },
];

function getOdeSetting(grindLevel, clicks) {
  if (clicks) {
    const c = parseInt(clicks, 10);
    if (!isNaN(c)) {
      for (const range of ODE_RANGES) {
        if (c >= range.min && c <= range.max) {
          return range.ode;
        }
      }
      if (c < 8) return '2.1 ~ 3';
      if (c > 40) return '7 ~ 8';
    }
  }
  
  if (grindLevel) {
    const gl = grindLevel.toLowerCase();
    if (gl.includes('espresso') || gl.includes('sand') || gl.includes('salt') || gl.includes('very fine')) return '3 ~ 3.1';
    if (gl.includes('medium-fine') || gl.includes('medium fine') || gl.includes('finer end')) return '3.1 ~ 4';
    if (gl.includes('medium') && (gl.includes('coarse') || gl.includes('corse') || gl.includes('course'))) return '5 ~ 6';
    if (gl.includes('coarse') || gl.includes('french') || gl.includes('cold brew')) return '6 ~ 7';
    if (gl.includes('medium')) return '4 ~ 5';
    if (gl.includes('fine')) return '3.1 ~ 4';
  }
  
  return null;
}

const FULL_CONVERSION = [
  { grind: 'Fine (에스프레소 급)', clicks: '8-12', comandante: '10-12', ode: '3 ~ 3.1', desc: 'AeroPress Espresso, V60 Style' },
  { grind: 'Medium-Fine ⭐', clicks: '13-16', comandante: '13-16', ode: '3.1 ~ 4', desc: 'James Hoffmann, Jonathan Gagné' },
  { grind: 'Medium', clicks: '17-22', comandante: '17-20', ode: '4 ~ 5', desc: 'Tim Wendelboe, 일반 스탠다드' },
  { grind: 'Medium-Coarse', clicks: '23-28', comandante: '21-25', ode: '5 ~ 6', desc: '인버티드, 바이패스 방식' },
  { grind: 'Coarse', clicks: '29-35', comandante: '26-30', ode: '6 ~ 7', desc: '13g WAC 챔피언, 콜드브루' },
];

// ========== Components ==========

function RecipeCard({ recipe, onClick }) {
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
    </article>
  );
}

function RecipeDetail({ recipe, onClose, odeGuideOpen }) {
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
  const odeSetting = getOdeSetting(grindLevel, numberOfClicks);
  
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
      if (r.recipe_slug && !seen.has(r.recipe_slug)) {
        seen.set(r.recipe_slug, r);
      }
    });
    return Array.from(seen.values());
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showOdeGuide, setShowOdeGuide] = useState(false);
  
  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      if (selectedMethod !== 'all' && r.brewMethod !== selectedMethod) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (r.recipeTitle || '').toLowerCase();
        const creator = (r.RecipeCreator || '').toLowerCase();
        const tags = Array.isArray(r.tags) ? r.tags.join(' ').toLowerCase() : '';
        const catText = Array.isArray(r.category) ? r.category.join(' ').toLowerCase() : (r.category || '').toLowerCase();
        if (!title.includes(q) && !creator.includes(q) && !tags.includes(q) && !catText.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [recipes, searchQuery, selectedMethod]);
  
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setSelectedRecipe(null);
        setShowOdeGuide(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);
  
  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">☕</span>
            AeroPrecipe
          </h1>
          <p className="app-subtitle">Browse {recipes.length} AeroPress recipes</p>
        </div>
        
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
            {['all', 'standard', 'inverted'].map(m => (
              <button
                key={m}
                className={`filter-btn ${selectedMethod === m ? 'active' : ''}`}
                onClick={() => setSelectedMethod(m)}
              >
                {m === 'all' ? 'All' : m === 'standard' ? '☕ Standard' : '🔄 Inverted'}
              </button>
            ))}
          </div>
          
          <button 
            className="ode-guide-header-btn"
            onClick={() => setShowOdeGuide(true)}
            title="Fellow Ode Gen 2 Conversion Guide"
          >
            ⚙️ Ode
          </button>
        </div>
      </header>
      
      <main className="app-main">
        {filteredRecipes.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <p>No recipes found</p>
            <p className="empty-hint">Try a different search or filter</p>
            <button className="reset-btn" onClick={() => { setSearchQuery(''); setSelectedMethod('all'); }}>
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
        />
      )}
      
      {showOdeGuide && (
        <OdeGuideModalView onClose={() => setShowOdeGuide(false)} />
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
        <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        
        <div className="detail-header" style={{ padding: '24px' }}>
          <h1 className="detail-title" style={{ fontSize: '22px', paddingRight: '36px' }}>
            ⚙️ Fellow Ode Gen 2 가이드
          </h1>
          <p className="app-subtitle" style={{ opacity: 0.8, fontSize: '13px', marginTop: '4px', color: 'rgba(255,255,255,0.8)' }}>
            Ode는 1~11 숫자 다이얼. 클릭 시스템이 아닙니다.
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
                    <span className="ode-detail-item"><strong>Clicks</strong> {row.clicks}</span>
                    <span className="ode-detail-item"><strong>Comandante</strong> {row.comandante}</span>
                    <span className="ode-detail-item ode-setting-value"><strong>Ode</strong> {row.ode}</span>
                  </div>
                  <div className="ode-row-desc">{row.desc}</div>
                </div>
              ))}
            </div>
          </section>
          
          <section className="detail-section">
            <h2 className="section-title">💡 팁</h2>
            <ul className="ode-tips">
              <li>Ode 1-2는 AeroPress에 너무 <strong>곱습니다</strong> (거의 사용 안 함)</li>
              <li>Ode 7+는 AeroPress에 너무 <strong>굵습니다</strong> (프렌치프레스 용도)</li>
              <li>숫자 사이에 <strong>미세 조정</strong> 가능 (예: 3.5)</li>
              <li><strong>James Hoffmann 레시피</strong>로 시작한다면 → <strong>Ode 3.5</strong>에서 시작</li>
              <li>각 레시피 상세에 Ode 추천값이 표시됩니다</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;