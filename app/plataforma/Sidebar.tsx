'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {Icon,type IconName} from '@/lib/visual-icons';
const grupos: {title:string,items:{href:string,label:string,icon:IconName}[]}[] = [
  { title: 'PAINEL', items: [
    {href:'/plataforma',label:'Visão geral',icon:'grid'},
    {href:'/plataforma/empreendimentos',label:'Empreendimentos',icon:'building'},
    {href:'/plataforma/biblioteca',label:'Biblioteca digital',icon:'files'},
    {href:'/plataforma/simulador',label:'Simulador',icon:'calculator'},
  ]},
  { title:'RELACIONAMENTO', items: [
    {href:'/plataforma/convites',label:'Convites Rocha',icon:'ticket'},
  ]},
];
const allItems=grupos.flatMap(g=>g.items);
export default function Sidebar({children}:{children:React.ReactNode}){
  const pathname=usePathname();
  const [opened,setOpened]=useState(false);
  const selected=allItems.find(x=>pathname===x.href)||allItems.find(x=>pathname.startsWith(x.href+'/'))||allItems[0];
  return <div className="shell">
    <button type="button" className="mobile-toggle" onClick={()=>setOpened(!opened)} aria-label={opened?'Fechar menu':'Abrir menu'} aria-expanded={opened} aria-controls="rocha-sidebar"><Icon name={opened?'close':'menu'}/></button>
    {opened&&<button aria-label="Fechar menu lateral" className="sidebar-scrim" onClick={()=>setOpened(false)}/>}
    <aside className={'sidebar'+(opened?' open':'')} id="rocha-sidebar">
      <Link href="/plataforma" className="side-brand" onClick={()=>setOpened(false)} aria-label="Rocha - Visão geral"><Image src="/rocha-logo.png" alt="ROCHA" width={216} height={68} priority/><span>PLATAFORMA COMERCIAL</span></Link>
      <div className="side-nav-area">
        {grupos.map(group=><div className="nav-group" key={group.title}><p className="side-heading">{group.title}</p><nav aria-label={group.title}>{group.items.map(item=>{
          const active=pathname===item.href||pathname.startsWith(item.href+'/');
          return <Link className={'nav-link'+(active?' active':'')} aria-current={active?'page':undefined} key={item.href} href={item.href} onClick={()=>setOpened(false)}><Icon name={item.icon} size={19}/><span>{item.label}</span>{active&&<span className="nav-active-dot"/>}</Link>;
        })}</nav></div>)}
        <div className="side-secondary"><p className="side-heading">ACESSOS</p><Link href="/corretor" onClick={()=>setOpened(false)}><Icon name="users" size={19}/> Portal do corretor <Icon name="external" size={14}/></Link><a href="https://meurocha.com.br/home" target="_blank" rel="noreferrer"><Icon name="external" size={19}/> Site institucional <Icon name="arrow" size={15}/></a></div>
      </div>
      <div className="side-bottom"><div className="side-bottom-icon"><Icon name="shield" size={18}/></div><div><strong>Ambiente de homologação</strong><p>Sem conexão com dados reais</p></div></div>
    </aside>
    <div className="workspace"><header className="topbar"><div className="crumb"><span>Plataforma</span><Icon name="chevron" size={14}/><strong>{selected.label}</strong></div><div className="topbar-right"><span className="preview-badge"><span/> AMBIENTE DE TESTES</span><div className="avatar" title="Prévia administrativa">R</div></div></header><main className="content">{children}</main><footer className="page-footer"><span>ROCHA <span className="footer-separator">/</span> Plataforma Comercial</span><span>Protótipo de interface · Sem dados de produção</span></footer></div>
  </div>;
}
