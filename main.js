const go = document.getElementById('go');

const iname = document.getElementById('iname');
iname.innerHTML = [...iname.textContent]
  .map(letter => '<span>' + letter + '</span>')
  .join('');

gsap.from('#iname span', { y: 120, opacity: 0, stagger: 0.07, duration: 0.9, ease: 'back.out(2)' });

// starting positions: text hidden below its line, small items faded out
gsap.set('.line > span', { yPercent: 110 });
gsap.set('.tag, .hero p, .btns, .hint', { opacity: 0, y: 20 });

go.addEventListener('click', () => {
  const tl = gsap.timeline();

  tl.to('#iname, #go', { opacity: 0, duration: 0.3 })
    .to('#intro .top', { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, 'open')
    .to('#intro .bot', { yPercent: 100, duration: 0.9, ease: 'power4.inOut' }, 'open')
    .set('#intro', { display: 'none' })
    .to('.line > span', { yPercent: 0, duration: 1, stagger: 0.12, ease: 'power4.out' }, '-=0.3')
    .to('.tag, .hero p, .btns, .hint', { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, '-=0.6');
});

function runTape(selector, direction) {
    const el = document.querySelector(selector + ' div');
    el.innerHTML = el.innerHTML.repeat(4);

    gsap.fromTo(el,
        { xPercent: direction > 0 ? -50 : 0 },
        { xPercent: direction > 0 ? 0 : -50, duration: 22, ease: 'none', repeat: -1}
    );
}

runTape('.t1', -1);
runTape('.t2', 1);

const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');
const hero = document.querySelector('.hero');
let W, H, S, cols, rows, heat;

function resize() {
  const box = hero.getBoundingClientRect();
  const d = window.devicePixelRatio || 1;
  W = box.width;
  H = box.height;
  canvas.width = W * d;
  canvas.height = H * d;
  ctx.setTransform(d, 0, 0, d, 0, 0);
  S = W < 600 ? 30 : 40;
  cols = Math.ceil(W / S);
  rows = Math.ceil(H / S);
  heat = new Float32Array(cols * rows);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const x = c * S;
      const y = r * S;

      ctx.strokeStyle = 'rgba(244,240,230,0.025)';
      ctx.strokeRect(x + 0.5, y + 0.5, S - 1, S - 1);

      if (heat[i] > 0.02) {
        ctx.fillStyle = ((r + c) % 2 ? 'rgba(255,74,43,' : 'rgba(45,75,255,') + heat[i].toFixed(2) + ')';
        ctx.fillRect(x + 3, y + 3, S - 6, S - 6);
        heat[i] *= 0.94;
      }
    }
  }
}

function light(x, y, radius, strength) {
  const col0 = Math.floor(x / S);
  const row0 = Math.floor(y / S);
  const n = Math.ceil(radius / S);
  for (let j = -n; j <= n; j++) {
    for (let i = -n; i <= n; i++) {
      const c = col0 + i;
      const r = row0 + j;
      if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
      const dist = Math.hypot(i, j);
      if (dist <= n) {
        const k = r * cols + c;
        heat[k] = Math.max(heat[k], strength * (1 - dist / (n + 1)));
      }
    }
  }
}

hero.addEventListener('pointermove', e => {
  const box = hero.getBoundingClientRect();
  light(e.clientX - box.left, e.clientY - box.top, 90, 1);
});

// small sparkles that appear on their own
setInterval(() => {
  light(Math.random() * W, Math.random() * H, 45, 0.8);
}, 500);

// big pulse when you tap or click
hero.addEventListener('pointerdown', e => {
  const box = hero.getBoundingClientRect();
  light(e.clientX - box.left, e.clientY - box.top, 200, 1);
});

gsap.ticker.add(draw);

gsap.registerPlugin(ScrollTrigger);

document.querySelectorAll('[data-n]').forEach(el => {
  const target = Number(el.dataset.n);
  const counter = { value: 0 };
  el.textContent = 0;

  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.to(counter, {
        value: target,
        duration: 1.6,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(counter.value); }
      });
    }
  });
});

document.querySelectorAll('.sheet').forEach((sheet, i) => {


  const stamp = sheet.querySelector('.stamp');
  const tilt = i % 2 ? 3 : -3;

  gsap.set(sheet, { rotation: tilt * 0.4 });
  gsap.set(stamp, { opacity: 0 });

  // the sheet is pinned onto the board as it scrolls into view
  gsap.from(sheet, {
    y: 90,
    rotation: tilt * 1.8,
    opacity: 0,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: { trigger: sheet, start: 'top 88%' }
  });

  // the stamp slams down a moment later
  ScrollTrigger.create({
    trigger: sheet,
    start: 'top 55%',
    once: true,
    onEnter: () => {
      gsap.fromTo(stamp,
        { scale: 3, opacity: 0 },
        { scale: 1, opacity: 0.92, duration: 0.28, ease: 'power4.in' }
      );
    }
  });
  // mouse devices only: tilt toward the pointer and replay the stamp
  if (matchMedia('(hover: hover)').matches) {
    sheet.addEventListener('pointermove', e => {
      const box = sheet.getBoundingClientRect();
      const x = (e.clientX - box.left) / box.width - 0.5;
      const y = (e.clientY - box.top) / box.height - 0.5;
      gsap.to(sheet, { rotationY: x * 10, rotationX: -y * 10, rotation: 0, duration: 0.4, overwrite: 'auto' });
    });

    sheet.addEventListener('pointerleave', () => {
      gsap.to(sheet, { rotationX: 0, rotationY: 0, rotation: tilt * 0.4, duration: 0.6 });
    });

    sheet.addEventListener('pointerenter', () => {
      gsap.fromTo(stamp, { scale: 3, opacity: 0 }, { scale: 1, opacity: 0.92, duration: 0.28, ease: 'power4.in' });
    });
  }
});

const links = document.querySelectorAll('#pads a');
const sections = [...links].map(l => document.querySelector(l.getAttribute('href')));

function highlight() {
  const line = window.innerHeight * 0.55;
  sections.forEach((sec, i) => {
    const r = sec.getBoundingClientRect();
    if (r.top <= line && r.bottom > line) {
      links.forEach(l => l.classList.remove('on'));
      links[i].classList.add('on');
    }
  });
}

window.addEventListener('scroll', highlight, { passive: true });
highlight();
window.addEventListener('load', () => ScrollTrigger.refresh());

window.addEventListener('keydown', e => {
  const n = Number(e.key);
  if (n >= 1 && n <= links.length) {
    document.querySelector(links[n - 1].getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
  }
});

gsap.utils.toArray('.box, .rule, .about p, .contact h2, .irow').forEach(el => {
  gsap.from(el, {
    y: 50,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%' }
  });
});

resize();
window.addEventListener('resize', resize);