const SITE_CONFIG = {
  username: "Jacky-LinPeng",
  displayName: "Jacky LinPeng",
  typedTexts: [
    "Shipping code at terminal speed.",
    "Building AI-native products.",
    "Designing tools developers enjoy."
  ]
};

const SIGNAL_ITEMS = [
  {
    id: "alpha",
    kicker: "MODE / BUILD",
    title: "Neon Workflow Engine",
    copy: "A terminal-first release flow that compresses idea-to-merge time with tiny, reliable loops.",
    tags: ["Automation", "Velocity", "DX"]
  },
  {
    id: "beta",
    kicker: "MODE / SYSTEM",
    title: "Realtime Product Backbone",
    copy: "An event-driven architecture for social and collaboration features under high concurrency.",
    tags: ["Realtime", "Scalability", "Reliability"]
  },
  {
    id: "gamma",
    kicker: "MODE / EXPERIENCE",
    title: "Developer UX Lab",
    copy: "Internal platforms with polished interactions so engineering teams can ship fast without friction.",
    tags: ["Developer Tools", "Design", "Product"]
  }
];

function bindProfileLinks() {
  const profileUrl = `https://github.com/${SITE_CONFIG.username}`;
  const links = [
    document.getElementById("github-link"),
    document.getElementById("all-repos-link"),
    document.getElementById("contact-github")
  ];

  links.forEach((link) => {
    if (link) {
      link.href = profileUrl;
    }
  });

  const title = document.querySelector(".glitch");
  if (title) {
    title.textContent = SITE_CONFIG.displayName;
    title.setAttribute("data-text", SITE_CONFIG.displayName);
  }
}

function runTypedEffect() {
  const el = document.getElementById("typed-line");
  if (!el) return;

  let textIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const phrase = SITE_CONFIG.typedTexts[textIndex];
    el.textContent = phrase.slice(0, charIndex);

    if (!deleting && charIndex < phrase.length) {
      charIndex += 1;
      setTimeout(tick, 55);
      return;
    }

    if (!deleting && charIndex === phrase.length) {
      deleting = true;
      setTimeout(tick, 1100);
      return;
    }

    if (deleting && charIndex > 0) {
      charIndex -= 1;
      setTimeout(tick, 30);
      return;
    }

    deleting = false;
    textIndex = (textIndex + 1) % SITE_CONFIG.typedTexts.length;
    setTimeout(tick, 260);
  }

  tick();
}

async function fetchGitHubData() {
  const userUrl = `https://api.github.com/users/${SITE_CONFIG.username}`;
  const repoUrl = `https://api.github.com/users/${SITE_CONFIG.username}/repos?sort=updated&per_page=100`;

  try {
    const [userRes, repoRes] = await Promise.all([fetch(userUrl), fetch(repoUrl)]);
    if (!userRes.ok || !repoRes.ok) {
      throw new Error("Failed to fetch GitHub data.");
    }

    const user = await userRes.json();
    const repos = await repoRes.json();
    renderStats(user, repos);
    renderRepos(repos);
  } catch (error) {
    renderRepoError();
  }
}

function animateNumber(id, target) {
  const node = document.getElementById(id);
  if (!node) return;

  const duration = 850;
  const start = performance.now();

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.floor(target * (1 - Math.pow(1 - progress, 3)));
    node.textContent = String(value);
    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

function renderStats(user, repos) {
  const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  animateNumber("repo-count", user.public_repos ?? 0);
  animateNumber("star-count", totalStars);
  animateNumber("follower-count", user.followers ?? 0);
}

function renderRepos(repos) {
  const grid = document.getElementById("repo-grid");
  if (!grid) return;

  const featured = repos
    .filter((repo) => !repo.fork)
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, 6);

  if (!featured.length) {
    grid.innerHTML = "<p class='placeholder'>No public repositories yet.</p>";
    return;
  }

  grid.innerHTML = featured
    .map(
      (repo) => `
      <article class="repo-card tilt-card">
        <h3><a href="${repo.html_url}" target="_blank" rel="noreferrer">${repo.name}</a></h3>
        <p>${repo.description ? escapeHtml(repo.description) : "No description."}</p>
        <div class="repo-meta">
          <span>★ ${repo.stargazers_count || 0}</span>
          <span>${repo.language || "N/A"}</span>
        </div>
      </article>`
    )
    .join("");

  enableTiltCards();
}

function renderRepoError() {
  const grid = document.getElementById("repo-grid");
  if (!grid) return;
  grid.innerHTML = "<p class='placeholder'>Unable to load repositories. Check SITE_CONFIG.username.</p>";
}

function renderSignalCards() {
  const grid = document.getElementById("signal-grid");
  if (!grid) return;

  grid.innerHTML = SIGNAL_ITEMS.map(
    (item, index) => `
      <button class="signal-card ${index === 0 ? "active" : ""}" data-id="${item.id}" type="button">
        <p>${item.kicker}</p>
        <h3>${item.title}</h3>
      </button>`
  ).join("");

  renderSignalStage(SIGNAL_ITEMS[0]);
}

function renderSignalStage(item) {
  setText("signal-kicker", item.kicker);
  setText("signal-title", item.title);
  setText("signal-copy", item.copy);

  const tags = document.getElementById("signal-tags");
  if (tags) {
    tags.innerHTML = item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  }
}

function setupShowcaseInteraction() {
  const grid = document.getElementById("signal-grid");
  if (!grid) return;

  grid.addEventListener("click", (event) => {
    const card = event.target.closest(".signal-card");
    if (!card) return;

    const id = card.dataset.id;
    const item = SIGNAL_ITEMS.find((it) => it.id === id);
    if (!item) return;

    grid.querySelectorAll(".signal-card").forEach((node) => node.classList.remove("active"));
    card.classList.add("active");
    renderSignalStage(item);
  });
}

function setupCursorGlow() {
  const glow = document.getElementById("cursor-glow");
  if (!glow) return;

  window.addEventListener("mousemove", (event) => {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  });
}

function enableTiltCards() {
  const cards = document.querySelectorAll(".tilt-card");
  cards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotX = ((y / rect.height) - 0.5) * -8;
      const rotY = ((x / rect.width) - 0.5) * 8;
      card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-2px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)";
    });
  });
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = value;
  }
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setupRevealAnimation() {
  const items = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
        }
      });
    },
    { threshold: 0.1 }
  );
  items.forEach((item) => observer.observe(item));
}

function startMatrixBackground() {
  const canvas = document.getElementById("matrix-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener("resize", resize);

  const glyphs = "01<>[]{}#$%&*+-=".split("");
  const fontSize = 14;
  let columns = Math.floor(canvas.width / fontSize);
  let rain = Array(columns).fill(0);

  function frame() {
    ctx.fillStyle = "rgba(4, 8, 13, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#3df0b2";
    ctx.font = `${fontSize}px IBM Plex Mono`;

    if (columns !== Math.floor(canvas.width / fontSize)) {
      columns = Math.floor(canvas.width / fontSize);
      rain = Array(columns).fill(0);
    }

    for (let i = 0; i < rain.length; i += 1) {
      const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
      const x = i * fontSize;
      const y = rain[i] * fontSize;
      ctx.fillText(glyph, x, y);
      if (y > canvas.height && Math.random() > 0.975) {
        rain[i] = 0;
      } else {
        rain[i] += 1;
      }
    }
    requestAnimationFrame(frame);
  }

  frame();
}

function setupBaseUI() {
  setText("year", String(new Date().getFullYear()));
  bindProfileLinks();
  runTypedEffect();
  setupRevealAnimation();
  startMatrixBackground();
  setupCursorGlow();
  renderSignalCards();
  setupShowcaseInteraction();
  fetchGitHubData();
}

setupBaseUI();
