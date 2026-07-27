export type UserRole = 'CLIENTE' | 'RECAUDADOR' | 'ADMIN' | 'ROOT';

export interface Role {
  id: string;
  name: UserRole;
  description: string;
  active: boolean;
}

export interface Person {
  idUuid: string;
  active: boolean;
  dni: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  nationality?: string;
}

export interface User {
  idPerson: string;
  active: boolean;
  username: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  persona: Person;
  roles: Role[];
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface RegistrationData {
  persona: Omit<Person, 'idUuid' | 'active'>;
  password: string;
}
