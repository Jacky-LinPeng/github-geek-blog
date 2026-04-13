const SITE_CONFIG = {
  username: "Jacky-LinPeng",
  displayName: "Jacky LinPeng",
  typedTexts: [
    "Shipping code at terminal speed.",
    "Building AI-native products.",
    "Designing tools developers enjoy."
  ]
};

const BLOG_CONFIG = {
  owner: SITE_CONFIG.username,
  repo: "github-geek-blog",
  label: "blog-post"
};

const TOKEN_STORAGE_KEY = "neon-devlog-github-token-v1";
const GITHUB_API_BASE = "https://api.github.com";
const BLOG_CONTENT_TEMPLATE = `## 背景
这篇文章想解决什么问题？场景是什么？

## 过程
1. 我先做了什么？
2. 遇到了哪些问题？
3. 如何调整方案？

## 结果
最终结果如何？有哪些数据或现象可以说明？

## 总结
这次的经验和下一步计划。`;

let blogPosts = [];
let githubToken = "";

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

function renderStats(user, repos) {
  const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  setText("repo-count", String(user.public_repos ?? "--"));
  setText("star-count", String(totalStars));
  setText("follower-count", String(user.followers ?? "--"));
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
      <article class="repo-card">
        <h3><a href="${repo.html_url}" target="_blank" rel="noreferrer">${repo.name}</a></h3>
        <p>${repo.description ? escapeHtml(repo.description) : "No description."}</p>
        <div class="repo-meta">
          <span>★ ${repo.stargazers_count || 0}</span>
          <span>${repo.language || "N/A"}</span>
        </div>
      </article>`
    )
    .join("");
}

function renderRepoError() {
  const grid = document.getElementById("repo-grid");
  if (!grid) return;
  grid.innerHTML = "<p class='placeholder'>Unable to load repositories. Check SITE_CONFIG.username.</p>";
}

function loadToken() {
  githubToken = window.localStorage.getItem(TOKEN_STORAGE_KEY) || "";
  const input = document.getElementById("github-token");
  if (input) {
    input.value = githubToken;
  }
}

function saveToken() {
  const input = document.getElementById("github-token");
  githubToken = input?.value.trim() || "";

  if (githubToken) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, githubToken);
    setBlogStatus("Token 已保存到当前浏览器。");
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setBlogStatus("Token 已清除。");
  }
}

function getApiHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }
  return headers;
}

async function fetchPostsFromIssues() {
  setBlogStatus("正在同步 GitHub Issues 文章...");
  const url = `${GITHUB_API_BASE}/repos/${BLOG_CONFIG.owner}/${BLOG_CONFIG.repo}/issues?state=all&labels=${encodeURIComponent(
    BLOG_CONFIG.label
  )}&per_page=100`;

  const res = await fetch(url, { headers: getApiHeaders() });
  if (!res.ok) {
    throw new Error(`拉取 GitHub Issues 失败（${res.status}）`);
  }

  const issues = await res.json();
  blogPosts = issues
    .filter((item) => !item.pull_request)
    .filter((item) => item.state === "open")
    .map(parseIssueToPost)
    .sort((a, b) => b.date.localeCompare(a.date));

  renderBlogPosts();
  setBlogStatus(`已同步 ${blogPosts.length} 篇文章（${BLOG_CONFIG.owner}/${BLOG_CONFIG.repo}）。`);
}

function parseIssueToPost(issue) {
  const parsed = parseIssueBody(issue.body || "");
  return {
    id: String(issue.number),
    number: issue.number,
    title: issue.title || "Untitled",
    date: parsed.date || issue.created_at.slice(0, 10),
    excerpt: parsed.excerpt || buildExcerpt(parsed.content),
    content: parsed.content,
    tags: parsed.tags,
    issueUrl: issue.html_url
  };
}

function parseIssueBody(body) {
  const match = body.match(/<!--\s*BLOG_META\s*([\s\S]*?)-->/i);
  const metaText = match ? match[1] : "";
  const content = body.replace(/<!--\s*BLOG_META\s*[\s\S]*?-->/i, "").trim();

  let date = "";
  let excerpt = "";
  let tags = [];

  metaText
    .split("\n")
    .map((line) => line.trim())
    .forEach((line) => {
      if (line.toLowerCase().startsWith("date:")) {
        date = line.slice(5).trim();
      }
      if (line.toLowerCase().startsWith("excerpt:")) {
        excerpt = line.slice(8).trim();
      }
      if (line.toLowerCase().startsWith("tags:")) {
        tags = line
          .slice(5)
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
      }
    });

  return { date, excerpt, tags, content };
}

function buildIssueBody({ date, tags, excerpt, content }) {
  const safeDate = date || new Date().toISOString().slice(0, 10);
  const safeTags = (tags || []).join(", ");
  const safeExcerpt = excerpt || buildExcerpt(content || "");

  return [
    "<!-- BLOG_META",
    `date: ${safeDate}`,
    `tags: ${safeTags}`,
    `excerpt: ${safeExcerpt}`,
    "-->",
    "",
    content || ""
  ].join("\n");
}

function buildExcerpt(content) {
  const plain = (content || "").replace(/\s+/g, " ").trim();
  if (!plain) return "暂无摘要。";
  return plain.length > 160 ? `${plain.slice(0, 157)}...` : plain;
}

function normalizeTags(rawTags) {
  if (!rawTags) return [];
  return rawTags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function renderBlogPosts() {
  const grid = document.getElementById("blog-grid");
  if (!grid) return;

  if (!blogPosts.length) {
    grid.innerHTML = "<p class='placeholder'>GitHub Issues 里还没有文章。</p>";
    return;
  }

  grid.innerHTML = blogPosts
    .map((post) => {
      const tagsLine = post.tags && post.tags.length ? `#${post.tags.join(" #")}` : "";
      return `
        <article class="blog-card">
          <p class="blog-date">${escapeHtml(formatDate(post.date))}</p>
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.excerpt)}</p>
          ${tagsLine ? `<p class="blog-tags">${escapeHtml(tagsLine)}</p>` : ""}
          <div class="blog-actions">
            <button type="button" data-action="read" data-id="${post.id}">阅读</button>
            <button type="button" data-action="edit" data-id="${post.id}">编辑</button>
            <button type="button" data-action="delete" data-id="${post.id}" class="btn-danger">删除</button>
            <button type="button" data-action="open" data-id="${post.id}">查看 Issue</button>
          </div>
        </article>`;
    })
    .join("");
}

function showPostReader(post) {
  const reader = document.getElementById("post-reader");
  if (!reader) return;

  setText("reader-date", formatDate(post.date));
  setText("reader-title", post.title);
  setText("reader-tags", post.tags && post.tags.length ? `#${post.tags.join(" #")}` : "");

  const content = document.getElementById("reader-content");
  if (content) {
    content.textContent = post.content;
  }

  reader.hidden = false;
  reader.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetPostForm() {
  const form = document.getElementById("post-form");
  if (!form) return;

  form.reset();
  const idInput = document.getElementById("post-id");
  const submit = document.getElementById("post-submit");
  const cancel = document.getElementById("post-cancel");
  const dateInput = document.getElementById("post-date");
  const excerptInput = document.getElementById("post-excerpt");
  const contentInput = document.getElementById("post-content");

  if (idInput) idInput.value = "";
  if (submit) submit.textContent = "发布文章";
  if (cancel) cancel.hidden = true;
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
  if (excerptInput) excerptInput.value = "一句话总结这篇文章的核心观点。";
  if (contentInput) contentInput.value = BLOG_CONTENT_TEMPLATE;
}

function startEditPost(post) {
  const idInput = document.getElementById("post-id");
  const title = document.getElementById("post-title");
  const date = document.getElementById("post-date");
  const tags = document.getElementById("post-tags");
  const excerpt = document.getElementById("post-excerpt");
  const content = document.getElementById("post-content");
  const submit = document.getElementById("post-submit");
  const cancel = document.getElementById("post-cancel");

  if (idInput) idInput.value = post.id;
  if (title) title.value = post.title;
  if (date) date.value = formatDate(post.date);
  if (tags) tags.value = (post.tags || []).join(", ");
  if (excerpt) excerpt.value = post.excerpt;
  if (content) content.value = post.content;
  if (submit) submit.textContent = "更新文章";
  if (cancel) cancel.hidden = false;

  document.getElementById("post-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function upsertPostFromForm(event) {
  event.preventDefault();

  const idInput = document.getElementById("post-id");
  const titleInput = document.getElementById("post-title");
  const dateInput = document.getElementById("post-date");
  const tagsInput = document.getElementById("post-tags");
  const excerptInput = document.getElementById("post-excerpt");
  const contentInput = document.getElementById("post-content");

  const title = titleInput?.value.trim() || "";
  const date = dateInput?.value || new Date().toISOString().slice(0, 10);
  const excerpt = excerptInput?.value.trim() || "";
  const content = contentInput?.value.trim() || "";
  const tags = normalizeTags(tagsInput?.value || "");

  if (!title || !excerpt || !content) {
    setBlogStatus("请填写标题、摘要和正文。");
    return;
  }

  const issueNumber = idInput?.value.trim();
  if (!githubToken) {
    openPrefilledIssuePage({ issueNumber, title, date, excerpt, content, tags });
    setBlogStatus("已打开 GitHub 页面，请提交后点击“同步文章”。");
    resetPostForm();
    return;
  }

  const body = buildIssueBody({ date, tags, excerpt, content });

  try {
    if (issueNumber) {
      await updateIssue(Number(issueNumber), { title, body });
      setBlogStatus("文章已更新到 GitHub Issues。");
    } else {
      await createIssue({ title, body });
      setBlogStatus("文章已发布到 GitHub Issues。");
    }
    resetPostForm();
    await fetchPostsFromIssues();
  } catch (error) {
    setBlogStatus(`发布失败：${error.message}`);
  }
}

function openPrefilledIssuePage({ issueNumber, title, date, excerpt, content, tags }) {
  const body = buildIssueBody({ date, excerpt, content, tags });

  if (issueNumber) {
    const url = `https://github.com/${BLOG_CONFIG.owner}/${BLOG_CONFIG.repo}/issues/${issueNumber}/edit`;
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  const labels = encodeURIComponent(BLOG_CONFIG.label);
  const issueUrl = `https://github.com/${BLOG_CONFIG.owner}/${BLOG_CONFIG.repo}/issues/new?labels=${labels}&title=${encodeURIComponent(
    title
  )}&body=${encodeURIComponent(body)}`;
  window.open(issueUrl, "_blank", "noopener,noreferrer");
}

async function createIssue({ title, body }) {
  const url = `${GITHUB_API_BASE}/repos/${BLOG_CONFIG.owner}/${BLOG_CONFIG.repo}/issues`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...getApiHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title,
      body,
      labels: [BLOG_CONFIG.label]
    })
  });

  if (!res.ok) {
    throw new Error(`创建 Issue 失败（${res.status}）`);
  }
}

async function updateIssue(issueNumber, { title, body }) {
  const url = `${GITHUB_API_BASE}/repos/${BLOG_CONFIG.owner}/${BLOG_CONFIG.repo}/issues/${issueNumber}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      ...getApiHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title, body })
  });

  if (!res.ok) {
    throw new Error(`更新 Issue 失败（${res.status}）`);
  }
}

async function closeIssue(issueNumber) {
  const url = `${GITHUB_API_BASE}/repos/${BLOG_CONFIG.owner}/${BLOG_CONFIG.repo}/issues/${issueNumber}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      ...getApiHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ state: "closed" })
  });

  if (!res.ok) {
    throw new Error(`关闭 Issue 失败（${res.status}）`);
  }
}

async function onBlogGridClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const postId = button.dataset.id;
  const post = blogPosts.find((item) => item.id === postId);
  if (!post) return;

  if (action === "read") {
    showPostReader(post);
    return;
  }

  if (action === "open") {
    window.open(post.issueUrl, "_blank", "noopener,noreferrer");
    return;
  }

  if (action === "edit") {
    startEditPost(post);
    return;
  }

  if (action === "delete") {
    const ok = window.confirm(`确定删除《${post.title}》吗？这会关闭对应的 GitHub Issue。`);
    if (!ok) return;

    if (!githubToken) {
      const editUrl = `https://github.com/${BLOG_CONFIG.owner}/${BLOG_CONFIG.repo}/issues/${post.number}`;
      window.open(editUrl, "_blank", "noopener,noreferrer");
      setBlogStatus("已打开 Issue 页面，请手动关闭后点击“同步文章”。");
      return;
    }

    try {
      await closeIssue(post.number);
      setBlogStatus("文章已删除（Issue 已关闭）。");
      await fetchPostsFromIssues();
    } catch (error) {
      setBlogStatus(`删除失败：${error.message}`);
    }
  }
}

function setBlogStatus(message) {
  setText("blog-status", message);
}

function formatDate(dateString) {
  if (!dateString) return "未知";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toISOString().slice(0, 10);
}

function setupBlogStudio() {
  const form = document.getElementById("post-form");
  const grid = document.getElementById("blog-grid");
  const cancel = document.getElementById("post-cancel");
  const saveTokenBtn = document.getElementById("save-token");
  const syncBtn = document.getElementById("sync-posts");

  loadToken();
  resetPostForm();

  form?.addEventListener("submit", upsertPostFromForm);
  grid?.addEventListener("click", onBlogGridClick);
  cancel?.addEventListener("click", resetPostForm);
  saveTokenBtn?.addEventListener("click", saveToken);
  syncBtn?.addEventListener("click", () => {
    fetchPostsFromIssues().catch((error) => {
      setBlogStatus(`同步失败：${error.message}`);
    });
  });

  fetchPostsFromIssues().catch((error) => {
    renderBlogPosts();
    setBlogStatus(`同步失败：${error.message}`);
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
  fetchGitHubData();
  setupBlogStudio();
}

setupBaseUI();
