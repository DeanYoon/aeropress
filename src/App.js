import React, { useState, useMemo, useEffect } from 'react';
import recipesData from './data/recipes.json';
import './App.css';

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

function RecipeDetail({ recipe, onClose }) {
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
  
  const renderDescription = (text) => {
    if (!text) return null;
    // Convert markdown-style **bold** to <strong>
    const withBold = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert markdown-style [text](url) to <a>
    const withLinks = withBold.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    // Convert newlines to <br/>
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
          
          {coffeeType && (
            <section className="detail-section">
              <h2 className="section-title">☕ Coffee Details</h2>
              <div className="detail-grid">
                {coffeeType && <div><strong>Roast:</strong> {coffeeType}</div>}
                {grindLevel && <div><strong>Grind:</strong> {grindLevel}</div>}
                {filterType && <div><strong>Filter:</strong> {filterType}</div>}
                {isCold && <div><strong>Style:</strong> 🧊 Iced</div>}
              </div>
            </section>
          )}
          
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
    // Deduplicate by slug, keep entries with saved_count > 0 first
    const seen = new Map();
    [...recipesData].sort((a, b) => (b.saved_count || 0) - (a.saved_count || 0)).forEach(r => {
      if (r.recipe_slug && !seen.has(r.recipe_slug)) {
        seen.set(r.recipe_slug, r);
      }
    });
    const unique = Array.from(seen.values());
    return unique;
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => {
      // Method filter
      if (selectedMethod !== 'all' && r.brewMethod !== selectedMethod) return false;
      
      // Search query
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
  
  // Close detail on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setSelectedRecipe(null);
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
            className="toggle-filters-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? '▲ Less' : '▼ More'}
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
        />
      )}
    </div>
  );
}

export default App;
