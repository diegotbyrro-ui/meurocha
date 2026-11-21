import Link from 'next/link';
const cards=[
 {href:'/portal/gestao',titulo:'Empreendimentos e fotos',rotulo:'EQUIPE ROCHA',desc:'Rascunhos de cadastro e organização de imagens, sem publicação automática.'},
 {href:'/portal/biblioteca',titulo:'Biblioteca de materiais',rotulo:'ACERVO',desc:'Categorias de arquivos comerciais por perfil; os materiais reais continuam bloqueados.'},
 {href:'/portal/simulador',titulo:'Simulador demonstrativo',rotulo:'FINANCIAMENTO',desc:'Conferência de valores de proposta e saldo, sem taxas bancárias inventadas.'},
];
export default function PortalIndex(){return <>
  <section className="rocha-portal-hero"><span>ROCHA · PLATAFORMA COMERCIAL</span><h1>Um lugar para conectar empreendimentos, materiais e negócios.</h1>
    <p>Estamos integrando o portal da equipe à presença digital da Rocha. Esta fase preserva integralmente a experiência Easy Rota do Mar.</p>
    <Link href="/portal/gestao">Organizar empreendimentos →</Link></section>
  <section className="rocha-portal-cards">{cards.map((c,i)=><Link key={c.href} href={c.href} className="rocha-portal-card"><span>0{i+1} / {c.rotulo}</span><h2>{c.titulo}</h2><p>{c.desc}</p><strong>ACESSAR →</strong></Link>)}</section>
  <aside className="rocha-portal-notice">Primeira etapa: o cadastro de empreendimento usa apenas o armazenamento local deste navegador, sem banco, arquivos de produção, preços oficiais ou contas de corretores. A próxima fase será autenticação individual e Storage privado.</aside>
</>}
