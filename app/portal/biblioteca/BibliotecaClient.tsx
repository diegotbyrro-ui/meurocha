'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Categoria = { id: string; grupo: string; nome: string; acesso: string };
type Arquivo = { id: string; categoria: string; nome: string; mime: string; tamanho: number; adicionadoEm: string; blob: Blob };
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
  return <section className="r79-library">
    <header className="r79-library-head"><div><span>ACERVO DIGITAL · ROCHA</span><h1>Biblioteca de materiais</h1><p>Pastas fixas por categoria. Abra uma pasta para consultar e organizar os arquivos.</p></div><strong>{categorias.length} pastas fixas</strong></header>
    <div className="r79-library-warning" role="note"><strong>Prévia local e privada.</strong> Os arquivos ficam apenas neste navegador por IndexedDB; outros funcionários ainda não conseguem vê-los. Não envie contratos assinados, documentos pessoais, preços internos ou materiais sensíveis até ativarmos o armazenamento seguro com permissões individuais.</div>
    <div className="r79-library-main"><aside className="r79-library-groups"><label htmlFor="r79-filtrar">Buscar categoria</label><input id="r79-filtrar" value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Ex.: Plantas, vídeos, books..." />
      <nav aria-label="Pastas fixas da biblioteca Rocha">{categoriasVisiveis.map(c => <button type="button" key={c.id} className={c.id===selecionada?'r79-cat-active':''} onClick={() => {setSelecionada(c.id);setAviso('');}} aria-pressed={c.id===selecionada}>
        <span className="r80-folder-symbol" aria-hidden="true"><svg viewBox="0 0 64 56" fill="none"><path d="M6 12c0-3 2-5 5-5h16l6 7h20c3 0 5 2 5 5v25c0 4-3 6-6 6H12c-4 0-6-2-6-6V12Z" fill="#EFCFA8"/><path d="M6 23h52v22c0 3-2 5-5 5H11c-3 0-5-2-5-5V23Z" fill="#E5B77D"/><rect x="23" y="24" width="20" height="20" rx="5" fill="#8F2338"/><text x="33" y="38.5" textAnchor="middle" fontSize="15" fontWeight="800" fill="white">R</text></svg></span>
        <span className="r80-folder-caption"><span>{c.nome}</span><small>{c.acesso==='interno'?'Interno Rocha':'Previsto para corretor'} · {arquivos.filter(a=>a.categoria===c.id).length} arquivo(s)</small></span>
      </button>)}</nav>
    </aside><section className="r79-library-folder">{atual ? <><div className="r79-folder-title"><div><small>{atual.grupo.toUpperCase()} · {atual.acesso==='interno'?'USO INTERNO':'MATERIAL PARA CORRETORES AUTORIZADOS'}</small><h2>{atual.nome}</h2><p>{pasta.length} de {MAX_PER_CATEGORY} arquivos · até 150 MB por arquivo · pasta fixa</p></div><label className="r79-upload-button">{ocupado?'Gravando...':'Adicionar arquivos'}<input type="file" multiple disabled={ocupado} accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.zip" onChange={e=>{void enviar(e.currentTarget.files); e.currentTarget.value='';}} /></label></div>
      {aviso && <p className="r79-library-feedback" role="status">{aviso}</p>}
      <div className="r79-file-list">{pasta.length ? pasta.map(a => <article className="r79-file-item" key={a.id}><div><strong title={a.nome}>{a.nome}</strong><p>{formatar(a.tamanho)} · {new Date(a.adicionadoEm).toLocaleString('pt-BR')}</p></div><div className="r79-file-actions"><button type="button" onClick={()=>abrirArquivo(a)}>Abrir</button><button type="button" onClick={()=>abrirArquivo(a,true)}>Baixar</button><button type="button" className="r79-delete" onClick={()=>void remover(a.id)}>Excluir</button></div></article>) : <p className="r79-no-files">Esta categoria ainda não tem arquivos neste navegador. Clique em <strong>Adicionar arquivos</strong> para começar.</p>}</div></> : null}</section></div>
  </section>;
}
