import { useRef, useState } from 'react';
import { useMountainRanking } from '@/context/MountainRankingContext';

export default function BackgroundLayer() {
  const { theme, setTheme, isEditMode, uploadFile } = useMountainRanking();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, 'backgrounds');
      setTheme((prev) => ({ ...prev, backgroundImage: url, backgroundVideo: '' }));
    } catch (error) {
      alert(error instanceof Error ? error.message : '背景图片上传失败');
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
    setShowMenu(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, 'background-videos');
      setTheme((prev) => ({ ...prev, backgroundVideo: url }));
    } catch (error) {
      alert(error instanceof Error ? error.message : '背景视频上传失败');
    }
    if (videoInputRef.current) videoInputRef.current.value = '';
    setShowMenu(false);
  };

  const handleClearVideo = () => {
    setTheme((prev) => ({ ...prev, backgroundVideo: '' }));
    setShowMenu(false);
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {theme.backgroundVideo ? (
        <video
          src={theme.backgroundVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={theme.backgroundImage}
          alt="雪山背景"
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-transparent to-background/10 pointer-events-none" />

      {isEditMode && (
        <>
          <div className="absolute top-4 left-4 z-20">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="bg-background/90 backdrop-blur-sm text-foreground text-sm px-3 py-2 rounded-md border border-border shadow-sm hover:bg-accent/10 transition-colors"
            >
              🎬 背景设置
            </button>
            {showMenu && (
              <div className="mt-2 bg-background/95 backdrop-blur-md border border-border rounded-md shadow-lg overflow-hidden w-40">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent/10 transition-colors"
                >
                  📷 上传图片背景
                </button>
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent/10 transition-colors border-t border-border/50"
                >
                  🎥 上传视频背景
                </button>
                {theme.backgroundVideo && (
                  <button
                    type="button"
                    onClick={handleClearVideo}
                    className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors border-t border-border/50"
                  >
                    ✕ 清除视频背景
                  </button>
                )}
              </div>
            )}
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif"
            onChange={handleImageUpload}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}
