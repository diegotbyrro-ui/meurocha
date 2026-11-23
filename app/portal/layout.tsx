import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { Poppins } from 'next/font/google';
import { portalCookieValid, portalLoginConfigured } from '@/lib/portal-rocha-auth';
import NavAtivo from './NavAtivo';
import Icone from './ui/Icone';
import './portal.css';
import './r83-tema.css';
import './r83-shell.css';
import './ui/ui.css';
import './r84-shell.css';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });

export const metadata: Metadata = { title: 'Portal Comercial Rocha', robots: { index:false, follow:false, nocache:true } };
export const dynamic = 'force-dynamic';

// R83: menu claro com descrição de cada área, para quem entra pela primeira vez.
// As classes r79-* continuam no markup por compatibilidade; o visual vem de r83-shell.css.
export default async function PortalLayout({children}:{children:React.ReactNode}) {
  const cookie=(await headers()).get('cookie');
  if(!portalCookieValid(cookie)) return <main className={`rocha-portal-login r83-login ${poppins.className}`}>
    <div className="r79-login-logo r83-login-logo"><img src="/rocha-logo-escuro.png" width={150} height={122} alt="Rocha Empreendimentos" /></div>
    <h1>Portal comercial</h1>
    <p>Entre para ver os dados de pagamento, os materiais de venda e o simulador de entrada dos empreendimentos Rocha.</p>
    {portalLoginConfigured()?<form method="post" action="/api/portal/login">
      <label htmlFor="rocha-portal-senha">Senha da equipe</label>
      <input name="senha" type="password" id="rocha-portal-senha" required autoComplete="current-password" minLength={16} aria-describedby="rocha-portal-senha-ajuda" />
      <small id="rocha-portal-senha-ajuda" className="r83-login-hint">Não sabe a senha? Peça ao responsável pelo portal na Rocha.</small>
      <button type="submit">Entrar</button>
    </form>:<div className="rocha-portal-indisponivel">O acesso ainda não foi configurado no servidor. Fale com o responsável técnico do portal.</div>}
    <small>Corretores terão login individual em uma próxima etapa. <Link href="/home">Voltar ao site</Link></small>
  </main>;
  return <div className={`rocha-portal r79-shell r83-shell ${poppins.className}`}>
    <a href="#conteudo" className="r83-pular">Pular para o conteúdo</a>
    <NavAtivo />
    <aside className="r79-sidebar r83-sidebar" aria-label="Menu do portal">
      <Link href="/portal" className="r83-brand" aria-label="Início do portal Rocha">
        <span className="r79-logo-dark r83-logo"><img src="/rocha-logo.png" width={150} height={49} alt="Rocha Empreendimentos" /></span>
        <span className="r83-brand-text"><strong>Portal comercial</strong></span>
      </Link>
      <nav className="r83-nav" aria-label="Áreas do portal">
        <p className="r83-nav-group">Dia a dia</p>
        <Link href="/portal" data-area="inicio"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="inicio" tamanho={18} /></span><span><strong>Início</strong><small>Por onde começar e avisos</small></span></Link>
        <Link href="/portal/central" data-area="central"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="predio" tamanho={18} /></span><span><strong>Central dos empreendimentos</strong><small>CNPJ, PIX, materiais e postagens</small></span></Link>
        <Link href="/portal/simulador" data-area="simulador"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="calculadora" tamanho={18} /></span><span><strong>Simulador de entrada</strong><small>Monte e imprima a proposta</small></span></Link>
        <Link href="/portal/tarefas" data-area="tarefas"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="tarefas" tamanho={18} /></span><span><strong>Tarefas da equipe</strong><small>O que fazer e até quando</small></span></Link>
        <p className="r83-nav-group">Manutenção</p>
        <Link href="/portal/atualizar" data-area="atualizar"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="editar" tamanho={18} /></span><span><strong>Atualizar conteúdo</strong><small>Cadastrar CNPJ, PIX e links</small></span></Link>
        <Link href="/portal/biblioteca" data-area="biblioteca"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="pasta" tamanho={18} /></span><span><strong>Biblioteca de arquivos</strong><small>Arquivos só deste computador</small></span></Link>
        <Link href="/portal/gestao" data-area="cadastro"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="cadastro" tamanho={18} /></span><span><strong>Cadastro de empreendimentos</strong><small>Rascunhos e fotos</small></span></Link>
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
            <Link href="/portal/tarefas" data-area="tarefas"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="tarefas" tamanho={18} /></span><strong>Tarefas da equipe</strong></Link>
            <Link href="/portal/atualizar" data-area="atualizar"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="editar" tamanho={18} /></span><strong>Atualizar conteúdo</strong></Link>
            <Link href="/portal/biblioteca" data-area="biblioteca"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="pasta" tamanho={18} /></span><strong>Biblioteca de arquivos</strong></Link>
            <Link href="/portal/gestao" data-area="cadastro"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="cadastro" tamanho={18} /></span><strong>Cadastro de empreendimentos</strong></Link>
            <Link href="/portal/ajuda" data-area="ajuda"><span className="r84-icone-bloco r84-icone-bloco-cheio" aria-hidden="true"><Icone nome="ajuda" tamanho={18} /></span><strong>Ajuda</strong></Link>
          </nav>
        </details>
        <span className="r83-topbar-title">Rocha Empreendimentos · Portal comercial</span>
        <div className="r83-topbar-actions">
          <Link href="/portal/ajuda" className="r83-topbar-help"><Icone nome="pergunta" tamanho={18} /> Ajuda</Link>
          <form action="/api/portal/logout" method="post"><button type="submit">Sair</button></form>
        </div>
      </header>
      <main id="conteudo" className="rocha-portal-main" tabIndex={-1}>{children}</main>
      <footer className="rocha-portal-foot">Rocha Empreendimentos · Uso interno da equipe comercial · Os arquivos da Biblioteca ficam só no navegador de quem enviou.</footer>
    </div>
  </div>;
}
