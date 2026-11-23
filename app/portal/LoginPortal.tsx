'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icone from './ui/Icone';
import { UFS } from '@/lib/portal-acesso.mjs';

// R85 - Tela de entrada: corretor (só CRECI + UF; cadastro no primeiro acesso) ou equipe Rocha (e-mail e senha).
type Modo = 'corretor' | 'equipe';

const AVISOS: Record<string, string> = {
  'login-invalido': 'E-mail ou senha não conferem. Confira e tente de novo.',
  'equipe-inativa': 'Seu acesso da equipe está desativado. Fale com a diretoria.',
  'creci-invalido': 'Confira o número do CRECI e a UF.',
  'corretor-bloqueado': 'Este CRECI está bloqueado no portal. Fale com a equipe Rocha.',
  'muitas-tentativas': 'Muitas tentativas seguidas. Espere 15 minutos e tente de novo.',
  'sem-configuracao': 'O portal ainda está sendo configurado no servidor. Tente mais tarde.',
  'erro-servidor': 'Não conseguimos entrar agora. Tente de novo em instantes.',
};

export default function LoginPortal({ configurado }: { configurado: boolean }) {
  const [modo, setModo] = useState<Modo>('corretor');
  const [aviso, setAviso] = useState('');
  const [primeiro, setPrimeiro] = useState<{ creci: string; uf: string } | null>(null);
  const [uf, setUf] = useState('AL');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const a = q.get('aviso') || '';
    if (a === 'primeiro-acesso' || a === 'cadastro-invalido') {
      setPrimeiro({ creci: (q.get('creci') || '').slice(0, 10), uf: (q.get('uf') || '').slice(0, 2) });
      if (a === 'cadastro-invalido') setAviso((q.get('msg') || 'Confira os dados do cadastro.').slice(0, 160));
    } else if (AVISOS[a]) {
      setAviso(AVISOS[a]);
      if (a === 'login-invalido' || a === 'equipe-inativa') setModo('equipe');
    }
  }, []);

  if (!configurado) return <div className="r85-login-card"><p className="r85-aviso" role="alert">{AVISOS['sem-configuracao']}</p></div>;

  if (primeiro) return <div className="r85-login-card">
    <h2>Primeiro acesso: complete seu cadastro</h2>
    <p className="r85-ajuda">É só desta vez. Nas próximas, você entra só com o CRECI.</p>
    {aviso ? <p className="r85-aviso" role="alert"><Icone nome="alerta" tamanho={18} /> {aviso}</p> : null}
    <form method="post" action="/api/portal/corretor" className="r85-form">
      <input type="hidden" name="cadastro" value="1" />
      <input type="hidden" name="creci" value={primeiro.creci} />
      <input type="hidden" name="uf" value={primeiro.uf} />
      <p className="r85-creci-fixo"><Icone nome="cartao" tamanho={18} /> CRECI <strong>{primeiro.creci}/{primeiro.uf}</strong> <button type="button" className="r85-link" onClick={() => { setPrimeiro(null); setAviso(''); }}>trocar</button></p>
      <label>Nome completo<input name="nome" required minLength={3} maxLength={100} autoComplete="name" /></label>
      <label>WhatsApp com DDD<input name="whatsapp" required inputMode="tel" placeholder="(82) 99999-9999" autoComplete="tel" /></label>
      <label>Imobiliária <span className="r85-opcional">(opcional)</span><input name="imobiliaria" maxLength={100} autoComplete="organization" /></label>
      <label>E-mail <span className="r85-opcional">(opcional)</span><input name="email" type="email" maxLength={120} autoComplete="email" /></label>
      <button type="submit" className="r84-btn r85-entrar">Concluir cadastro e entrar <Icone nome="setaDireita" tamanho={18} /></button>
    </form>
  </div>;

  return <div className="r85-login-card">
    <div className="r85-abas" role="tablist" aria-label="Como você quer entrar">
      <button type="button" role="tab" aria-selected={modo === 'corretor'} onClick={() => { setModo('corretor'); setAviso(''); }}><Icone nome="usuarios" tamanho={18} /> Sou corretor</button>
      <button type="button" role="tab" aria-selected={modo === 'equipe'} onClick={() => { setModo('equipe'); setAviso(''); }}><Icone nome="predio" tamanho={18} /> Sou da equipe Rocha</button>
    </div>
    {aviso ? <p className="r85-aviso" role="alert"><Icone nome="alerta" tamanho={18} /> {aviso}</p> : null}
    {modo === 'corretor' ? <form method="post" action="/api/portal/corretor" className="r85-form">
      <p className="r85-ajuda">Digite seu CRECI. Não precisa de senha.</p>
      <div className="r85-linha">
        <label className="r85-creci">Número do CRECI<input name="creci" required inputMode="numeric" maxLength={10} placeholder="Ex.: 12345" autoComplete="off" /></label>
        <label className="r85-uf">UF<select name="uf" value={uf} onChange={(e) => setUf(e.target.value)}>{UFS.map((u) => <option key={u} value={u}>{u}</option>)}</select></label>
      </div>
      <button type="submit" className="r84-btn r85-entrar">Entrar <Icone nome="setaDireita" tamanho={18} /></button>
      <p className="r85-ajuda r85-pequena">Primeira vez? Digite o CRECI e clique em Entrar. Vamos pedir seu nome e WhatsApp uma única vez.</p>
    </form> : <form method="post" action="/api/portal/login" className="r85-form">
      <label>E-mail<input name="email" type="email" required autoComplete="username" maxLength={120} /></label>
      <label>Senha<input name="senha" type="password" required autoComplete="current-password" maxLength={200} /></label>
      <button type="submit" className="r84-btn r85-entrar">Entrar <Icone nome="setaDireita" tamanho={18} /></button>
      <p className="r85-ajuda r85-pequena">Esqueceu a senha ou ainda não tem acesso? Peça para alguém da equipe Rocha na tela Equipe.</p>
    </form>}
    <p className="r85-ajuda r85-pequena"><Link href="/home">Voltar ao site</Link></p>
  </div>;
}
