export interface IAvatar {
  id: string;
  deptId: string;
  imageUrl: string;
  offsetX: number;
  offsetY: number;
}

export interface IDepartment {
  id: string;
  name: string;
  count: number;
  unit: string;
  position: {
    x: number;
    y: number;
    isManual: boolean;
  };
  avatars: IAvatar[];
  climberImage?: string;
}

export interface IFloatModule {
  id: string;
  type: 'image' | 'video';
  title: string;
  contentUrl: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  minimized: boolean;
  orientation: 'portrait' | 'landscape';
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
  labelBgColor: string;
  labelBorderColor: string;
  labelTextColor: string;
  labelShowBorder: boolean;
  floatBgColor: string;
  floatBorderColor: string;
}

export interface IRankingState {
  departments: IDepartment[];
  floatModules: IFloatModule[];
  theme: IThemeConfig;
  isEditMode: boolean;
  isManualMode: boolean;
}
