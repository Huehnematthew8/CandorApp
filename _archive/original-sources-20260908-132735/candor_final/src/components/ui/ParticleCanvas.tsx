'use client';

import { useEffect, useRef } from 'react';

export default function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    let animId: number;
    let W = 0, H = 0;

    const colors = [
      'rgba(94,92,230,',
      'rgba(0,184,148,',
      'rgba(155,89,182,',
      'rgba(59,130,246,',
    ];

    function rnd(a: number, b: number) { return Math.random() * (b - a) + a; }

    class Dot {
      col: string; rad: number; tA: number; alpha: number;
      vx: number; vy: number; x: number; y: number;
      life: number; max: number;

      constructor(fill = false) {
        this.col = colors[Math.floor(Math.random() * colors.length)];
        this.rad = rnd(0.4, 3);
        this.tA = rnd(0.02, 0.08);
        this.alpha = 0;
        this.vx = rnd(0.1, 0.34);
        this.vy = rnd(-0.34, -0.1);
        if (fill) { this.x = rnd(-W * 0.1, W * 0.9); this.y = rnd(-H * 0.1, H * 1.1); }
        else { this.x = rnd(-W * 0.2, W * 0.3); this.y = rnd(H * 0.3, H * 1.2); }
        this.life = 0;
        this.max = rnd(280, 720);
      }

      tick() {
        this.x += this.vx; this.y += this.vy; this.life++;
        if (this.life < 50) this.alpha = (this.life / 50) * this.tA;
        else if (this.life > this.max - 50) this.alpha = ((this.max - this.life) / 50) * this.tA;
        if (this.life >= this.max || this.x > W * 1.1 || this.y < -H * 0.1) {
          Object.assign(this, new Dot(false));
        }
      }

      draw() {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.rad, 0, Math.PI * 2);
        ctx.fillStyle = this.col + '1)';
        ctx.fill();
        ctx.restore();
      }
    }

    let dots: Dot[] = [];

    function init() {
      W = c!.width = window.innerWidth;
      H = c!.height = window.innerHeight;
      dots = Array.from({ length: Math.floor((W * H) / 9000) }, () => new Dot(true));
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      dots.forEach(d => { d.tick(); d.draw(); });
      animId = requestAnimationFrame(frame);
    }

    window.addEventListener('resize', init);
    init();
    frame();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', init);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  );
}
