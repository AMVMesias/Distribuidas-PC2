import {
  CarFront, CircleUserRound, ClipboardList, Gauge, KeyRound,
  LayoutDashboard, Map, ShieldAlert, TicketCheck, UsersRound,
} from 'lucide-react';
import { UserRole } from '@/entities/user/model/user.types';

export interface PortalNavItem {
  slug: string;
  labelKey: 'dashboard' | 'zones' | 'vehicles' | 'tickets' | 'operation' | 'users' | 'assignments' | 'roles' | 'profile' | 'danger';
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
}

export const portalNavigation: PortalNavItem[] = [
  { slug: '', labelKey: 'dashboard', icon: LayoutDashboard },
  { slug: 'zonas', labelKey: 'zones', icon: Map },
  { slug: 'vehiculos', labelKey: 'vehicles', icon: CarFront },
  { slug: 'tickets', labelKey: 'tickets', icon: TicketCheck },
  { slug: 'operacion', labelKey: 'operation', icon: Gauge, roles: ['RECAUDADOR', 'ADMIN', 'ROOT'] },
  { slug: 'usuarios', labelKey: 'users', icon: UsersRound, roles: ['ADMIN', 'ROOT'] },
  { slug: 'asignaciones', labelKey: 'assignments', icon: ClipboardList, roles: ['CLIENTE', 'ADMIN', 'ROOT'] },
  { slug: 'roles', labelKey: 'roles', icon: KeyRound, roles: ['ADMIN', 'ROOT'] },
  { slug: 'perfil', labelKey: 'profile', icon: CircleUserRound },
  { slug: 'peligro', labelKey: 'danger', icon: ShieldAlert, roles: ['ROOT'] },
];
