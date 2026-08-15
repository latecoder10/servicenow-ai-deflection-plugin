export type SettingType = 'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN';

export interface PlatformSetting {
  key: string;
  label: string;
  description: string;
  type: SettingType;
  /** Effective value: the stored override when there is one, otherwise the environment default. */
  value: string | null;
  /** What the environment supplies, shown so an admin can see what reset would restore. */
  defaultValue: string | null;
  /** True when an override row exists, i.e. this differs from the deployed configuration. */
  overridden: boolean;
  /** Spring binds these at startup, so a change only applies after a restart. */
  restartRequired: boolean;
}

export interface SettingsCategory {
  category: string;
  settings: PlatformSetting[];
}

export interface SettingsResponse {
  categories: SettingsCategory[];
  settingCount: number;
  overriddenCount: number;
  note: string;
}

export interface SettingsUpdateResponse {
  status: string;
  updated: number;
  restartRequired: string[];
  message: string;
}
