import { PortalShell } from '@/widgets/PortalShell/PortalShell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
