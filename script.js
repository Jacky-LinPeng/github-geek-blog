const SITE_CONFIG = {
  username: "Jacky-LinPeng",
  displayName: "Jacky LinPeng",
  typedTexts: [
    "追求技术深度，也重视工程取舍",
    "关注性能、稳定性与可维护性",
    "Keep it simple, solve real problems"
  ]
};

const SIGNAL_ITEMS = [
  {
    id: "alpha",
    kicker: "SCENE / VISUAL",
    title: "Hero Motion Deck",
    copy: "三端设备叠层、漂浮动画和 3D 倾斜反馈，让首页第一屏更像产品发布会。",
    tags: ["Animation", "3D Tilt", "Landing"]
  },
  {
    id: "beta",
    kicker: "SCENE / CODE",
    title: "Live Repo Feed",
    copy: "直接读取 GitHub API 展示仓库、Stars 与关注数据，静态页面也有实时感。",
    tags: ["GitHub API", "Data", "Stats"]
  },
  {
    id: "gamma",
    kicker: "SCENE / DEVICE",
    title: "Responsive Stage",
    copy: "同一套视觉语言覆盖电脑、平板和手机，移动端依然保持层次和冲击力。",
    tags: ["Responsive", "Mobile", "UX"]
  }
];

function bindProfileLinks() {
  const profileUrl = `https://github.com/${SITE_CONFIG.username}`;
  ["github-link", "all-repos-link", "contact-github"].forEach((id) => {
    const link = document.getElementById(id);
    if (link) {
      link.href = profileUrl;
    }
  });
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
      setTimeout(tick, 52);
      return;
    }

    if (!deleting && charIndex === phrase.length) {
      deleting = true;
      setTimeout(tick, 1200);
      return;
    }

    if (deleting && charIndex > 0) {
      charIndex -= 1;
      setTimeout(tick, 28);
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

  const start = performance.now();
  const duration = 820;

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    node.textContent = String(Math.floor(target * eased));
    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

function renderStats(user, repos) {
  const stars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  animateNumber("repo-count", user.public_repos ?? 0);
  animateNumber("star-count", stars);
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
    grid.innerHTML = "<p class='placeholder'>暂无公开仓库。</p>";
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
  grid.innerHTML = "<p class='placeholder'>仓库加载失败，请检查用户名配置。</p>";
}

function renderSignalCards() {
  const grid = document.getElementById("signal-grid");
  if (!grid) return;

  grid.innerHTML = SIGNAL_ITEMS.map(
    (item, idx) => `
      <button class="signal-card ${idx === 0 ? "active" : ""}" data-id="${item.id}" type="button">
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

function setupSignalInteraction() {
  const grid = document.getElementById("signal-grid");
  if (!grid) return;

  grid.addEventListener("click", (event) => {
    const card = event.target.closest(".signal-card");
    if (!card) return;

    const item = SIGNAL_ITEMS.find((it) => it.id === card.dataset.id);
    if (!item) return;

    grid.querySelectorAll(".signal-card").forEach((node) => node.classList.remove("active"));
    card.classList.add("active");
    renderSignalStage(item);
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

function setupParallaxStage() {
  const stage = document.getElementById("device-stage");
  if (!stage) return;

  stage.addEventListener("mousemove", (event) => {
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    const laptop = stage.querySelector(".laptop");
    const tablet = stage.querySelector(".tablet");
    const phone = stage.querySelector(".phone");

    if (laptop) laptop.style.transform = `translate(${x * 8}px, ${y * 8}px)`;
    if (tablet) tablet.style.transform = `translate(${x * 14}px, ${y * 14}px)`;
    if (phone) phone.style.transform = `translate(${x * 18}px, ${y * 18}px)`;
  });

  stage.addEventListener("mouseleave", () => {
    stage.querySelectorAll(".device").forEach((node) => {
      node.style.transform = "translate(0, 0)";
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

function setupBaseUI() {
  setText("year", String(new Date().getFullYear()));
  bindProfileLinks();
  runTypedEffect();
  setupRevealAnimation();
  setupParallaxStage();
  renderSignalCards();
  setupSignalInteraction();
  fetchGitHubData();
  enableTiltCards();
}

setupBaseUI();
