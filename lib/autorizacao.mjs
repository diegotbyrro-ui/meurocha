// Referencia unica e conservadora de permissao. Nenhuma verificacao de credenciais
// e feita aqui: o chamador devera validar a sessao no servidor ANTES de consultar.
const capacidades = Object.freeze({
  visitante: ['site:ler'],
  corretor: ['site:ler', 'biblioteca:ler-liberado', 'simulacao:criar'],
  marketing: ['site:ler', 'biblioteca:ler-liberado', 'biblioteca:rascunho'],
  comercial: ['site:ler', 'biblioteca:ler-liberado', 'simulacao:criar', 'convite:gerir'],
  administrador: ['site:ler', 'biblioteca:ler-liberado', 'biblioteca:rascunho', 'simulacao:criar', 'convite:gerir', 'site:publicar', 'acessos:gerir'],
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
