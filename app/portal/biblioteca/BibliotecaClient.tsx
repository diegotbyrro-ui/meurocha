'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icone, { type NomeIcone } from '../ui/Icone';
import CabecalhoPagina from '../ui/CabecalhoPagina';

type Categoria = { id: string; grupo: string; nome: string; acesso: string };
type Arquivo = { id: string; categoria: string; nome: string; mime: string; tamanho: number; adicionadoEm: string; blob: Blob };

// R84: cada grupo de pastas tem um icone e uma cor (classe r84b-g-*, definida em r83-tema.css).
const GRUPOS: Record<string, { icone: NomeIcone; classe: string; acesso?: string }> = {
  'Perspectivas': { icone: 'imagem', classe: 'r84b-g-perspectivas' },
  'Dados do empreendimento': { icone: 'cartao', classe: 'r84b-g-dados' },
  'Comercial': { icone: 'livro', classe: 'r84b-g-comercial' },
  'Audiovisual': { icone: 'video', classe: 'r84b-g-audiovisual' },
  'Identidade': { icone: 'marca', classe: 'r84b-g-identidade' },
  'Projetos': { icone: 'regua', classe: 'r84b-g-projetos' },
  'Redes sociais': { icone: 'megafone', classe: 'r84b-g-redes' },
  'Documentação': { icone: 'documento', classe: 'r84b-g-documentacao' },
};
const grupoVisual = (grupo: string) => GRUPOS[grupo] || { icone: 'pasta' as NomeIcone, classe: 'r84b-g-perspectivas' };
function tipoVisual(a: Arquivo): { icone: NomeIcone; rotulo: string } {
  if (/\.mp4$/i.test(a.nome) || a.mime === 'video/mp4') return { icone: 'video', rotulo: 'Vídeo' };
  if (a.mime.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(a.nome)) return { icone: 'imagem', rotulo: 'Imagem' };
  return { icone: 'documento', rotulo: 'Documento' };
}
const DB_NAME = 'rocha-portal-r79-local';
const DB_STORE = 'arquivos';
const MAX_SIZE = 150 * 1024 * 1024;
const MAX_PER_CATEGORY = 30;
const ALLOWED_EXT = /\.(pdf|png|jpg|jpeg|webp|doc|docx|xls|xlsx|ppt|pptx|mp4|zip)$/i;

function conectar(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const banco = request.result;
      if (!banco.objectStoreNames.contains(DB_STORE)) {
        const store = banco.createObjectStore(DB_STORE, { keyPath: 'id' });
        store.createIndex('categoria', 'categoria', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Não foi possível abrir o armazenamento local.'));
  });
}
async function transacao<T>(mode: IDBTransactionMode, executar: (store: IDBObjectStore, finish: (value: T) => void) => void): Promise<T> {
  const banco = await conectar();
  return new Promise((resolve, reject) => {
    const tx = banco.transaction(DB_STORE, mode);
    const store = tx.objectStore(DB_STORE);
    let valor: T;
    let hasValue = false;
    const finish = (v: T) => { valor = v; hasValue = true; };
    tx.oncomplete = () => { banco.close(); if (hasValue) resolve(valor); else reject(new Error('Operação sem resultado.')); };
    tx.onerror = () => { banco.close(); reject(tx.error || new Error('Erro no armazenamento local.')); };
    tx.onabort = () => { banco.close(); reject(tx.error || new Error('Transação interrompida.')); };
    try { executar(store, finish); } catch (error) { tx.abort(); reject(error); }
  });
}
async function listarTodos(): Promise<Arquivo[]> {
  return transacao('readonly', (store, done) => {
    const req = store.getAll();
    req.onsuccess = () => done(req.result as Arquivo[]);
  });
}
async function salvarArquivo(arquivo: Arquivo): Promise<void> {
  return transacao('readwrite', (store, done) => { store.put(arquivo); done(undefined); });
}
async function excluirArquivo(id: string): Promise<void> {
  return transacao('readwrite', (store, done) => { store.delete(id); done(undefined); });
}
function formatar(bytes: number) { return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`; }
function erroTexto(err: unknown) { return err instanceof Error ? err.message : 'Não foi possível concluir a operação. Confira o espaço disponível no navegador.'; }
function abrirArquivo(arquivo: Arquivo, baixar = false) {
  const url = URL.createObjectURL(arquivo.blob);
  const link = document.createElement('a');
  link.href = url; link.download = baixar ? arquivo.nome : ''; link.target = '_blank'; link.rel = 'noopener noreferrer';
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function BibliotecaClient({ categorias }: { categorias: readonly Categoria[] }) {
  const [selecionada, setSelecionada] = useState(categorias[0]?.id || '');
  const [arquivos, setArquivos] = useState<Arquivo[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState('');
  const [filtro, setFiltro] = useState('');
  const [arrastando, setArrastando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);
  const atual = categorias.find(c => c.id === selecionada) || categorias[0];
  const pasta = useMemo(() => arquivos.filter(a => a.categoria === selecionada).sort((a,b) => b.adicionadoEm.localeCompare(a.adicionadoEm)), [arquivos, selecionada]);
  const categoriasVisiveis = useMemo(() => categorias.filter(c => `${c.nome} ${c.grupo}`.toLowerCase().includes(filtro.toLowerCase().trim())), [categorias, filtro]);
  const carregar = useCallback(async () => { try { setArquivos(await listarTodos()); } catch (e) { setAviso(erroTexto(e)); } }, []);
  useEffect(() => { void carregar(); }, [carregar]);

  async function enviar(lista: FileList | null) {
    if (!lista?.length || !atual) return;
    setAviso('');
    const novos = Array.from(lista);
    if (pasta.length + novos.length > MAX_PER_CATEGORY) { setAviso(`Limite de ${MAX_PER_CATEGORY} arquivos por categoria neste modo de teste.`); return; }
    if (novos.some(f => f.size === 0 || f.size > MAX_SIZE || !ALLOWED_EXT.test(f.name))) {
      setAviso('Utilize PDF, imagens, Office, MP4 ou ZIP, com até 150 MB por arquivo. O armazenamento depende do espaço disponível no navegador.'); return;
    }
    setOcupado(true);
    try {
      for (const f of novos) {
        await salvarArquivo({ id: crypto.randomUUID(), categoria: selecionada, nome: f.name.slice(0, 180), mime: f.type, tamanho: f.size, adicionadoEm: new Date().toISOString(), blob: f });
      }
      await carregar();
      setAviso(`${novos.length} arquivo(s) guardado(s) no navegador. Ainda não foram enviados ao servidor.`);
    } catch (e) { setAviso(erroTexto(e)); }
    finally { setOcupado(false); }
  }
  async function remover(id: string) {
    if (!window.confirm('Excluir este arquivo do armazenamento deste navegador?')) return;
    try { await excluirArquivo(id); await carregar(); setAviso('Arquivo excluído deste navegador.'); } catch (e) { setAviso(erroTexto(e)); }
  }
  const acessoAtual = atual?.acesso === 'interno' ? 'Uso interno da Rocha' : 'Material para corretores autorizados';
  return <section className="r79-library r84b-biblioteca" data-area="biblioteca">
    <CabecalhoPagina area="biblioteca" icone="pasta" titulo="Biblioteca de arquivos"
      descricao="Escolha uma pasta à esquerda, envie os arquivos e abra, baixe ou exclua quando precisar."
      antes={<span>{categorias.length} pastas fixas</span>}>
      <button type="button" className="r84-btn" disabled={ocupado || !atual} onClick={() => entrada.current?.click()}>
        <Icone nome="upload" tamanho={18} />{ocupado ? 'Gravando...' : 'Adicionar arquivos'}
      </button>
    </CabecalhoPagina>
    <div className="r79-library-warning r84b-aviso" role="note"><Icone nome="alerta" tamanho={22} /><div><strong>Prévia local e privada.</strong> Os arquivos ficam apenas neste navegador por IndexedDB; outros funcionários ainda não conseguem vê-los. Não envie contratos assinados, documentos pessoais, preços internos ou materiais sensíveis até ativarmos o armazenamento seguro com permissões individuais. Para compartilhar com a equipe, use os links da Central.</div></div>
    <div className="r79-library-main">
      <aside className="r79-library-groups"><label htmlFor="r79-filtrar">Buscar categoria</label><input id="r79-filtrar" value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Ex.: Plantas, vídeos, books..." />
        <nav aria-label="Pastas fixas da biblioteca Rocha">{categoriasVisiveis.map(c => {
          const g = grupoVisual(c.grupo);
          const total = arquivos.filter(a => a.categoria === c.id).length;
          return <button type="button" key={c.id} className={c.id === selecionada ? 'r79-cat-active r84b-pasta' : 'r84b-pasta'} onClick={() => { setSelecionada(c.id); setAviso(''); }} aria-pressed={c.id === selecionada}>
            <span className={`r80-folder-symbol r84-icone-bloco r84-icone-bloco-cheio r84b-bloco ${g.classe}`} aria-hidden="true"><Icone nome={g.icone} tamanho={22} /></span>
            <span className="r80-folder-caption"><span>{c.nome}</span><small>{c.acesso === 'interno' ? 'Interno Rocha' : 'Previsto para corretor'} · {c.grupo}</small></span>
            <span className="r84b-contagem" title={`${total} arquivo(s)`}>{total}</span>
          </button>;
        })}{categoriasVisiveis.length === 0 ? <p className="r84b-vazio-texto">Nenhuma pasta encontrada. Tente outra palavra.</p> : null}</nav>
      </aside>
      <section className="r79-library-folder">{atual ? <>
        <div className="r79-folder-title"><div><small>{atual.grupo} · {acessoAtual}</small><h2>{atual.nome}</h2><p>{pasta.length} de {MAX_PER_CATEGORY} arquivos · até 150 MB por arquivo · pasta fixa</p></div></div>
        {aviso && <p className="r79-library-feedback r84b-feedback" role="status">{aviso}</p>}
        <label className={`r84b-dropzone${arrastando ? ' is-arrastando' : ''}${ocupado ? ' is-ocupado' : ''}`}
          onDragOver={e => { e.preventDefault(); setArrastando(true); }}
          onDragLeave={() => setArrastando(false)}
          onDrop={e => { e.preventDefault(); setArrastando(false); void enviar(e.dataTransfer.files); }}>
          <span className="r84-icone-bloco r84-icone-bloco-lg" aria-hidden="true"><Icone nome="upload" tamanho={26} /></span>
          <strong>{ocupado ? 'Gravando...' : 'Clique para escolher arquivos'}</strong>
          <span>PDF, imagens, Office, MP4 ou ZIP, até 150 MB por arquivo. Também é possível arrastar os arquivos para cá.</span>
          <input ref={entrada} className="r84b-sr" type="file" multiple disabled={ocupado} accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.zip" onChange={e => { void enviar(e.currentTarget.files); e.currentTarget.value = ''; }} />
        </label>
        <div className="r79-file-list">{pasta.length ? pasta.map(a => {
          const tipo = tipoVisual(a);
          return <article className="r79-file-item r84b-arquivo" key={a.id}>
            <span className="r84-icone-bloco r84b-tipo" aria-hidden="true"><Icone nome={tipo.icone} tamanho={22} /></span>
            <div className="r84b-arquivo-texto"><strong title={a.nome}>{a.nome}</strong><p>{tipo.rotulo} · {formatar(a.tamanho)} · {new Date(a.adicionadoEm).toLocaleString('pt-BR')}</p></div>
            <div className="r79-file-actions r84b-acoes">
              <button type="button" className="r84b-acao" onClick={() => abrirArquivo(a)}><Icone nome="abrir" tamanho={18} />Abrir</button>
              <button type="button" className="r84b-acao" onClick={() => abrirArquivo(a, true)}><Icone nome="baixar" tamanho={18} />Baixar</button>
              <button type="button" className="r79-delete r84b-acao r84b-acao-perigo" onClick={() => void remover(a.id)}><Icone nome="lixeira" tamanho={18} />Excluir</button>
            </div>
          </article>;
        }) : <div className="r84b-vazio"><span className="r84-icone-bloco r84-icone-bloco-lg" aria-hidden="true"><Icone nome="pasta" tamanho={26} /></span><p className="r79-no-files">Esta categoria ainda não tem arquivos neste navegador. Clique em <strong>Adicionar arquivos</strong> para começar.</p></div>}</div>
      </> : null}</section>
    </div>
  </section>;
}
