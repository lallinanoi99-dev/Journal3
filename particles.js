class MagicParticles {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // Config mirroring MagicUI defaults
    this.quantity = 100;
    this.staticity = 50; // determines ease/speed
    this.ease = 80;
    this.color = 'rgba(124, 77, 45, 0.4)'; // use the brown accent with some transparency
    
    this.circles = [];
    this.mouse = { x: 0, y: 0 };
    this.canvasSize = { w: 0, h: 0 };
    
    this.init();
    this.animate();
    
    window.addEventListener('resize', () => this.init());
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
  }

  init() {
    this.canvasSize.w = this.canvas.parentElement.offsetWidth;
    this.canvasSize.h = this.canvas.parentElement.offsetHeight;
    this.canvas.width = this.canvasSize.w;
    this.canvas.height = this.canvasSize.h;
    this.circles = [];
    
    for (let i = 0; i < this.quantity; i++) {
      this.circles.push(this.circle());
    }
  }

  circle() {
    return {
      x: Math.random() * this.canvasSize.w,
      y: Math.random() * this.canvasSize.h,
      translateX: 0,
      translateY: 0,
      size: Math.random() * 2 + 0.5,
      alpha: 0,
      targetAlpha: parseFloat((Math.random() * 0.6 + 0.1).toFixed(1)),
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5,
      magnetism: 0.1 + Math.random() * 4,
    };
  }

  drawCircle(circle, update = false) {
    if (this.ctx) {
      const x = circle.x + circle.translateX;
      const y = circle.y + circle.translateY;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, circle.size, 0, 2 * Math.PI);
      this.ctx.fillStyle = this.color;
      this.ctx.fill();
    }
    
    if (update) {
      circle.alpha += (circle.targetAlpha - circle.alpha) * 0.02;
      circle.x += circle.dx;
      circle.y += circle.dy;
      
      // Edge bounce
      if (circle.x < 0 || circle.x > this.canvasSize.w) circle.dx *= -1;
      if (circle.y < 0 || circle.y > this.canvasSize.h) circle.dy *= -1;
      
      // Mouse interaction (repel/attract based on magicUI logic, simplified)
      const dx = this.mouse.x - (circle.x + circle.translateX);
      const dy = this.mouse.y - (circle.y + circle.translateY);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 200) {
        // Move towards mouse slightly (easing)
        circle.translateX += dx / (this.ease * circle.magnetism);
        circle.translateY += dy / (this.ease * circle.magnetism);
      } else {
        // Return to natural position
        circle.translateX += -circle.translateX / this.ease;
        circle.translateY += -circle.translateY / this.ease;
      }
    }
  }

  clearContext() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvasSize.w, this.canvasSize.h);
    }
  }

  animate() {
    this.clearContext();
    for (let i = 0; i < this.circles.length; i++) {
      this.drawCircle(this.circles[i], true);
    }
    window.requestAnimationFrame(() => this.animate());
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new MagicParticles('particles-canvas');
});
