const colors = ['#bd9dff', '#ff8c87', '#8ee3d2', '#f6cc79', '#90b7ff', '#f39ed1', '#b6e28f', '#ffa971'];
const TAU = Math.PI * 2;
export class Wheel {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.names = [];
    this.rotation = 0;
    this.showNames = true;
    this.frameId = null;
    this.resize = () => this.draw();
    window.addEventListener('resize', this.resize);
    this.draw();
  }
  update(names, showNames = true) { this.names = names.slice(); this.showNames = showNames; this.draw(); }
  draw() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    const cx = width / 2, cy = height / 2, radius = width * .465;
    ctx.clearRect(0, 0, width, height);
    const count = this.names.length;
    const segments = Math.max(count, 1);
    const step = TAU / segments;
    for (let i = 0; i < segments; i++) {
      const start = this.rotation + i * step - Math.PI / 2;
      const end = start + step;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, radius, start, end); ctx.closePath();
      ctx.fillStyle = count ? colors[i % colors.length] : '#272b40'; ctx.fill();
      ctx.strokeStyle = '#121421'; ctx.lineWidth = Math.max(2, 7 - count / 30); ctx.stroke();
      if (this.showNames && count) {
        const theta = start + step / 2;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(theta);
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#161525';
        const fontSize = Math.max(11, Math.min(33, (step * radius) * .32));
        ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
        const label = String(this.names[i]);
        const available = radius * .77;
        let shown = label;
        while (shown.length > 1 && ctx.measureText(shown).width > available) shown = shown.slice(0, -2) + '…';
        ctx.fillText(shown, radius * .9, 0, available);
        ctx.restore();
      }
    }
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, TAU); ctx.strokeStyle = '#f6f3ff'; ctx.lineWidth = 8; ctx.stroke();
    if (!count) { ctx.fillStyle = '#a7a8b9'; ctx.font = 'bold 32px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Tu ruleta', cx, cy - 80); }
  }
  /** Animation lands the CENTER of selected segment at the top pointer. */
  spin(selectedIndex, durationMs) {
    if (this.frameId !== null) throw new Error('Ya hay un giro en curso');
    const count = this.names.length;
    if (count < 2 || selectedIndex < 0 || selectedIndex >= count) throw new Error('Participantes inválidos');
    const step = TAU / count;
    const normalized = ((this.rotation % TAU) + TAU) % TAU;
    const desired = ((-(selectedIndex + .5) * step) % TAU + TAU) % TAU;
    const toTarget = (desired - normalized + TAU) % TAU;
    const extraTurns = 6 + Math.floor(durationMs / 3000);
    const startRotation = this.rotation;
    const travel = extraTurns * TAU + toTarget;
    const start = performance.now();
    return new Promise(resolve => {
      const tick = now => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 5);
        this.rotation = startRotation + travel * eased;
        this.draw();
        if (t < 1) this.frameId = requestAnimationFrame(tick);
        else { this.frameId = null; this.rotation = ((this.rotation % TAU) + TAU) % TAU; this.draw(); resolve(); }
      };
      this.frameId = requestAnimationFrame(tick);
    });
  }
}
