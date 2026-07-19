// WordSpark Share Card Engine
// Renders a high-resolution, theme-accurate vocabulary card on Canvas and triggers download.

export const shareService = {
  // Theme styling mapping for canvas gradients and borders
  getCanvasThemePalette(themeName) {
    const palettes = {
      'light': { bgStart: '#F9F9FB', bgEnd: '#EBEBF2', cardBg: 'rgba(255, 255, 255, 0.9)', textWord: '#1F1F2E', textSub: '#5A5A75', difficultyBg: '#E1E1E6', difficultyText: '#4E4E63' },
      'dark': { bgStart: '#000000', bgEnd: '#121212', cardBg: 'rgba(28, 28, 30, 0.85)', textWord: '#FFFFFF', textSub: '#A1A1AA', difficultyBg: '#2C2C2E', difficultyText: '#D1D1D6' },
      'forest': { bgStart: '#0C1E12', bgEnd: '#1B3E26', cardBg: 'rgba(25, 45, 33, 0.8)', textWord: '#E2F0D9', textSub: '#A2C2A8', difficultyBg: '#2D4D3A', difficultyText: '#A9DFBF' },
      'ocean': { bgStart: '#05111B', bgEnd: '#0A2540', cardBg: 'rgba(15, 38, 59, 0.8)', textWord: '#E3F2FD', textSub: '#90CAF9', difficultyBg: '#1A3F60', difficultyText: '#81D4FA' },
      'purple': { bgStart: '#11091C', bgEnd: '#291442', cardBg: 'rgba(38, 20, 60, 0.8)', textWord: '#F5ECFC', textSub: '#D6C4E9', difficultyBg: '#3F2263', difficultyText: '#E8D7F9' },
      'sunset': { bgStart: '#2C0D05', bgEnd: '#5C1D06', cardBg: 'rgba(75, 25, 10, 0.8)', textWord: '#FFF0EC', textSub: '#FFAB91', difficultyBg: '#66240E', difficultyText: '#FFCCBC' },
      'rose': { bgStart: '#200A10', bgEnd: '#421422', cardBg: 'rgba(60, 20, 33, 0.8)', textWord: '#FFF0F2', textSub: '#F48FB1', difficultyBg: '#511B2C', difficultyText: '#F8BBD0' },
      'neon': { bgStart: '#03001e', bgEnd: '#1c053a', cardBg: 'rgba(18, 5, 38, 0.85)', textWord: '#39FF14', textSub: '#00F0FF', difficultyBg: '#ff007f', difficultyText: '#FFFFFF' }
    };
    
    return palettes[themeName] || palettes['light'];
  },

  downloadShareCard(wordObj, themeName = 'light') {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    const colors = this.getCanvasThemePalette(themeName);
    
    // 1. Draw outer background gradient
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    gradient.addColorStop(0, colors.bgStart);
    gradient.addColorStop(1, colors.bgEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);
    
    // Draw abstract backdrop shapes for neon/purple/sunset themes
    if (themeName !== 'light') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.beginPath();
      ctx.arc(200, 200, 400, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(880, 880, 350, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 2. Draw central premium rounded card
    const cardX = 140;
    const cardY = 140;
    const cardW = 800;
    const cardH = 800;
    const cardR = 48; // rounded corner radius
    
    // Draw card shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 20;
    
    ctx.fillStyle = colors.cardBg;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
    ctx.fill();
    
    // Reset shadow for text drawing
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw a thin border on the card
    ctx.strokeStyle = themeName === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardR);
    ctx.stroke();
    
    // 3. Draw Branding Header inside Card
    ctx.fillStyle = colors.textSub;
    ctx.font = 'bold 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('W O R D S P A R K', 540, 230);
    
    // 4. Draw Word Title
    ctx.fillStyle = colors.textWord;
    ctx.font = 'bold 72px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(wordObj.word, 540, 340);
    
    // 5. Draw Pronunciation
    if (wordObj.pronunciation) {
      ctx.fillStyle = colors.textSub;
      ctx.font = 'italic 32px system-ui, -apple-system, sans-serif';
      ctx.fillText(wordObj.pronunciation, 540, 400);
    }
    
    // 6. Draw Difficulty Badge
    const badgeText = (wordObj.difficulty || 'Medium').toUpperCase();
    ctx.font = 'bold 20px system-ui, sans-serif';
    const badgeWidth = ctx.measureText(badgeText).width + 36;
    const badgeHeight = 40;
    const badgeX = 540 - badgeWidth / 2;
    const badgeY = 430;
    
    ctx.fillStyle = colors.difficultyBg;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 20);
    ctx.fill();
    
    ctx.fillStyle = colors.difficultyText;
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, 540, badgeY + 26);
    
    // 7. Draw Divider
    ctx.strokeStyle = themeName === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(250, 510);
    ctx.lineTo(830, 510);
    ctx.stroke();
    
    // 8. Draw Meaning (multiline wrap)
    ctx.fillStyle = colors.textWord;
    ctx.font = '400 36px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    
    const maxTextWidth = 660;
    const meaningLines = this.wrapText(ctx, wordObj.meaning, maxTextWidth);
    let currentY = 570;
    
    meaningLines.forEach(line => {
      ctx.fillText(line, 540, currentY);
      currentY += 48;
    });
    
    // 9. Draw Example Sentence
    if (wordObj.example) {
      currentY += 20;
      ctx.fillStyle = colors.textSub;
      ctx.font = 'italic 30px Georgia, serif';
      const exampleLines = this.wrapText(ctx, `"${wordObj.example}"`, maxTextWidth);
      
      exampleLines.forEach(line => {
        ctx.fillText(line, 540, currentY);
        currentY += 42;
      });
    }
    
    // 10. Footer branding at bottom of card
    ctx.fillStyle = colors.textSub;
    ctx.font = '400 22px system-ui, sans-serif';
    ctx.fillText('Daily random vocabulary for long-term growth', 540, 890);
    
    // Trigger download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `wordspark_${wordObj.word.toLowerCase()}.png`;
    link.href = dataUrl;
    link.click();
  },

  // Helper text-wrap algorithm
  wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += (currentLine === '' ? '' : ' ') + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine !== '') {
      lines.push(currentLine);
    }
    return lines;
  }
};
