// Interfaces para el sistema de configuraciones

export interface UserSettings {
  pushNotifications: boolean;
  promotionalEmails: boolean;
  theme?: 'light' | 'dark';
  language?: string;
}

export interface SettingChange {
  setting: string;
  value: any;
  timestamp: Date;
}

export interface NotificationPreferences {
  pushNotifications: boolean;
  promotionalEmails: boolean;
  appointmentReminders?: boolean;
  paymentNotifications?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

export interface SettingLink {
  id: string;
  label: string;
  description: string;
  action: 'navigate' | 'logout' | 'external';
  route?: string;
  url?: string;
  isDanger?: boolean;
}

export interface SettingsSection {
  id: string;
  title: string;
  icon: string;
  links?: SettingLink[];
  toggles?: ToggleSetting[];
}

export interface ToggleSetting {
  id: string;
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export interface FeedbackToast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}









