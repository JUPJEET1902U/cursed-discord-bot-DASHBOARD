export interface ServerAppearanceProfile {
  avatarUrl: string | null;
  bannerUrl: string | null;
  globalAvatarUrl: string | null;
  globalBannerUrl: string | null;
  customAvatarUrl: string | null;
  customBannerUrl: string | null;
  bio: string | null;
  hasCustomAvatar: boolean;
  hasCustomBanner: boolean;
  hasCustomBio: boolean;
  hasCustomAppearance: boolean;
}

export interface ServerAppearanceLimits {
  bioMaxLength: number;
  localUploadBytes: number;
  remoteImageBytes: number;
  acceptedTypes: string[];
}

export interface ServerAppearanceData {
  premium: boolean;
  profile: ServerAppearanceProfile;
  limits: ServerAppearanceLimits;
}

export interface ServerAppearanceUpdate {
  avatar?: string | null;
  banner?: string | null;
  bio?: string | null;
}
