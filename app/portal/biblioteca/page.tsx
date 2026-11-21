import { bibliotecaCategorias } from '@/lib/biblioteca.mjs';
export const dynamic='force-dynamic';
export default function Biblioteca(){return <section className="rocha-portal-content">
  <span>ACERVO ROCHA · PROTÓTIPO SEGURO</span><h1>Biblioteca de materiais</h1>
  <p>Uma visão inicial das categorias de conteúdo. Nenhum arquivo está publicado ou disponível para download nesta etapa.</p>
  <div className="rocha-portal-cards rocha-portal-library">{bibliotecaCategorias.map(c=><article className="rocha-portal-card" key={c.id}>
  <span>{c.grupo}</span><h2>{c.nome}</h2><p>{c.acesso==='interno'?'Equipe Rocha · uso interno':'Previsto para corretores autorizados'}</p><strong>SEM ARQUIVOS CONECTADOS</strong></article>)}</div>
  <aside className="rocha-portal-notice">Próxima fase: integrar o banco correto, Storage privado, permissões por arquivo e aprovação da equipe Rocha.</aside>
</section>}
