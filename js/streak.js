// WordSpark Streak Service
// Tracks consecutive daily opens, manages milestone rewards, and provides the confetti animation.

const MILESTONES = [3, 7, 15, 30, 50, 100, 365];

export const streakService = {
  // Check and update the streak when app launches
  updateStreak() {
    const todayStr = this.getTodayDateString();
    const lastOpen = localStorage.getItem('spark_last_open_date');
    let currentStreak = parseInt(localStorage.getItem('spark_streak_count') || '0', 10);
    let longestStreak = parseInt(localStorage.getItem('spark_longest_streak') || '0', 10);
    
    let isNewDay = false;
    let milestoneAchieved = null;
    
    if (!lastOpen) {
      // First open ever
      currentStreak = 1;
      longestStreak = 1;
      localStorage.setItem('spark_streak_count', '1');
      localStorage.setItem('spark_longest_streak', '1');
      localStorage.setItem('spark_last_open_date', todayStr);
      isNewDay = true;
    } else if (lastOpen === todayStr) {
      // Opened today already, streak remains unchanged
      isNewDay = false;
    } else {
      const yesterdayStr = this.getYesterdayDateString();
      if (lastOpen === yesterdayStr) {
        // Opened yesterday, streak continues!
        currentStreak++;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
          localStorage.setItem('spark_longest_streak', longestStreak.toString());
        }
        localStorage.setItem('spark_streak_count', currentStreak.toString());
        localStorage.setItem('spark_last_open_date', todayStr);
        isNewDay = true;
        
        // Check for milestone achievement
        if (MILESTONES.includes(currentStreak)) {
          milestoneAchieved = currentStreak;
        }
      } else {
        // Streak broken (more than 1 day since last open)
        currentStreak = 1;
        localStorage.setItem('spark_streak_count', '1');
        localStorage.setItem('spark_last_open_date', todayStr);
        isNewDay = true;
      }
    }
    
    // Save state for statistics
    const stats = this.getStreakStats();
    
    // Also track total number of days active in a set
    let activeDays = JSON.parse(localStorage.getItem('spark_active_days') || '[]');
    if (!activeDays.includes(todayStr)) {
      activeDays.push(todayStr);
      localStorage.setItem('spark_active_days', JSON.stringify(activeDays));
    }
    
    return {
      isNewDay,
      streakCount: currentStreak,
      longestStreak,
      milestoneAchieved
    };
  },
  
  // Get active streak state for UI
  getStreakStats() {
    return {
      currentStreak: parseInt(localStorage.getItem('spark_streak_count') || '0', 10),
      longestStreak: parseInt(localStorage.getItem('spark_longest_streak') || '0', 10),
      lastOpenDate: localStorage.getItem('spark_last_open_date') || ''
    };
  },
  
  // Get date strings
  getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  },
  
  getYesterdayDateString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  },
  
  // Canvas Confetti Celebration Animation
  triggerConfetti() {
    // Create a temporary overlay canvas
    let canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';
      document.body.appendChild(canvas);
    }
    
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    
    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });
    
    const colors = [
      '#FFC107', '#FF5722', '#E91E63', '#9C27B0', 
      '#3F51B5', '#00BCD4', '#4CAF50', '#8BC34A'
    ];
    
    const particles = [];
    const particleCount = 150;
    
    class Particle {
      constructor() {
        this.x = width / 2;
        this.y = height + 20; // shoot from bottom center
        this.radius = Math.random() * 4 + 2;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        // Velocity (shoot up and outwards)
        this.vx = Math.random() * 12 - 6;
        this.vy = -(Math.random() * 12 + 10);
        
        this.gravity = 0.3;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.01;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
      }
      
      update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
        this.rotation += this.rotationSpeed;
      }
      
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        
        // Draw a diamond/rectangle confetti
        ctx.beginPath();
        ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 1.5);
        ctx.restore();
      }
    }
    
    // Spawn particles
    for (let i = 0; i < particleCount; i++) {
      setTimeout(() => {
        if (particles.length < particleCount) {
          particles.push(new Particle());
        }
      }, i * 15);
    }
    
    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, width, height);
      
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        
        if (p.alpha <= 0 || p.y > height + 50) {
          particles.splice(i, 1);
        }
      }
      
      if (particles.length > 0) {
        requestAnimationFrame(animate);
      } else {
        // Clean up canvas
        canvas.remove();
      }
    }
    
    animate();
  }
};
