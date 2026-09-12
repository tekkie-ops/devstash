// ---------- Footer year ----------
document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Navbar opacity on scroll ----------
const navbar = document.getElementById("navbar");
function updateNavbar() {
  navbar.classList.toggle("scrolled", window.scrollY > 20);
}
window.addEventListener("scroll", updateNavbar, { passive: true });
updateNavbar();

// ---------- Scroll reveal ----------
const revealEls = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);
revealEls.forEach((el) => revealObserver.observe(el));

// ---------- Pricing toggle ----------
const billingToggle = document.getElementById("billingToggle");
const labelMonthly = document.getElementById("labelMonthly");
const labelYearly = document.getElementById("labelYearly");
const amountEls = document.querySelectorAll(".price .amount[data-monthly]");
const periodEls = document.querySelectorAll(".price .period[data-monthly]");

let yearly = false;
function applyBilling() {
  billingToggle.setAttribute("aria-checked", String(yearly));
  labelMonthly.classList.toggle("active", !yearly);
  labelYearly.classList.toggle("active", yearly);
  amountEls.forEach((el) => {
    el.textContent = yearly ? el.dataset.yearly : el.dataset.monthly;
  });
  periodEls.forEach((el) => {
    el.textContent = yearly ? el.dataset.yearly : el.dataset.monthly;
  });
}
billingToggle.addEventListener("click", () => {
  yearly = !yearly;
  applyBilling();
});
applyBilling();

// ---------- Chaos icon animation ----------
(function chaosAnimation() {
  const stage = document.getElementById("chaosStage");
  const icons = Array.from(stage.querySelectorAll(".chaos-icon"));
  if (!icons.length) return;

  const ICON_SIZE = 56;
  const MOUSE_RADIUS = 110;
  const MOUSE_FORCE = 0.55;
  const MAX_SPEED = 1.4;
  const REPEL_SPEED_CAP = MAX_SPEED * 1.3;

  let bounds = stage.getBoundingClientRect();
  window.addEventListener("resize", () => {
    bounds = stage.getBoundingClientRect();
  });

  const particles = icons.map((el, i) => {
    const angle = (i / icons.length) * Math.PI * 2;
    return {
      el,
      x: bounds.width / 2 + Math.cos(angle) * (bounds.width * 0.28) - ICON_SIZE / 2,
      y: bounds.height / 2 + Math.sin(angle) * (bounds.height * 0.28) - ICON_SIZE / 2,
      vx: (Math.random() - 0.5) * MAX_SPEED,
      vy: (Math.random() - 0.5) * MAX_SPEED,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 0.6,
      pulsePhase: Math.random() * Math.PI * 2,
    };
  });

  let mouseX = -9999;
  let mouseY = -9999;
  let mouseActive = false;

  stage.addEventListener("mousemove", (e) => {
    const rect = stage.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    mouseActive = true;
  });
  stage.addEventListener("mouseleave", () => {
    mouseActive = false;
    mouseX = -9999;
    mouseY = -9999;
  });

  let t = 0;
  function tick() {
    t += 1;
    const w = bounds.width;
    const h = bounds.height;

    for (const p of particles) {
      // Mouse repel
      if (mouseActive) {
        const cx = p.x + ICON_SIZE / 2;
        const cy = p.y + ICON_SIZE / 2;
        const dx = cx - mouseX;
        const dy = cy - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < MOUSE_RADIUS) {
          const force = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) * MOUSE_FORCE;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      // Drift + gentle damping
      p.vx *= 0.98;
      p.vy *= 0.98;

      // Clamp speed
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > REPEL_SPEED_CAP) {
        p.vx = (p.vx / speed) * REPEL_SPEED_CAP;
        p.vy = (p.vy / speed) * REPEL_SPEED_CAP;
      }
      if (speed < 0.15) {
        p.vx += (Math.random() - 0.5) * 0.08;
        p.vy += (Math.random() - 0.5) * 0.08;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Bounce off walls
      if (p.x <= 0) { p.x = 0; p.vx *= -1; }
      if (p.x >= w - ICON_SIZE) { p.x = w - ICON_SIZE; p.vx *= -1; }
      if (p.y <= 0) { p.y = 0; p.vy *= -1; }
      if (p.y >= h - ICON_SIZE) { p.y = h - ICON_SIZE; p.vy *= -1; }

      p.rot += p.rotSpeed;
      const scale = 1 + Math.sin(t * 0.03 + p.pulsePhase) * 0.08;

      p.el.style.transform =
        `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg) scale(${scale})`;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();
