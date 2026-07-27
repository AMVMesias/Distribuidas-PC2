'use client';

import { Role, User } from '@/entities/user/model/user.types';
import { StatusBadge } from '@/shared/components/StatusBadge';

export function UserDetail({ user, roles, assign, remove }: {
  user: User; roles: Role[]; assign: (roleId: string) => void; remove: (roleId: string) => void;
}) {
  const assigned = new Set(user.roles.filter(role => role.active).map(role => role.id));
  return (
    <div className="grid gap-6">
      <dl className="grid gap-3 sm:grid-cols-2">
        {[['Usuario', user.username], ['Documento', user.persona.dni], ['Correo', user.persona.email], ['Teléfono', user.persona.phone || 'Sin registrar']].map(([label, value]) => <div key={label} className="soft-card p-4"><dt className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{label}</dt><dd className="mt-2 font-medium">{value}</dd></div>)}
      </dl>
      <section>
        <h3 className="font-semibold">Roles asignados</h3>
        <div className="mt-3 grid gap-2">
          {roles.filter(role => role.active).map(role => (
            <div key={role.id} className="flex items-center justify-between rounded-xl border p-3">
              <div><StatusBadge status={role.name} /><p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>{role.description}</p></div>
              {assigned.has(role.id)
                ? <button className="text-xs font-semibold text-red-500" onClick={() => remove(role.id)}>Quitar</button>
                : <button className="text-xs font-semibold text-[var(--brand)]" onClick={() => assign(role.id)}>Asignar</button>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
