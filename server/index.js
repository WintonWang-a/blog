const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');

const PORT = Number(process.env.PORT || 8787);
const ADMIN_PASSWORD = process.env.BLOG_ADMIN_PASSWORD;
const JWT_SECRET = process.env.BLOG_JWT_SECRET || 'winton-blog-secret';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8'
};

const seedPosts = [
  {
    slug: 'hello-world',
    title: 'Hello World',
    category: '入门',
    summary: '第一篇文章，说明这个博客要怎么写、怎么发、怎么维护。',
    content: '这是一套最轻的博客起点。没有框架负担，没有数据库，直接改 HTML 也能发文。\n\n下一步可以把文章拆成独立页面，再慢慢补标签、归档和搜索。',
    publishedAt: '2026-08-28',
    updatedAt: '2026-09-01T00:00:00.000Z'
  },
  {
    slug: 'minimalism',
    title: '为什么我选择极简博客',
    category: '理念',
    summary: '少一点结构，多一点内容，部署和维护都会轻松很多。',
    content: '写作最重要的是持续。越少的依赖，越少的维护成本，越容易坚持更新。\n\n如果以后内容多了，再按需增加功能就好。',
    publishedAt: '2026-08-28',
    updatedAt: '2026-09-01T00:00:00.000Z'
  },
  {
    slug: 'performance',
    title: '博客性能优化清单',
    category: '实践',
    summary: '压缩资源、少依赖、少脚本，让页面打开更快。',
    content: '只保留必要样式和少量脚本，页面会更快，部署也更稳。\n\n图片尽量压缩，文章页保持轻量，就是最实用的优化。',
    publishedAt: '2026-08-28',
    updatedAt: '2026-09-01T00:00:00.000Z'
  }
];

const seedComments = [];

async function ensureFile(filePath, fallback) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), 'utf8');
  }
}

async function readJson(filePath, fallback) {
  await ensureFile(filePath, fallback);
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '') || `post-${Date.now()}`;
}

function sortByDateDesc(items, key) {
  return [...items].sort((a, b) => String(b[key] || '').localeCompare(String(a[key] || '')));
}

function normalizeComment(comment) {
  return {
    ...comment,
    author: String(comment.author || '匿名').trim().slice(0, 30) || '匿名',
    content: String(comment.content || '').trim().slice(0, 500),
    postSlug: String(comment.postSlug || '').trim(),
    createdAt: comment.createdAt || new Date().toISOString()
  };
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

async function loadState() {
  const [posts, comments] = await Promise.all([
    readJson(POSTS_FILE, seedPosts),
    readJson(COMMENTS_FILE, seedComments)
  ]);
  return {
    posts: sortByDateDesc(posts, 'publishedAt'),
    comments: sortByDateDesc(comments, 'createdAt')
  };
}

async function savePosts(posts) {
  await writeJson(POSTS_FILE, sortByDateDesc(posts, 'publishedAt'));
}

async function saveComments(comments) {
  await writeJson(COMMENTS_FILE, sortByDateDesc(comments, 'createdAt'));
}

app.get('/api/health', async (req, res) => {
  const state = await loadState();
  res.set(jsonHeaders).json({
    ok: true,
    posts: state.posts.length,
    comments: state.comments.length
  });
});

app.post('/api/auth/login', async (req, res) => {
  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ message: '请先在本地 .env 里配置 BLOG_ADMIN_PASSWORD' });
  }
  const password = String(req.body?.password || '');
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: '密码不对' });
  }

  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.set(jsonHeaders).json({
    token,
    user: { role: 'admin', name: 'Winton' }
  });
});

app.get('/api/posts', async (req, res) => {
  const state = await loadState();
  const limit = Number(req.query.limit || 0);
  const commentsByPost = state.comments.reduce((map, comment) => {
    map[comment.postSlug] = (map[comment.postSlug] || 0) + 1;
    return map;
  }, {});
  const posts = state.posts.map((post) => ({
    ...post,
    commentCount: commentsByPost[post.slug] || 0
  }));
  res.set(jsonHeaders).json(limit > 0 ? posts.slice(0, limit) : posts);
});

app.get('/api/posts/:slug', async (req, res) => {
  const state = await loadState();
  const post = state.posts.find((item) => item.slug === req.params.slug);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const comments = state.comments.filter((item) => item.postSlug === post.slug);
  res.set(jsonHeaders).json({
    ...post,
    comments,
    commentCount: comments.length
  });
});

app.post('/api/posts', requireAdmin, async (req, res) => {
  const state = await loadState();
  const title = String(req.body?.title || '').trim();
  if (!title) {
    return res.status(400).json({ message: '标题不能为空' });
  }

  const slug = slugify(req.body?.slug || title);
  if (state.posts.some((post) => post.slug === slug)) {
    return res.status(409).json({ message: 'Slug 已存在' });
  }

  const post = {
    slug,
    title,
    category: String(req.body?.category || '动态').trim() || '动态',
    summary: String(req.body?.summary || '').trim(),
    content: String(req.body?.content || '').trim(),
    publishedAt: String(req.body?.publishedAt || new Date().toISOString().slice(0, 10)),
    updatedAt: new Date().toISOString()
  };

  state.posts.unshift(post);
  await savePosts(state.posts);
  res.status(201).set(jsonHeaders).json(post);
});

app.put('/api/posts/:slug', requireAdmin, async (req, res) => {
  const state = await loadState();
  const index = state.posts.findIndex((post) => post.slug === req.params.slug);
  if (index < 0) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const title = String(req.body?.title || '').trim();
  if (!title) {
    return res.status(400).json({ message: '标题不能为空' });
  }

  const updated = {
    ...state.posts[index],
    title,
    category: String(req.body?.category || state.posts[index].category || '动态').trim(),
    summary: String(req.body?.summary || '').trim(),
    content: String(req.body?.content || '').trim(),
    publishedAt: String(req.body?.publishedAt || state.posts[index].publishedAt),
    updatedAt: new Date().toISOString()
  };

  state.posts[index] = updated;
  await savePosts(state.posts);
  res.set(jsonHeaders).json(updated);
});

app.delete('/api/posts/:slug', requireAdmin, async (req, res) => {
  const state = await loadState();
  const before = state.posts.length;
  state.posts = state.posts.filter((post) => post.slug !== req.params.slug);
  state.comments = state.comments.filter((comment) => comment.postSlug !== req.params.slug);
  if (state.posts.length === before) {
    return res.status(404).json({ message: 'Post not found' });
  }

  await savePosts(state.posts);
  await saveComments(state.comments);
  res.json({ ok: true });
});

app.get('/api/comments', async (req, res) => {
  const state = await loadState();
  const postSlug = String(req.query.postSlug || '').trim();
  const comments = postSlug
    ? state.comments.filter((comment) => comment.postSlug === postSlug)
    : state.comments;
  res.set(jsonHeaders).json(comments);
});

app.post('/api/comments', async (req, res) => {
  const postSlug = String(req.body?.postSlug || '').trim();
  const author = String(req.body?.author || '匿名').trim();
  const content = String(req.body?.content || '').trim();

  if (!postSlug || !content) {
    return res.status(400).json({ message: '缺少 postSlug 或内容' });
  }

  const state = await loadState();
  if (!state.posts.some((post) => post.slug === postSlug)) {
    return res.status(404).json({ message: '文章不存在' });
  }

  const comment = normalizeComment({
    id: crypto.randomUUID(),
    postSlug,
    author,
    content,
    createdAt: new Date().toISOString()
  });

  state.comments.unshift(comment);
  await saveComments(state.comments);
  res.status(201).set(jsonHeaders).json(comment);
});

app.get('/api/admin/comments', requireAdmin, async (req, res) => {
  const state = await loadState();
  const postSlug = String(req.query.postSlug || '').trim();
  const comments = postSlug
    ? state.comments.filter((comment) => comment.postSlug === postSlug)
    : state.comments;
  res.set(jsonHeaders).json(comments);
});

app.delete('/api/admin/comments/:id', requireAdmin, async (req, res) => {
  const state = await loadState();
  const before = state.comments.length;
  state.comments = state.comments.filter((comment) => comment.id !== req.params.id);
  if (state.comments.length === before) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  await saveComments(state.comments);
  res.json({ ok: true });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(ROOT, '.local', 'admin.html'), { dotfiles: 'allow' });
});

app.get('/dynamic', (req, res) => {
  res.sendFile(path.join(ROOT, 'dynamic.html'));
});

app.get('/dynamic-post', (req, res) => {
  res.sendFile(path.join(ROOT, 'dynamic-post.html'));
});

app.use(express.static(ROOT, {
  extensions: ['html']
}));

ensureFile(POSTS_FILE, seedPosts)
  .then(() => ensureFile(COMMENTS_FILE, seedComments))
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Winton blog CMS running on http://127.0.0.1:${PORT}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
