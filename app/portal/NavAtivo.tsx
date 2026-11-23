'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// R83: marca no menu a página atual (aria-current) e fecha o menu do celular
// depois de navegar. Os links continuam no layout (servidor); aqui só ajustamos atributos.
export default function NavAtivo() {
  const pathname = usePathname() || '/portal';
  useEffect(() => {
    const links = document.querySelectorAll<HTMLAnchorElement>('.r83-nav a[href^="/portal"]');
    links.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const ativo = href === '/portal' ? pathname === '/portal' : pathname === href || pathname.startsWith(`${href}/`);
      if (ativo) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.querySelectorAll<HTMLDetailsElement>('.r79-mobile-menu[open]').forEach((menu) => { menu.open = false; });
  }, [pathname]);
  return null;
}
