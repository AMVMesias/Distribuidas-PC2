import { Dictionary, SupportedLocale } from '@/shared/i18n/types';

const es: Dictionary = {
  brand: { name: 'Nexo Park', descriptor: 'Movilidad sin fricción' },
  nav: { home: 'Inicio', how: 'Cómo funciona', benefits: 'Beneficios', roles: 'Sedes', login: 'Iniciar sesión', register: 'Crear cuenta' },
  hero: {
    eyebrow: 'Una llegada tranquila empieza aquí',
    titleA: 'Tu parqueadero,',
    titleAccent: 'sin vueltas.',
    copy: 'Registra tu vehículo, consulta tus tickets y gestiona cada ingreso desde una experiencia clara y segura.',
    primary: 'Iniciar sesión',
    secondary: 'Crear mi cuenta',
  },
  how: {
    eyebrow: 'Simple desde el primer día', title: 'Todo fluye en cuatro pasos',
    copy: 'La plataforma conecta a clientes, recaudadores y administradores sin procesos innecesarios.',
    steps: ['Crea tu cuenta', 'Registra tu vehículo', 'Ingresa con tu placa', 'Consulta tu ticket'],
  },
  benefits: {
    eyebrow: 'Diseñado para dar confianza', title: 'Menos espera. Más claridad.',
    copy: 'Cada función resuelve una necesidad real del parqueadero y evita información que no aporta.',
    items: ['Acceso protegido', 'Operación rápida', 'Información consistente', 'Experiencia adaptable'],
  },
  roles: {
    eyebrow: 'Lugares para llegar mejor', title: 'Cada sede, una experiencia distinta',
    copy: 'Escenarios conceptuales que muestran cómo Nexo Park puede integrarse en diferentes zonas de la ciudad.',
    items: ['Alameda', 'Central', 'Ribera'],
  },
  cta: {
    title: 'Empieza con una experiencia más simple',
    copy: 'Crea una cuenta de cliente o accede con tus credenciales.',
    primary: 'Crear cuenta', secondary: 'Iniciar sesión',
  },
  auth: {
    loginTitle: 'Qué bueno verte', loginCopy: 'Accede a tu espacio de Nexo Park.',
    registerTitle: 'Crea tu cuenta', registerCopy: 'Registra tus datos para empezar como cliente.',
    username: 'Usuario', password: 'Contraseña', submitLogin: 'Entrar a mi cuenta',
    submitRegister: 'Crear mi cuenta', noAccount: '¿Aún no tienes cuenta?',
    hasAccount: '¿Ya tienes cuenta?', back: 'Volver al inicio',
  },
  portal: {
    dashboard: 'Resumen', zones: 'Zonas', vehicles: 'Vehículos', tickets: 'Tickets',
    operation: 'Operación', users: 'Usuarios', assignments: 'Asignaciones', roles: 'Roles',
    profile: 'Mi perfil', danger: 'Zona crítica', logout: 'Cerrar sesión', menu: 'Abrir menú',
  },
};

const en: Dictionary = {
  brand: { name: 'Nexo Park', descriptor: 'Frictionless mobility' },
  nav: { home: 'Home', how: 'How it works', benefits: 'Benefits', roles: 'Locations', login: 'Sign in', register: 'Create account' },
  hero: {
    eyebrow: 'A calm arrival starts here', titleA: 'Your parking,', titleAccent: 'without the detours.',
    copy: 'Register your vehicle, check tickets, and manage every entry through a clear and secure experience.',
    primary: 'Sign in', secondary: 'Create my account',
  },
  how: {
    eyebrow: 'Simple from day one', title: 'Everything flows in four steps',
    copy: 'The platform connects customers, collectors, and managers without unnecessary processes.',
    steps: ['Create your account', 'Register your vehicle', 'Enter with your plate', 'Check your ticket'],
  },
  benefits: {
    eyebrow: 'Designed for trust', title: 'Less waiting. More clarity.',
    copy: 'Every feature solves a real parking need and avoids information that adds no value.',
    items: ['Protected access', 'Fast operation', 'Consistent information', 'Adaptive experience'],
  },
  roles: {
    eyebrow: 'Places to arrive better', title: 'Each location, a different experience',
    copy: 'Conceptual settings showing how Nexo Park can fit into different areas of the city.',
    items: ['Alameda', 'Central', 'Riverside'],
  },
  cta: {
    title: 'Start with a simpler experience', copy: 'Create a customer account or sign in.',
    primary: 'Create account', secondary: 'Sign in',
  },
  auth: {
    loginTitle: 'Good to see you', loginCopy: 'Access your Nexo Park space.',
    registerTitle: 'Create your account', registerCopy: 'Register your details to start as a customer.',
    username: 'Username', password: 'Password', submitLogin: 'Enter my account',
    submitRegister: 'Create my account', noAccount: 'Don’t have an account yet?',
    hasAccount: 'Already have an account?', back: 'Back to home',
  },
  portal: {
    dashboard: 'Overview', zones: 'Zones', vehicles: 'Vehicles', tickets: 'Tickets',
    operation: 'Operations', users: 'Users', assignments: 'Assignments', roles: 'Roles',
    profile: 'My profile', danger: 'Critical zone', logout: 'Sign out', menu: 'Open menu',
  },
};

const dictionaries: Record<SupportedLocale, Dictionary> = { es, en };
export const getDictionary = (locale: SupportedLocale) => dictionaries[locale] ?? es;
