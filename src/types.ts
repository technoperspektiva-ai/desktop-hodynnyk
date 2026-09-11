export type DisplayMode = "new-tab" | "same-tab";

export type AppAction = {
  id: string;
  label: string;
  url: string;
};

export type DesktopApp = {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
  icon: string;
  iconType: "emoji" | "url";
  accent: string;
  coverUrl: string;
  displayMode: DisplayMode;
  isPinned: boolean;
  isVisible: boolean;
  sortOrder: number;
  widgetEndpoint: string;
  actions: AppAction[];
  createdAt?: string;
  updatedAt?: string;
};

export type DesktopSettings = {
  title: string;
  subtitle: string;
  wallpaper: "aurora" | "sunset" | "midnight" | "paper";
  glass: "soft" | "clear";
  compact: boolean;
};

export type Page = "home" | "apps" | "settings";
