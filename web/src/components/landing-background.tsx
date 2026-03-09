"use client";

import { useEffect, useRef } from "react";

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Colours match reference: gold, white, purple, blue (alpha applied in draw)
const COLOURS = [
  "rgba(200,169,126,", // GOLD
  "rgba(240,237,232,", // WHITE
  "rgba(139,111,212,", // PURPLE
  "rgba(91,139,212,",  // BLUE
];

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type = "dot";
  colour: string;
  alpha: number;
  targetA: number;
  size: number;
  life: number;
  maxLife: number;

  constructor(private W: number, private H: number, fromBottom = false) {
    this.x = rand(-this.W * 0.2, this.W * 0.5);
    this.y = fromBottom ? rand(this.H * 0.5, this.H * 1.2) : rand(-this.H * 0.1, this.H * 1.2);

    const speed = rand(0.18, 0.55);
    const angle = rand(-52, -38);
    const rad = (angle * Math.PI) / 180;
    this.vx = Math.cos(rad) * speed;
    this.vy = Math.sin(rad) * speed;

    this.colour = pick(COLOURS);
    this.targetA = rand(0.04, 0.22);
    this.alpha = 0;
    this.size = rand(2, 9);
    this.life = 0;
    this.maxLife = rand(400, 900);
  }

  reset(fromBottom = false) {
    this.x = rand(-this.W * 0.2, this.W * 0.5);
    this.y = fromBottom ? rand(this.H * 0.5, this.H * 1.2) : rand(-this.H * 0.1, this.H * 1.2);

    const speed = rand(0.18, 0.55);
    const angle = rand(-52, -38);
    const rad = (angle * Math.PI) / 180;
    this.vx = Math.cos(rad) * speed;
    this.vy = Math.sin(rad) * speed;

    this.targetA = rand(0.04, 0.22);
    this.alpha = 0;
    this.size = rand(2, 9);
    this.life = 0;
    this.maxLife = rand(400, 900);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life++;

    if (this.life < 60) {
      this.alpha = (this.life / 60) * this.targetA;
    } else if (this.life > this.maxLife - 80) {
      this.alpha = ((this.maxLife - this.life) / 80) * this.targetA;
    }

    if (this.life >= this.maxLife || this.x > this.W * 1.15 || this.y < -this.H * 0.15) {
      this.reset(true);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const a = Math.max(0, this.alpha);
    if (a <= 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = a;

    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = this.colour + "1)";
    ctx.fill();

    ctx.restore();
  }
}

export function LandingBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;

    function init() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;

      const COUNT = Math.floor((W * H) / 16000);
      particlesRef.current = Array.from({ length: COUNT }, () => new Particle(W, H, false));
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);

      // Subtle vignette
      const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H / 2, H * 0.85);
      vignette.addColorStop(0, "rgba(12,12,14,0)");
      vignette.addColorStop(1, "rgba(12,12,14,0.55)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      for (const p of particlesRef.current) {
        p.update();
        p.draw(ctx);
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    init();
    frame();

    const onResize = () => {
      init();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ display: "block" }}
      aria-hidden
    />
  );
}
