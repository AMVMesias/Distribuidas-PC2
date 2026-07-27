export type SupportedLocale = 'es' | 'en';

export interface Dictionary {
  brand: { name: string; descriptor: string };
  nav: {
    home: string; how: string; benefits: string; roles: string;
    login: string; register: string;
  };
  hero: {
    eyebrow: string; titleA: string; titleAccent: string;
    copy: string; primary: string; secondary: string;
  };
  how: { eyebrow: string; title: string; copy: string; steps: string[] };
  benefits: { eyebrow: string; title: string; copy: string; items: string[] };
  roles: { eyebrow: string; title: string; copy: string; items: string[] };
  cta: { title: string; copy: string; primary: string; secondary: string };
  auth: {
    loginTitle: string; loginCopy: string; registerTitle: string;
    registerCopy: string; username: string; password: string;
    submitLogin: string; submitRegister: string; noAccount: string;
    hasAccount: string; back: string;
  };
  portal: {
    dashboard: string; zones: string; vehicles: string; tickets: string;
    operation: string; users: string; assignments: string; roles: string;
    profile: string; danger: string; logout: string; menu: string;
  };
}
