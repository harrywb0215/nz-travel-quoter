# 新西兰旅游定制报价系统 - 云端部署与发布全流程指南
> 本文档详细指导如何将本项目部署到 **Vercel** 和 **Cloudflare Pages** 两大主流全球边缘托管平台，实现代码推送自动构建、永久免费托管以及国内极速免翻墙访问。

---

## 目录
- [一、项目基本信息与前置准备](#一项目基本信息与前置准备)
- [二、Vercel 部署与发布指南](#二vercel-部署与发布指南)
  - [1. 导入项目与首次部署](#1-导入项目与首次部署)
  - [2. 绑定自定义域名（国内免翻墙与加速关键）](#2-绑定自定义域名国内免翻墙与加速关键)
  - [3. 日常自动化发布流程](#3-日常自动化发布流程)
- [三、Cloudflare Pages 部署与发布指南（推荐备份/主力）](#三cloudflare-pages-部署与发布指南推荐备份主力)
  - [1. 为什么推荐 Cloudflare Pages](#1-为什么推荐-cloudflare-pages)
  - [2. 导入项目与首次部署](#2-导入项目与首次部署)
  - [3. 绑定自定义域名](#3-绑定自定义域名)
  - [4. SPA 单页应用路由配置](#4-spa-单页应用路由配置)
- [四、日常更新与运维避坑指南](#四日常更新与运维避坑指南)

---

## 一、项目基本信息与前置准备

本系统为纯静态前端单页应用（SPA），无需任何后台服务器或独立数据库，数据均保存在用户浏览器本地（LocalStorage），极度适合部署在边缘 CDN 平台上。

- **代码仓库**：`https://github.com/harrywb0215/nz-travel-quoter`
- **默认生产主分支**：`main`
- **核心构建框架**：Vite + React 19 + TypeScript
- **构建命令（Build Command）**：`npm run build`（对应内部 `tsc -b && vite build`）
- **构建输出目录（Output Directory）**：`dist`
- **Node.js 推荐版本**：`18.x` 或 `20.x`（Vercel 与 Cloudflare 均默认支持）

---

## 二、Vercel 部署与发布指南

### 1. 导入项目与首次部署

1. **登录 Vercel**：
   - 访问 [Vercel 官网 (https://vercel.com/)](https://vercel.com/)；
   - 点击右上角 **Log In**，选择 **Continue with GitHub** 直接使用您的 GitHub 账号授权登录。
2. **导入 GitHub 仓库**：
   - 进入控制台（Dashboard），点击右上角的 **“Add New...”** -> 选择 **“Project”**；
   - 在 **Import Git Repository** 列表中找到 `harrywb0215/nz-travel-quoter`，点击右侧的 **“Import”** 按钮。
3. **配置项目参数**（Vercel 通常会自动识别）：
   - **Project Name**：可保持默认或自定义（如 `nz-travel-quoter`）；
   - **Framework Preset**：选择 `Vite`；
   - **Root Directory**：保持默认的 `./`；
   - **Build and Output Settings**：
     - **Build Command**：`npm run build`（或开启覆盖填入 `npm run build`）
     - **Output Directory**：`dist`
     - **Install Command**：`npm install`
4. **点击“Deploy”部署**：
   - 点击蓝色的 **Deploy** 按钮，系统将自动拉取代码、安装依赖并执行打包；
   - 约 30~50 秒后，页面会放飞礼花提示 **“Congratulations!”**，表示项目已成功上线！
   - 此时系统会分配一个默认域名（如 `https://nz-travel-quoter.vercel.app`）。

---

### 2. 绑定自定义域名（国内免翻墙与加速关键）

> ⚠️ **重要提示**：Vercel 默认赠送的 `*.vercel.app` 域名在中国大陆被多数运营商 DNS 阻断，**国内用户必须绑定自己的独立域名才能顺畅打开**。

#### 操作步骤：
1. **在 Vercel 中添加域名**：
   - 进入 Vercel 中该项目的管理界面，点击顶部导航的 **Settings** -> 左侧菜单选择 **Domains**；
   - 在输入框中输入您拥有的二级域名或主域名（例如：`quote.yourdomain.com`），点击 **Add**；
   - 系统会给出推荐的 DNS 解析记录提示。
2. **在您的域名服务商（阿里云/腾讯云/Cloudflare/NameSilo等）添加 DNS 解析**：
   - **针对中国大陆访问的最佳优选配置**（官方优化线路）：
     - **主机记录**：`quote`（即二级域名前缀）
     - **记录类型**：`CNAME`
     - **记录值**：填写 **`cname-china.vercel-dns.com`**（强烈推荐！此地址专为国内线路优化，延迟更低）
   - *(注：如果是主域名 `yourdomain.com`，记录类型可选择 `A` 记录，解析到 `76.76.21.21`)*。
3. **等待生效**：
   - 解析添加后，回到 Vercel 的 Domains 页面，点击 **Refresh**；
   - 状态变为带绿勾的 **Valid Configuration** 时，Vercel 会自动申请并配置免费的 SSL 证书（HTTPS）；
   - 此时国内客户直接访问 `https://quote.yourdomain.com` 即可高速秒开。

---

### 3. 日常自动化发布流程

项目绑定完成后，您无需再登录 Vercel 控制台手动上传文件：
1. 本地完成功能开发与修改；
2. 在项目根目录下打开终端，执行标准提交流程：
   ```bash
   git add .
   git commit -m "feat: 更新报价单功能"
   git push origin main
   ```
3. **Vercel 监测到 `main` 分支有新代码推送后，会自动触发云端构建并在 1 分钟内无缝上线最新版**。

---

## 三、Cloudflare Pages 部署与发布指南（推荐备份/主力）

### 1. 为什么推荐 Cloudflare Pages
- **永久 100% 免费**：无限带宽（不限每月流量）、不限访问人次、每月 500 次代码构建；
- **国内稳定性极佳**：自带二级域名 `*.pages.dev` 访问情况普遍优于 Vercel；
- **全球 300+ 边缘机房**：抗 DDoS、自带全球免费 CDN，适合与 Vercel 形成双重备份保障。

---

### 2. 导入项目与首次部署

1. **注册与登录**：
   - 访问 [Cloudflare 控制台 (https://dash.cloudflare.com/)](https://dash.cloudflare.com/) 并注册/登录账号。
2. **创建 Pages 项目**：
   - 在左侧主菜单中点击 **Workers 和 Pages (Workers & Pages)**；
   - 点击蓝色的 **创建 (Create application)** 按钮；
   - 在上方标签页切换到 **Pages**，然后点击 **连接到 Git (Connect to Git)**。
3. **授权 GitHub 仓库**：
   - 选择您的 GitHub 账户，并在仓库列表中勾选授权 `harrywb0215/nz-travel-quoter`；
   - 选中该仓库，点击 **开始设置 (Begin setup)**。
4. **填写构建配置**：
   - **项目名称 (Project name)**：默认 `nz-travel-quoter`（可自定义）；
   - **生产分支 (Production branch)**：选择 `main`；
   - **框架预设 (Framework preset)**：选择 **Vite**；
   - **构建命令 (Build command)**：填入 `npm run build`；
   - **构建输出目录 (Build output directory)**：填入 `dist`；
   - **环境变量**（可选）：一般无需填写，保持默认即可。
5. **保存并部署**：
   - 点击底部的 **保存并部署 (Save and Deploy)**；
   - Cloudflare 将自动拉取代码并构建，约 30 秒后显示部署成功；
   - 页面会显示分配的公共访问链接（如：`https://nz-travel-quoter.pages.dev`）。

---

### 3. 绑定自定义域名

1. 进入当前 Pages 项目的页面，点击顶部的 **自定义域 (Custom domains)** 标签页；
2. 点击 **设置自定义域 (Set up a custom domain)**；
3. 输入您的独立域名（例如：`quoter.yourdomain.com`），点击 **继续**；
4. 按照页面提示：
   - **如果您的域名已经在 Cloudflare 托管**：系统会自动一键添加 DNS 解析，几秒钟即可生效；
   - **如果您的域名在其他服务商（如腾讯云/阿里云）**：在域名解析后台添加一条 `CNAME` 记录，记录值指向 `nz-travel-quoter.pages.dev` 即可。
5. 生效后，全球及国内访问均走 Cloudflare Anycast 极速 CDN。

---

### 4. SPA 单页应用路由配置

本项目根目录下已包含针对 Vercel 的 `vercel.json` 路由重写规则。
为了确保在 Cloudflare Pages 上刷新非根路由时也能正确回到 `index.html`，本项目已在 `public/_redirects` 文件中配置 SPA 路由兜底规则：
```text
/*    /index.html   200
```
Cloudflare Pages 在打包时会自动识别该文件，杜绝页面刷新 404 的问题。

---

## 四、日常更新与运维避坑指南

### 1. 推荐的“推代码即上线”标准流
无论您使用 Vercel 还是 Cloudflare Pages，只要在本地终端执行：
```bash
# 1. 检查修改状态
git status

# 2. 暂存并提交代码
git add .
git commit -m "更新说明"

# 3. 推送到远程主分支
git push origin main
```
**推送成功后，Vercel 和 Cloudflare Pages 会同时自动拉取代码并同步完成线上更新，实现高可用双冗余部署！**

### 2. 本地提前验证（防止线上构建失败）
在向 GitHub 推送代码前，建议先在本地终端执行一次：
```bash
npm run build
```
如果本地显示 `✓ built in xxx ms` 且无任何报错，即可 100% 确保云端构建顺利通过。

### 3. 常见问题排查
- **问题 1：国内客户打开提示“无法连接”**
  - **原因**：使用了平台默认的 `*.vercel.app` 域名。
  - **解决**：在 Vercel 绑定自定义独立域名，并将 CNAME 解析设置为 `cname-china.vercel-dns.com`，或改用绑好域名的 Cloudflare Pages。
- **问题 2：修改了代码并 push，但线上页面没有变化**
  - **原因**：浏览器对静态资源有本地缓存。
  - **解决**：在浏览器页面按 `Ctrl + F5`（Mac 为 `Command + Shift + R`）强制刷新缓存，或打开无痕窗口访问。
- **问题 3：多台设备/手机访问时数据是否同步？**
  - **机制说明**：系统采用客户端高性能 LocalStorage 存储机制，每个终端/浏览器独立保存自己的报价草稿和自定义价格库，互不干扰且绝对私密安全；
  - **换设备转移数据**：在原设备点击右上角设置图标 -> 【备份与出厂恢复】-> 【导出系统业务配置文件(.json)】，在新设备上点击导入，即可 1 秒同步所有价格库与条款！
