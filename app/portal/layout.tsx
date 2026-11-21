import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { portalCookieValid, portalLoginConfigured } from '@/lib/portal-rocha-auth';
import './portal.css';

export const metadata: Metadata = { title: 'Portal Comercial Rocha', robots: { index:false, follow:false, nocache:true } };
export const dynamic = 'force-dynamic';

export default async function PortalLayout({children}:{children:React.ReactNode}) {
  const cookie=(await headers()).get('cookie');
  if(!portalCookieValid(cookie)) return <main className="rocha-portal-login">
    <img src="/rocha-logo.png" width={180} alt="Rocha Empreendimentos" />
    <span>ACESSO RESERVADO · EQUIPE ROCHA</span>
    <h1>Portal comercial</h1>
    <p>Materiais, empreendimentos e simulador comercial em um só lugar. Nesta primeira etapa, somente usuários autorizados pela Rocha podem entrar.</p>
    {portalLoginConfigured()?<form method="post" action="/api/portal/login">
      <label htmlFor="rocha-portal-senha">Senha de acesso da equipe</label>
      <input name="senha" type="password" id="rocha-portal-senha" required autoComplete="current-password" minLength={16} />
      <button type="submit">Entrar no portal</button>
    </form>:<div className="rocha-portal-indisponivel">Acesso aguardando configuração das credenciais no servidor. Nenhum cadastro ou arquivo está exposto.</div>}
    <small>Acesso de corretores com credenciais individuais será liberado após integração segura. <Link href="/home">Voltar</Link></small>
  </main>;
  return <div className="rocha-portal">
    <header className="rocha-portal-top"><Link className="rocha-portal-brand" href="/portal"><img src="/rocha-logo.png" width={145} alt="Rocha Empreendimentos" /><span>PORTAL COMERCIAL</span></Link>
      <nav aria-label="Navegação"><Link href="/portal">Início</Link><Link href="/portal/gestao">Empreendimentos</Link><Link href="/portal/biblioteca">Biblioteca</Link><Link href="/portal/simulador">Simulador</Link></nav>
      <form action="/api/portal/logout" method="post"><button type="submit">Sair</button></form>
    </header>
    <main className="rocha-portal-main">{children}</main>
    <footer className="rocha-portal-foot">ROCHA · PRIMEIRA ETAPA · DADOS DE DEMONSTRAÇÃO · CORRETORES AINDA SEM ACESSO</footer>
  </div>;
}
