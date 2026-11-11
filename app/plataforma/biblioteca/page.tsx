import { bibliotecaCategorias } from '@/lib/biblioteca.mjs';
import { empreendimentos } from '@/lib/catalog.mjs';
import {Icon,type IconName} from '@/lib/visual-icons';
function groupIcon(grupo:string):IconName{if(grupo==='Perspectivas')return 'image';if(grupo==='Audiovisual')return 'video';if(grupo==='Comercial')return 'calculator';if(grupo==='Projetos')return 'layers';if(grupo==='Documentação')return 'filetext';return 'folder';}
export default async function Biblioteca({searchParams}:{searchParams:Promise<{empreendimento?:string}>}) {
  const query=await searchParams;
  const escolhido=empreendimentos.find(e=>e.id===query.empreendimento);
  return <><div className="page-heading"><div><span className="eyebrow">CENTRAL DE CONTEÚDO</span><h1>Biblioteca digital</h1><p>{escolhido?`Materiais previstos para ${escolhido.nome}.`:'Todos os materiais comerciais, organizados por categoria.'}</p></div><span className="count-chip">{bibliotecaCategorias.length} categorias</span></div><div className="info-strip"><Icon name="shield" size={18}/><span>Os arquivos reais ainda não estão conectados. CNPJ, PIX, preços e materiais internos continuarão restritos.</span></div><div className="library-grid">{bibliotecaCategorias.map(c=><article className="library-item" key={c.id}><div className="library-item-top"><span className="library-symbol"><Icon name={groupIcon(c.grupo)} size={20}/></span><span className={'access-label '+(c.acesso==='interno'?'restricted':'')}>{c.acesso==='interno'?<Icon name="lock" size={12}/>:<Icon name="users" size={12}/>} {c.acesso==='interno'?'Equipe Rocha':'Corretor'}</span></div><small>{c.grupo.toUpperCase()}</small><h2>{c.nome}</h2><div className="library-meta"><span>Sem arquivos conectados</span><Icon name="arrow" size={16}/></div></article>)}</div></>;
}
