# 雪山攀登排名看板

部门合理化建议排名展示页面，以雪山攀登为视觉主题。

## 功能特性

- 🏔️ 雪山攀登主题，各部门按建议数量沿山脊排列
- 🎨 苹果官网风格玻璃质感设计
- ✏️ 点击部门名/数量直接编辑，自动重新排名
- 🖼️ 支持上传自定义背景图片
- 👆 支持手动拖拽调整部门位置
- 👤 每个部门可添加多个成员大头贴
- 🎭 攀登者人物图标可替换
- 🛤️ 6种攀登路径样式（虚线/实线/圆点/波浪/箭头/脚印）
- 📢 悬浮公告模块（图片/视频）
- 👁️ 编辑/预览模式一键切换
- ☁️ 支持 Supabase 云端保存，跨设备读取最新看板
- 🔐 编辑入口带密码验证，未验证时隐藏编辑控件
- 📺 支持电视端预览展示，视频静音循环播放

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

构建后 `dist/` 目录就是完整的静态文件，可以直接部署到服务器。

## Supabase 云端配置

完整 SQL、存储桶、环境变量和部署命令见 `DEPLOYMENT.md`。

需要先在 Supabase 执行 `supabase/schema.sql`，再部署三个 Edge Functions：

```bash
supabase functions deploy dashboard-auth
supabase functions deploy dashboard-save
supabase functions deploy dashboard-upload
```

## 部署到服务器

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Python 快速启动（临时演示）

```bash
cd dist
python3 -m http.server 8080
```

## 电视端显示优化

1. 全屏显示：电视浏览器打开后按 F11 进入全屏模式
2. 进入预览模式：页面右上角点击「预览模式」，隐藏所有编辑控件
3. 数据持久化：点击右上角「保存云端」后，内容保存到 Supabase
4. 电视端刷新页面后自动读取云端最新数据

## 背景图片

默认背景图路径：`public/mountain-bg.jpg`

请将你自己的雪山背景图片命名为 `mountain-bg.jpg` 放到 `public/` 目录下，或者在页面内点击「更换背景」按钮上传。

## 数据同步

页面打开会自动读取 Supabase 云端数据。未配置 Supabase 时，会退回到浏览器本机缓存，方便本地调试。

## 技术栈

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4.0
- shadcn/ui 组件库
- lucide-react 图标库
- react-router-dom 路由
