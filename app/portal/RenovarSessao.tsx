'use client';

import { useEffect } from 'react';

// R85 - Renova em segundo plano o login do corretor para ele nunca precisar entrar de novo.
export default function RenovarSessao() {
  useEffect(() => {
    void fetch('/api/portal/renovar', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
  }, []);
  return null;
}
