export type SupportedLocale = 'es' | 'en';

export interface Dictionary {
  common: {
    welcome: string;
    description: string;
    documentation: string;
    deployNow: string;
  };
  navigation: {
    home: string;
  };
}
