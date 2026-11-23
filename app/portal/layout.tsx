import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { Poppins } from 'next/font/google';
import { portalCookieValid, portalLoginConfigured } from '@/lib/portal-rocha-auth';
import './portal.css';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });

export const metadata: Metadata = { title: 'Portal Comercial Rocha', robots: { index:false, follow:false, nocache:true } };
export const dynamic = 'force-dynamic';

export default async function PortalLayout({children}:{children:React.ReactNode}) {
  const cookie=(await headers()).get('cookie');
  if(!portalCookieValid(cookie)) return <main className={`rocha-portal-login ${poppins.className}`}>
    <div className="r79-login-logo"><img src="/rocha-logo.png" width={200} alt="Rocha Empreendimentos" /></div>
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
  return <div className={`rocha-portal r79-shell ${poppins.className}`}>
    <aside className="r79-sidebar" aria-label="Navegação lateral da plataforma">
      <Link href="/portal" className="r79-side-brand">
        <div className="r79-logo-dark"><img src="/rocha-logo.png" width={190} alt="Rocha Empreendimentos" /></div>
        <span>PORTAL COMERCIAL</span>
      </Link>
      <div className="r79-nav-title">PAINEL</div>
      <nav className="r79-side-nav" aria-label="Ferramentas Rocha">
        <Link href="/portal">Visão geral</Link>
        <Link href="/portal/central">Central dos empreendimentos</Link>
        <Link href="/portal/gestao">Cadastro de empreendimentos</Link>
        <Link href="/portal/biblioteca">Biblioteca de materiais</Link>
        <Link href="/portal/tarefas">Tarefas da equipe</Link>
        <Link href="/portal/simulador">Simulador de entrada</Link>
      </nav>
      <div className="r79-sidebar-bottom">
        <div className="r79-sidebar-privacy"><strong>GESTÃO DE ACESSOS</strong><p>Somente o proprietário poderá criar ou excluir contas da equipe Rocha após a implantação da autenticação individual.</p></div>
        <form action="/api/portal/logout" method="post"><button type="submit">Sair do portal</button></form>
      </div>
    </aside>
    <div className="r79-workspace">
      <header className="r79-toolbar">
        <details className="r79-mobile-menu"><summary aria-label="Abrir menu de navegação">☰ Menu</summary>
          <nav aria-label="Ferramentas Rocha no celular">
            <Link href="/portal">Visão geral</Link>
            <Link href="/portal/central">Central dos empreendimentos</Link>
            <Link href="/portal/gestao">Cadastro de empreendimentos</Link>
            <Link href="/portal/biblioteca">Biblioteca de materiais</Link>
            <Link href="/portal/tarefas">Tarefas da equipe</Link>
            <Link href="/portal/simulador">Simulador de entrada</Link>
          </nav>
        </details>
        <strong>ROCHA <span>/</span> PORTAL COMERCIAL</strong>
        <form action="/api/portal/logout" method="post"><button type="submit">Sair</button></form>
      </header>
      <main className="rocha-portal-main">{children}</main>
      <footer className="rocha-portal-foot">ROCHA · ÁREA DE DEMONSTRAÇÃO · ARQUIVOS LOCAIS AO NAVEGADOR · CORRETORES SEM ACESSO NESTA ETAPA</footer>
    </div>
  </div>;
}
