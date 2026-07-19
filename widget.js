// WordSpark Android Home Screen Widget Simulator
// Simulates and renders widget previews in the UI and settings.

export const widgetService = {
  renderWidgetPreview(elementId, wordObj, onRefresh) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    if (!wordObj) {
      container.innerHTML = `
        <div class="widget-frame empty-widget">
          <p>No words imported yet.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="widget-frame">
        <div class="widget-header">
          <div class="widget-app-identity">
            <span class="widget-logo-dot"></span>
            <span class="widget-app-title">WordSpark</span>
          </div>
          <button id="widget-refresh-btn" class="widget-action-btn" title="Refresh Widget">
            <svg viewBox="0 0 24 24" class="widget-icon">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
        </div>
        <div class="widget-content">
          <h2 class="widget-word">${wordObj.word}</h2>
          <p class="widget-pronunciation">${wordObj.pronunciation || ''}</p>
          <p class="widget-meaning">${wordObj.meaning}</p>
        </div>
        <div class="widget-footer">
          <span class="widget-tag">WORD OF THE DAY</span>
          <span class="widget-date">${this.getShortDateString()}</span>
        </div>
      </div>
    `;
    
    // Bind the refresh event
    const refreshBtn = container.querySelector('#widget-refresh-btn');
    if (refreshBtn && onRefresh) {
      refreshBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Add rotating spin effect
        refreshBtn.classList.add('spinning');
        setTimeout(() => refreshBtn.classList.remove('spinning'), 600);
        onRefresh();
      });
    }
  },
  
  getShortDateString() {
    const d = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  }
};
