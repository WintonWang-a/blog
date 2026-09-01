# blog

二次元风格博客，现已加入本地动态管理和公开评论。

## 结构

- `index.html` 首页
- `about.html` 简历页
- `posts/` 静态文章页
- `dynamic.html` 动态列表
- `dynamic-post.html` 动态详情页
- `.local/admin.html` 本地后台管理页
- `assets/` 全站样式与脚本
- `server/index.js` 本地 API 服务
- `data/` 动态与评论数据

## 本地运行

1. 安装依赖：`npm install`
2. 启动服务：`npm start`
3. 打开：`http://127.0.0.1:8787`
4. 后台打开：`D:\\8502\\blog\\.local\\admin.html`

## 后台登录

- 密码写在本地 `.env`
- `.env` 和 `.local/` 不会提交到仓库

## API 地址

- 本地默认：`http://127.0.0.1:8787/api`
- 正常打开网页时默认走同域 `./api`
- 需要换成别的后端时，改 `assets/site-config.js`

## 评论

- 游客评论会直接公开显示
- 不做人工审核
