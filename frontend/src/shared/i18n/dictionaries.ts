import { Dictionary, SupportedLocale } from './types';

const es: Dictionary = {
  common: {
    welcome: 'Bienvenido a la aplicación Next.js',
    description: 'Sistema modular configurado con TypeScript y Tailwind CSS.',
    documentation: 'Documentación',
    deployNow: 'Desplegar Ahora',
  },
  navigation: {
    home: 'Inicio',
  },
};

const en: Dictionary = {
  common: {
    welcome: 'Welcome to the Next.js application',
    description: 'Modular system configured with TypeScript and Tailwind CSS.',
    documentation: 'Documentation',
    deployNow: 'Deploy Now',
  },
  navigation: {
    home: 'Home',
  },
};

const dictionaries: Record<SupportedLocale, Dictionary> = { es, en };

export const getDictionary = (locale: SupportedLocale): Dictionary => {
  return dictionaries[locale] || dictionaries.es;
};
