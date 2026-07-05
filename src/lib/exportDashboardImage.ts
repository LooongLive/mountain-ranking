import type { IDepartment, IFloatModule, IThemeConfig, PathStyle } from '@/types/mountain-ranking';

const EXPORT_WIDTH = 3840;
const EXPORT_HEIGHT = 2160;
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;
const IMAGE_TIMEOUT = 12000;

interface ExportDashboardImageOptions {
  departments: IDepartment[];
  floatModules: IFloatModule[];
  theme: IThemeConfig;
  viewportWidth?: number;
  viewportHeight?: number;
}

type DrawableMedia = HTMLImageElement | HTMLVideoElement;

function withTimeout<T>(promise: Promise<T>, ms = IMAGE_TIMEOUT) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('素材加载超时')), ms);
    promise.then((value) => {
      window.clearTimeout(timer);
      resolve(value);
    }).catch((error) => {
      window.clearTimeout(timer);
      reject(error);
    });
  });
}

function loadImage(src: string) {
  return withTimeout(new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片加载失败'));
    image.src = src;
  }));
}

function loadVideoFrame(src: string) {
  return withTimeout(new Promise<HTMLVideoElement>((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const finish = () => resolve(video);
    const fail = () => reject(new Error('视频画面加载失败'));

    video.addEventListener('loadeddata', () => {
      if (Number.isFinite(video.duration) && video.duration > 0.2) {
        video.currentTime = 0.2;
      } else {
        finish();
      }
    }, { once: true });
    video.addEventListener('seeked', finish, { once: true });
    video.addEventListener('error', fail, { once: true });
    video.src = src;
    video.load();
  }));
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawMedia(
  ctx: CanvasRenderingContext2D,
  media: DrawableMedia,
  x: number,
  y: number,
  w: number,
  h: number,
  mode: 'cover' | 'contain' = 'cover',
) {
  const naturalWidth = media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth;
  const naturalHeight = media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight;
  if (!naturalWidth || !naturalHeight) return;

  const mediaRatio = naturalWidth / naturalHeight;
  const boxRatio = w / h;
  let dw = w;
  let dh = h;
  let dx = x;
  let dy = y;

  if ((mode === 'cover' && mediaRatio > boxRatio) || (mode === 'contain' && mediaRatio < boxRatio)) {
    dh = h;
    dw = h * mediaRatio;
    dx = x + (w - dw) / 2;
  } else {
    dw = w;
    dh = w / mediaRatio;
    dy = y + (h - dh) / 2;
  }

  ctx.drawImage(media, dx, dy, dw, dh);
}

function setText(
  ctx: CanvasRenderingContext2D,
  size: number,
  weight = 700,
  color = '#1e3a5f',
  align: CanvasTextAlign = 'center',
) {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.font = `${weight} ${size}px "PingFang SC", "Microsoft YaHei", Arial, sans-serif`;
}

function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  weight = 700,
  color = '#1e3a5f',
  align: CanvasTextAlign = 'center',
) {
  let currentSize = size;
  setText(ctx, currentSize, weight, color, align);
  while (currentSize > 18 && ctx.measureText(text).width > maxWidth) {
    currentSize -= 2;
    setText(ctx, currentSize, weight, color, align);
  }
  ctx.fillText(text, x, y);
}

function drawPath(ctx: CanvasRenderingContext2D, departments: IDepartment[], theme: IThemeConfig) {
  const points = departments
    .map((dept) => ({ x: (dept.position.x / 100) * EXPORT_WIDTH, y: (dept.position.y / 100) * EXPORT_HEIGHT }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  if (points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = theme.pathColor || '#1e3a5f';
  ctx.lineWidth = Math.max(6, theme.pathWidth * 16);
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.82;

  const dashMap: Partial<Record<PathStyle, number[]>> = {
    dashed: [38, 24],
    dots: [5, 26],
    wave: [18, 14, 4, 14],
    footprint: [12, 30],
  };
  ctx.setLineDash(dashMap[theme.pathStyle] ?? []);

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2 - EXPORT_HEIGHT * 0.02;
    ctx.quadraticCurveTo(midX, midY, curr.x, curr.y);
  }
  ctx.stroke();
  ctx.restore();
}

async function drawBackground(ctx: CanvasRenderingContext2D, theme: IThemeConfig) {
  const gradient = ctx.createLinearGradient(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
  gradient.addColorStop(0, '#f8fbff');
  gradient.addColorStop(1, '#e7eef8');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

  try {
    const background = theme.backgroundVideo
      ? await loadVideoFrame(theme.backgroundVideo)
      : theme.backgroundImage
        ? await loadImage(theme.backgroundImage)
        : null;
    if (background) {
      drawMedia(ctx, background, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT, 'cover');
    }
  } catch {
    if (theme.backgroundImage) {
      try {
        const fallbackImage = await loadImage(theme.backgroundImage);
        drawMedia(ctx, fallbackImage, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT, 'cover');
      } catch {
        // keep gradient background
      }
    }
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
}

async function drawDepartment(ctx: CanvasRenderingContext2D, department: IDepartment, theme: IThemeConfig) {
  const centerX = (department.position.x / 100) * EXPORT_WIDTH;
  const centerY = (department.position.y / 100) * EXPORT_HEIGHT;
  const labelHeight = 144;
  const iconSize = 92;
  const horizontalPadding = 58;
  const gap = 28;
  const nameText = department.name || '部门';
  const countText = `${department.count ?? 0}`;
  const unitText = department.unit || '件';

  setText(ctx, 54, 700, theme.labelTextColor, 'left');
  const textWidth = ctx.measureText(`${nameText} : ${countText} ${unitText}`).width;
  const labelWidth = Math.max(460, Math.min(980, iconSize + gap + textWidth + horizontalPadding * 2));
  const x = centerX - labelWidth / 2;
  const y = centerY - labelHeight / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 8;
  drawRoundedRect(ctx, x, y, labelWidth, labelHeight, 34);
  ctx.fillStyle = theme.labelBgColor || 'rgba(255, 255, 255, 0.28)';
  ctx.fill();
  if (theme.labelShowBorder) {
    ctx.strokeStyle = theme.labelBorderColor || 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();

  for (const avatar of department.avatars) {
    try {
      const image = await loadImage(avatar.imageUrl);
      const ax = x + avatar.offsetX * 2;
      const ay = y + avatar.offsetY * 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(ax + 44, ay + 44, 44, 0, Math.PI * 2);
      ctx.clip();
      drawMedia(ctx, image, ax, ay, 88, 88, 'cover');
      ctx.restore();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(ax + 44, ay + 44, 44, 0, Math.PI * 2);
      ctx.stroke();
    } catch {
      // skip avatar if loading fails
    }
  }

  const iconX = x + horizontalPadding;
  const iconY = y + (labelHeight - iconSize) / 2;
  if (department.climberImage) {
    try {
      const climber = await loadImage(department.climberImage);
      drawMedia(ctx, climber, iconX, iconY, iconSize, iconSize, 'contain');
    } catch {
      drawFallbackIcon(ctx, iconX, iconY, iconSize, theme.labelTextColor);
    }
  } else {
    drawFallbackIcon(ctx, iconX, iconY, iconSize, theme.labelTextColor);
  }

  const textX = iconX + iconSize + gap;
  const textY = y + labelHeight / 2;
  drawFittedText(ctx, nameText, textX, textY, labelWidth - (textX - x) - 250, 54, 700, theme.labelTextColor, 'left');
  setText(ctx, 46, 500, theme.labelTextColor, 'left');
  ctx.fillText(' : ', textX + Math.min(ctx.measureText(nameText).width + 22, labelWidth - 340), textY);
  drawFittedText(ctx, countText, x + labelWidth - 240, textY, 120, 58, 800, theme.labelTextColor, 'center');
  drawFittedText(ctx, unitText, x + labelWidth - 95, textY, 120, 42, 500, theme.labelTextColor, 'center');
}

function drawFallbackIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color || '#1e3a5f';
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size * 0.25, size * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + size * 0.42, y + size * 0.38, size * 0.16, size * 0.34);
  ctx.fillRect(x + size * 0.25, y + size * 0.72, size * 0.5, size * 0.12);
  ctx.restore();
}

async function drawFloatModule(
  ctx: CanvasRenderingContext2D,
  module: IFloatModule,
  theme: IThemeConfig,
  scaleX: number,
  scaleY: number,
) {
  if (module.minimized) return;

  const x = module.position.x * scaleX;
  const y = module.position.y * scaleY;
  const w = Math.max(160, module.size.width * scaleX);
  const h = Math.max(120, module.size.height * scaleY);
  const radius = 30;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = theme.floatBgColor || 'rgba(255,255,255,0.75)';
  ctx.fill();
  ctx.strokeStyle = theme.floatBorderColor || 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.clip();

  if (module.contentUrl) {
    try {
      const media = module.type === 'video' ? await loadVideoFrame(module.contentUrl) : await loadImage(module.contentUrl);
      drawMedia(ctx, media, x, y, w, h, module.type === 'image' ? 'contain' : 'cover');
    } catch {
      drawFittedText(ctx, module.title || '公告', x + w / 2, y + h / 2, w - 80, 46, 700, '#334155');
    }
  } else {
    drawFittedText(ctx, module.title || '公告', x + w / 2, y + h / 2, w - 80, 46, 700, '#334155');
  }

  ctx.restore();
}

function downloadCanvas(canvas: HTMLCanvasElement) {
  return new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('截图生成失败，请检查图片或视频素材是否允许导出。'));
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.href = url;
      link.download = `CI-Ranking-4K-${stamp}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve();
      }, 500);
    }, 'image/png');
  });
}

export async function exportDashboardImage({
  departments,
  floatModules,
  theme,
  viewportWidth = window.innerWidth || BASE_WIDTH,
  viewportHeight = window.innerHeight || BASE_HEIGHT,
}: ExportDashboardImageOptions) {
  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器不支持生成截图。');

  await drawBackground(ctx, theme);

  const titleScale = EXPORT_WIDTH / BASE_WIDTH;
  drawFittedText(ctx, theme.mainTitle, EXPORT_WIDTH / 2, 170, EXPORT_WIDTH * 0.86, theme.mainTitleSize * titleScale, 800, theme.mainTitleColor);
  drawFittedText(ctx, theme.subTitle, EXPORT_WIDTH / 2, 300, EXPORT_WIDTH * 0.78, theme.subTitleSize * titleScale, 600, theme.subTitleColor);

  drawPath(ctx, departments, theme);

  for (const department of departments) {
    await drawDepartment(ctx, department, theme);
  }

  const scaleX = EXPORT_WIDTH / Math.max(1, viewportWidth);
  const scaleY = EXPORT_HEIGHT / Math.max(1, viewportHeight);
  for (const module of floatModules) {
    await drawFloatModule(ctx, module, theme, scaleX, scaleY);
  }

  await downloadCanvas(canvas);
}
