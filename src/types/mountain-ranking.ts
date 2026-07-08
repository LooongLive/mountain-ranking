export interface IAvatar {
  id: string;
  deptId: string;
  imageUrl: string;
  offsetX: number;
  offsetY: number;
}

export type SpeechBubbleStyle = 'rounded' | 'comic' | 'cloud' | 'burst' | 'caption';

export interface ISpeechBubbleConfig {
  enabled?: boolean;
  style?: SpeechBubbleStyle;
  backgroundColor?: string;
  textColor?: string;
  opacity?: number;
  scale?: number;
  blur?: number;
  messages?: string[];
  holdSeconds?: number;
  intervalSeconds?: number;
}

export interface IDepartment {
  id: string;
  name: string;
  count: number;
  unit: string;
  cardScale?: number;
  cardFontScale?: number;
  position: {
    x: number;
    y: number;
    isManual: boolean;
  };
  avatars: IAvatar[];
  climberImage?: string;
  speechBubble?: ISpeechBubbleConfig;
}

export interface IScrollItem {
  id: string;
  name: string;
  content: string;
}

export interface IModuleShadow {
  x: number;
  y: number;
  blur: number;
  opacity: number;
}

export interface ITickerGlass {
  backgroundColor: string;
  blur: number;
  innerBorderOpacity?: number;
}

export type AnnouncementTransition = 'cut' | 'fade' | 'slide' | 'zoom' | 'sword';

export interface IFloatModulePage {
  id: string;
  contentUrl: string;
  durationSeconds: number;
}

export interface IFloatModule {
  id: string;
  type: 'image' | 'video' | 'ticker';
  title: string;
  contentUrl: string;
  pages?: IFloatModulePage[];
  carouselTransition?: AnnouncementTransition;
  position: { x: number; y: number };
  size: { width: number; height: number };
  minimized: boolean;
  orientation: 'portrait' | 'landscape';
  scrollItems?: IScrollItem[];
  visibleRows?: number;
  tickerSpeed?: number;
  tickerFontSize?: number;
  glass?: ITickerGlass;
  shadow?: IModuleShadow;
}

export type PathStyle = 'dashed' | 'footprint' | 'dots' | 'wave' | 'solid' | 'arrow';

export interface IThemeConfig {
  mainTitle: string;
  subTitle: string;
  mainTitleColor: string;
  subTitleColor: string;
  mainTitleSize: number;
  subTitleSize: number;
  backgroundImage: string;
  backgroundVideo: string;
  pathStyle: PathStyle;
  pathColor: string;
  pathWidth: number;
  pathGlowEnabled: boolean;
  pathGlowColor: string;
  pathGlowDuration: number;
  pathGlowInterval: number;
  pathGlowBorderDuration: number;
  pathGlowBorderColorA: string;
  pathGlowBorderColorB: string;
  labelScale: number;
  labelFontScale: number;
  labelBgColor: string;
  labelBlur: number;
  labelBorderColor: string;
  labelTextColor: string;
  labelShowBorder: boolean;
  floatBgColor: string;
  floatBorderColor: string;
  speechBubblesEnabled: boolean;
  speechBubbleStyle: SpeechBubbleStyle;
  speechBubbleColor: string;
  speechBubbleTextColor: string;
  speechBubbleOpacity: number;
  speechBubbleScale: number;
  speechBubbleBlur: number;
  speechBubbleHoldSeconds: number;
  speechBubbleIntervalSeconds: number;
  speechBubbleMessagesTop: string[];
  speechBubbleMessagesNormal: string[];
}

export interface IRankingState {
  departments: IDepartment[];
  floatModules: IFloatModule[];
  theme: IThemeConfig;
  isEditMode: boolean;
  isManualMode: boolean;
}
