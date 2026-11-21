// Matriz conservadora de papeis/capacidades (POLITICA, NAO AUTENTICACAO).
// A permissao deve ser aplicada em APIs e no banco, a partir de uma sessao
// validada NO SERVIDOR. NUNCA usar perfil declarado pelo cliente ou user_metadata.
const capacidades = Object.freeze({
  visitante: ['site:ler'],
  corretor: ['site:ler', 'empreendimento:ler-publicado', 'biblioteca:ler-liberado', 'simulacao:criar'],
  marketing: ['site:ler', 'empreendimento:ler-publicado', 'empreendimento:rascunho', 'midia:rascunho', 'biblioteca:ler-liberado', 'biblioteca:rascunho'],
  comercial: ['site:ler', 'empreendimento:ler-publicado', 'empreendimento:rascunho', 'midia:rascunho', 'biblioteca:ler-liberado', 'biblioteca:rascunho', 'simulacao:criar', 'convite:gerir'],
  administrador: ['site:ler', 'empreendimento:ler-publicado', 'empreendimento:rascunho', 'empreendimento:publicar', 'midia:rascunho', 'midia:publicar', 'biblioteca:ler-liberado', 'biblioteca:rascunho', 'simulacao:criar', 'convite:gerir', 'site:publicar', 'acessos:gerir'],
});
export function temPermissao(perfil, acao) {
  if (typeof perfil !== 'string' || typeof acao !== 'string') return false;
  return (capacidades[perfil] || []).includes(acao);
}
export function acessoMaterial(perfil, visibilidade, publicado) {
  if (publicado !== true || !temPermissao(perfil, 'biblioteca:ler-liberado')) return false;
  if (visibilidade === 'corretor') return ['corretor','comercial','marketing','administrador'].includes(perfil);
  if (visibilidade === 'interno') return ['comercial','administrador'].includes(perfil);
  return false; // sem arquivo publico ou perfil desconhecido por padrao
}
