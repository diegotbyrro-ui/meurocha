import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { Poppins } from 'next/font/google';
import { lerSessao, portalCookieValid, portalLoginConfigured, precisaRenovar } from '@/lib/portal-rocha-auth';
import { pessoaAtiva } from '@/lib/portal-corretor-status';
import { formatarCreci, nomeSetor } from '@/lib/portal-acesso.mjs';
import NavAtivo from './NavAtivo';
import LoginPortal from './LoginPortal';
import RenovarSessao from './RenovarSessao';
import Icone from './ui/Icone';
import './portal.css';
import './r83-tema.css';
import './r83-shell.css';
import './ui/ui.css';
import './r84-shell.css';
import './r85-acesso.css';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });

export const metadata: Metadata = { title: 'Portal Comercial Rocha', robots: { index:false, follow:false, nocache:true } };
export const dynamic = 'force-dynamic';

// R85: quem entrou define o menu. Corretor (CRECI) vê Início, Central, Simulador e Ajuda.
// Equipe Rocha (e-mail e senha) vê tudo. As páginas da equipe também conferem no servidor (exigirEquipe).
export default async function PortalLayout({children}:{children:React.ReactNode}) {
  const cookie=(await headers()).get('cookie');
  if(!portalCookieValid(cookie)) return <main className={`rocha-portal-login r83-login r85-login ${poppins.className}`}>
    <section className="r85-login-marca">
      <div className="r79-login-logo r83-login-logo"><img src="/rocha-logo.png" width={180} height={59} alt="Rocha Empreendimentos" /></div>
      <h1>Portal comercial</h1>
      <p>Materiais de venda, dados de pagamento e o simulador de entrada dos empreendimentos Rocha, num lugar só.</p>
      <ul>
        <li><Icone nome="imagens" tamanho={20} /> Fotos, plantas, vídeos e book</li>
        <li><Icone nome="cartao" tamanho={20} /> CNPJ e PIX de cada empreendimento</li>
        <li><Icone nome="calculadora" tamanho={20} /> Simulador de entrada com proposta impressa</li>
      </ul>
    </section>
    <section className="r85-login-form"><LoginPortal configurado={portalLoginConfigured()} /></section>
  </main>;
  const sessao = lerSessao(cookie)!;
  const equipe = sessao.t === 'equipe';
  const quem = equipe ? nomeSetor(sessao.setor) : formatarCreci(sessao.creci, sessao.uf);
  if (!(await pessoaAtiva(sessao.t, sessao.id))) return <main className={`rocha-portal-login r83-login r85-login r85-bloqueado ${poppins.className}`}>
    <section className="r85-login-form"><div className="r85-login-card">
      <h2>Acesso bloqueado</h2>
      <p className="r85-ajuda">{equipe ? 'Seu acesso da equipe foi desativado. Fale com a diretoria.' : `O acesso do ${quem} ao portal foi bloqueado pela equipe Rocha. Se acha que é um engano, fale com a equipe comercial.`}</p>
      <form action="/api/portal/logout" method="post"><button type="submit" className="r85-entrar">Sair</button></form>
    </div></section>
  </main>;
  return <div className={`rocha-portal r79-shell r83-shell ${equipe ? 'r85-equipe' : 'r85-corretor'} ${poppins.className}`}>
    <a href="#conteudo" className="r83-pular">Pular para o conteúdo</a>
    <NavAtivo />
    {precisaRenovar(sessao) ? <RenovarSessao /> : null}
    <aside className="r79-sidebar r83-sidebar" aria-label="Menu do portal">
      <Link href="/portal" className="r83-brand" aria-label="Início do portal Rocha">
        <span className="r79-logo-dark r83-logo"><img src="/rocha-logo.png" width={150} height={49} alt="Rocha Empreendimentos" /></span>
        <span className="r83-brand-text"><strong>Portal comercial</strong></span>
      </Link>
      <div className="r85-quem"><strong>{sessao.nome}</strong><small>{quem}</small></div>
      <nav className="r83-nav" aria-label="Áreas do portal">
        <p className="r83-nav-group">Dia a dia</p>
        <Link href="/portal" data-area="inicio"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="inicio" tamanho={18} /></span><span><strong>Início</strong><small>Por onde começar e avisos</small></span></Link>
        <Link href="/portal/central" data-area="central"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="predio" tamanho={18} /></span><span><strong>Central dos empreendimentos</strong><small>CNPJ, PIX, materiais e postagens</small></span></Link>
        <Link href="/portal/simulador" data-area="simulador"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="calculadora" tamanho={18} /></span><span><strong>Simulador de entrada</strong><small>Monte e imprima a proposta</small></span></Link>
        {equipe ? <>
          <Link href="/portal/tarefas" data-area="tarefas"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="tarefas" tamanho={18} /></span><span><strong>Tarefas da equipe</strong><small>Quem faz o quê e até quando</small></span></Link>
          <p className="r83-nav-group">Gestão do portal</p>
          <Link href="/portal/atualizar" data-area="atualizar"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="editar" tamanho={18} /></span><span><strong>Atualizar conteúdo</strong><small>CNPJ, PIX, links e postagens</small></span></Link>
          <Link href="/portal/corretores" data-area="central"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="usuarios" tamanho={18} /></span><span><strong>Corretores</strong><small>Cadastrados, acessos e bloqueios</small></span></Link>
          <Link href="/portal/equipe" data-area="cadastro"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="chaves" tamanho={18} /></span><span><strong>Equipe Rocha</strong><small>Logins da diretoria e marketing</small></span></Link>
          <Link href="/portal/biblioteca" data-area="biblioteca"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="pasta" tamanho={18} /></span><span><strong>Biblioteca de arquivos</strong><small>Arquivos só deste computador</small></span></Link>
          <Link href="/portal/gestao" data-area="cadastro"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="cadastro" tamanho={18} /></span><span><strong>Cadastro de empreendimentos</strong><small>Rascunhos e fotos</small></span></Link>
        </> : null}
        <Link href="/portal/ajuda" data-area="ajuda"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="ajuda" tamanho={18} /></span><span><strong>Ajuda</strong><small>Dúvidas frequentes e glossário</small></span></Link>
      </nav>
      <form action="/api/portal/logout" method="post" className="r83-sair"><button type="submit"><Icone nome="sair" tamanho={18} /> Sair do portal</button></form>
    </aside>
    <div className="r79-workspace r83-workspace">
      <header className="r79-toolbar r83-topbar">
        <details className="r79-mobile-menu r83-mobile-menu"><summary><Icone nome="menu" tamanho={20} /> Menu</summary>
          <nav className="r83-nav" aria-label="Áreas do portal no celular">
            <Link href="/portal" data-area="inicio"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="inicio" tamanho={18} /></span><strong>Início</strong></Link>
            <Link href="/portal/central" data-area="central"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="predio" tamanho={18} /></span><strong>Central dos empreendimentos</strong></Link>
            <Link href="/portal/simulador" data-area="simulador"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="calculadora" tamanho={18} /></span><strong>Simulador de entrada</strong></Link>
            {equipe ? <>
              <Link href="/portal/tarefas" data-area="tarefas"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="tarefas" tamanho={18} /></span><strong>Tarefas da equipe</strong></Link>
              <Link href="/portal/atualizar" data-area="atualizar"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="editar" tamanho={18} /></span><strong>Atualizar conteúdo</strong></Link>
              <Link href="/portal/corretores" data-area="central"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="usuarios" tamanho={18} /></span><strong>Corretores</strong></Link>
              <Link href="/portal/equipe" data-area="cadastro"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="chaves" tamanho={18} /></span><strong>Equipe Rocha</strong></Link>
              <Link href="/portal/biblioteca" data-area="biblioteca"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="pasta" tamanho={18} /></span><strong>Biblioteca de arquivos</strong></Link>
              <Link href="/portal/gestao" data-area="cadastro"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="cadastro" tamanho={18} /></span><strong>Cadastro de empreendimentos</strong></Link>
            </> : null}
            <Link href="/portal/ajuda" data-area="ajuda"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="ajuda" tamanho={18} /></span><strong>Ajuda</strong></Link>
          </nav>
        </details>
        <span className="r83-topbar-title">Olá, {sessao.nome.split(' ')[0]} · {quem}</span>
        <div className="r83-topbar-actions">
          <Link href="/portal/ajuda" className="r83-topbar-help"><Icone nome="pergunta" tamanho={18} /> Ajuda</Link>
          <form action="/api/portal/logout" method="post"><button type="submit">Sair</button></form>
        </div>
      </header>
      <main id="conteudo" className="rocha-portal-main" tabIndex={-1}>{children}</main>
      <footer className="rocha-portal-foot">Rocha Empreendimentos · Portal comercial · {equipe ? 'Acesso da equipe Rocha' : 'Acesso de corretor parceiro'}</footer>
    </div>
  </div>;
}
