import Link from 'next/link';
import Sidebar from './Sidebar';
import {Icon} from '@/lib/visual-icons';
export const dynamic = 'force-dynamic';
export default function LayoutPlataforma({children}:{children:React.ReactNode}){
  // Gate temporario: a interface administrativa nunca eh exibida na build de producao
  // sem autenticação real implantada e revisada no banco correto.
  if (process.env.NODE_ENV === 'production' || process.env.ROCHA_PREVIEW_MODE !== 'true') {
    return <main className="blocked"><div className="blocked-icon"><Icon name="lock" size={27}/></div><span className="eyebrow">ÁREA RESTRITA · ROCHA</span><h1>Plataforma indisponível</h1><p>O painel estará disponível após a implantação do sistema de autenticação e permissões. Nenhum dado interno é exibido neste ambiente.</p><Link className="btn-primary" href="https://meurocha.com.br/home">Voltar ao site oficial <Icon name="arrow" size={16}/></Link></main>;
  }
  return <Sidebar>{children}</Sidebar>;
}
