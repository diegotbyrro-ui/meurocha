// Contratos do modo de previa LOCAL, sem conexao com Supabase.
// A aprovacao em producao dependera de login real, RLS e Storage privado.
export const ESTADOS_PROJETO = Object.freeze([
  'Planejamento', 'Pre-lancamento', 'Lancamento', 'Em obras', 'Concluido',
]);
export const MAX_FOTOS_PREVIA = 3;
export const MAX_BYTES_IMAGEM_PREVIA = 500 * 1024;
export const MAX_PROJETOS_PREVIA = 30;
export const MIME_FOTOS_ACEITOS = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);

export function textoSeguro(value, max = 120) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';
}
export function nomeFotoSeguro(filename) {
  const cleaned = textoSeguro(filename, 110);
  return cleaned.replace(/[^\p{L}\p{N}. _-]/gu, '_') || 'foto';
}
export function validarFotoPrevia(file) {
  if (!file || typeof file !== 'object') return 'Selecione uma foto.';
  if (!MIME_FOTOS_ACEITOS.includes(file.type)) return 'Use JPG, PNG ou WebP.';
  if (!Number.isInteger(file.size) || file.size <= 0 || file.size > MAX_BYTES_IMAGEM_PREVIA)
    return 'Na previa, cada foto deve ter ate 500 KB. Arquivos maiores exigem Storage privado.';
  return '';
}
export function validarProjeto(data, registros = [], editingId = '') {
  const nome = textoSeguro(data?.nome, 95);
  const bairro = textoSeguro(data?.bairro, 90);
  const cidade = textoSeguro(data?.cidade, 90);
  const uf = typeof data?.uf === 'string' ? data.uf.trim().toUpperCase() : '';
  const etapa = textoSeguro(data?.etapa, 35);
  const resumo = textoSeguro(data?.resumo, 900);
  if (nome.length < 3) return { ok: false, erro: 'Informe o nome do empreendimento (minimo de 3 caracteres).' };
  if (bairro.length < 2) return { ok: false, erro: 'Informe o bairro ou a localidade.' };
  if (cidade.length < 2) return { ok: false, erro: 'Informe a cidade.' };
  if (!/^[A-Z]{2}$/.test(uf)) return { ok: false, erro: 'UF invalida.' };
  if (!ESTADOS_PROJETO.includes(etapa)) return { ok: false, erro: 'Etapa invalida.' };
  const duplicate = registros.some(r => r && r.id !== editingId &&
    textoSeguro(r.nome).toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'));
  if (duplicate) return { ok: false, erro: 'Ja existe um rascunho com esse nome.' };
  return { ok: true, valor: { nome, bairro, cidade, uf, etapa, resumo } };
}
export function imagemDataValida(value) {
  return typeof value === 'string' && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length < 800000;
}
export function limparRegistroImportado(data) {
  if (!data || typeof data !== 'object') return null;
  const result = validarProjeto(data);
  if (!result.ok || !result.valor) return null;
  const fotos = Array.isArray(data.fotos) ? data.fotos.slice(0, MAX_FOTOS_PREVIA).filter(f =>
    f && typeof f.id === 'string' && imagemDataValida(f.dataUrl)
  ).map(f => ({id: textoSeguro(f.id,80), nome: nomeFotoSeguro(f.nome), dataUrl: f.dataUrl})) : [];
  return {
    id: textoSeguro(data.id,80) || 'importado',
    ...result.valor,
    fotos,
    atualizadoEm: typeof data.atualizadoEm === 'string' ? textoSeguro(data.atualizadoEm, 40) : '',
  };
}
