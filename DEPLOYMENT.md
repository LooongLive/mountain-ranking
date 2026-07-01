# 云端部署说明

## 1. 建表与存储桶

在 Supabase SQL Editor 执行：

```sql
-- see supabase/schema.sql
```

也可以用 Supabase CLI：

```bash
supabase db push
```

## 2. 配置前端环境变量

复制 `.env.example` 为 `.env`，填写：

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_BOARD_ID=headquarters-suggestions
```

## 3. 配置 Edge Function 密钥

```bash
supabase secrets set EDIT_PASSWORD="your-edit-password"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
supabase secrets set MEDIA_BUCKET="dashboard-media"
```

## 4. 部署 Edge Functions

```bash
supabase functions deploy dashboard-auth
supabase functions deploy dashboard-save
supabase functions deploy dashboard-upload
```

## 5. 打包前端

```bash
npm install
npm run build
```

将 `dist/` 部署到 Vercel、Netlify、Nginx、宝塔或任意静态站点服务即可。

## 电视端建议

- 图片使用 jpg/png/gif，不使用 webp。
- 视频优先使用 mp4，编码建议 H.264 + AAC。
- 电视浏览器打开网页地址即可访问；未输入编辑密码时只读展示。
- 编辑完成后点击右上角“保存云端”，电视端刷新页面即可看到最新数据。

