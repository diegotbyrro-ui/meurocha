'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { empreendimentos } from '@/lib/catalog.mjs';
import { ESTADOS_PROJETO, MAX_FOTOS_PREVIA, MAX_PROJETOS_PREVIA, nomeFotoSeguro, validarFotoPrevia, validarProjeto, limparRegistroImportado } from '@/lib/portal-gestao.mjs';

const CHAVE = 'rocha-gestao-previa-local-r77-v1';
type Foto = { id: string; nome: string; dataUrl: string };
type Empreendimento = {
  id: string; nome: string; bairro: string; cidade: string; uf: string;
  etapa: string; resumo: string; fotos: Foto[]; atualizadoEm: string;
};
type Formulario = Pick<Empreendimento,'nome'|'bairro'|'cidade'|'uf'|'etapa'|'resumo'>;
const VAZIO: Formulario = { nome:'', bairro:'', cidade:'Maceió', uf:'AL', etapa:'Planejamento', resumo:'' };
function novoId() { return `${Date.now()}-${Math.random().toString(36).slice(2,10)}`; }

export default function GestaoClient() {
  const [registros,setRegistros] = useState<Empreendimento[]>([]);
  const [pronto,setPronto] = useState(false);
  const [form,setForm] = useState<Formulario>({...VAZIO});
  const [fotos,setFotos] = useState<Foto[]>([]);
  const [editando,setEditando] = useState('');
  const [busca,setBusca] = useState('');
  const [mensagem,setMensagem] = useState('');
  const [erro,setErro] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE);
      if (salvo) {
        const parsed: unknown = JSON.parse(salvo);
        if (Array.isArray(parsed)) {
          const limpos = parsed.slice(0,MAX_PROJETOS_PREVIA).map(limparRegistroImportado).filter(Boolean) as Empreendimento[];
          setRegistros(limpos);
        }
      }
    } catch (_) { setErro('Os rascunhos locais nao puderam ser lidos.'); }
    setPronto(true);
  }, []);

  function persistir(next:Empreendimento[]) {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(next));
      setRegistros(next);
      return true;
    } catch (_) {
      setErro('Espaco do navegador insuficiente. Remova fotos ou exporte os rascunhos antes de continuar.');
      return false;
    }
  }

  const vistos = useMemo(() => registros.filter(r =>
    [r.nome, r.bairro, r.cidade].join(' ').toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR'))
  ), [registros,busca]);

  function muda(campo:keyof Formulario, valor:string) {
    setForm(f => ({...f,[campo]:valor}));
    setErro('');
  }

  async function escolheFoto(event:ChangeEvent<HTMLInputElement>) {
    const selecionadas = Array.from(event.target.files || []);
    if (fileInput.current) fileInput.current.value = '';
    setErro(''); setMensagem('');
    if (fotos.length + selecionadas.length > MAX_FOTOS_PREVIA) {
      setErro(`Esta previa permite ate ${MAX_FOTOS_PREVIA} imagens por empreendimento.`); return;
    }
    const lote:Foto[] = [];
    for (const file of selecionadas) {
      const aviso = validarFotoPrevia(file);
      if (aviso) {setErro(`${file.name}: ${aviso}`);return;}
      let dataUrl:string;
      try {
        dataUrl = await new Promise<string>((resolve,reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Falha ao ler imagem.'));
          reader.readAsDataURL(file);
        });
      } catch (_) {setErro('Nao foi possivel ler o arquivo selecionado.');return;}
      if (!/^data:image\/(?:jpeg|png|webp);base64,/.test(dataUrl)) {
        setErro('Imagem em formato invalido.');return;
      }
      lote.push({id:novoId(),nome:nomeFotoSeguro(file.name),dataUrl});
    }
    setFotos(old => [...old,...lote]);
    setMensagem(`Foto(s) selecionada(s) para este rascunho: ${lote.length}.`);
  }

  function salvar(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setErro('');setMensagem('');
    const validado = validarProjeto(form, registros, editando);
    if (!validado.ok || !validado.valor) {setErro(validado.erro || 'Revise o formulario.');return;}
    if (!editando && registros.length >= MAX_PROJETOS_PREVIA) {
      setErro(`Limite local de ${MAX_PROJETOS_PREVIA} rascunhos atingido.`);return;
    }
    const novo:Empreendimento = {
      id:editando || novoId(), ...validado.valor, fotos, atualizadoEm:new Date().toISOString(),
    };
    const atualizados = editando ? registros.map(r => r.id === editando ? novo : r) : [novo,...registros];
    if (persistir(atualizados)) {
      setForm({...VAZIO});setFotos([]);setEditando('');
      setMensagem('Rascunho salvo somente neste navegador. Nada foi publicado ou enviado ao servidor.');
    }
  }

  function editar(r:Empreendimento) {
    setEditando(r.id);
    setForm({nome:r.nome,bairro:r.bairro,cidade:r.cidade,uf:r.uf,etapa:r.etapa,resumo:r.resumo});
    setFotos(r.fotos);setErro('');setMensagem(`Editando o rascunho de ${r.nome}.`);
    document.getElementById('rocha-gestao-form')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function cancelar() {setEditando('');setForm({...VAZIO});setFotos([]);setErro('');setMensagem('Edicao cancelada.');}
  function excluir(r:Empreendimento) {
    if (!window.confirm(`Excluir o rascunho local "${r.nome}"?`)) return;
    if (persistir(registros.filter(x => x.id !== r.id))) {
      if (editando === r.id) cancelar();
      setMensagem(`Rascunho de ${r.nome} excluido apenas deste navegador.`);
    }
  }
  function exportar() {
    const pacote = { tipo:'ROCHA_GESTAO_PREVIA_LOCAL', versao:1, exportadoEm:new Date().toISOString(),
      aviso:'NAO E UM BACKUP DE PRODUCAO. Contem fotos e dados da previa local.', registros};
    const blob = new Blob([JSON.stringify(pacote,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');a.href=url;a.download='rocha-rascunhos-locais.json';a.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1500);
    setMensagem('Arquivo JSON exportado. Guarde-o apenas em local apropriado para material de teste.');
  }

  return <div className="r77-gestao" aria-label="Gestao de empreendimentos e midias - previa local">
    <div className="r77-heading"><div><span className="eyebrow">EQUIPE ROCHA · HOMOLOGACAO</span>
      <h1>Gestão de empreendimentos</h1><p>Prepare o portfólio, organize imagens e revise materiais antes da futura publicação.</p></div>
      <span className="r77-marker">PRÉVIA LOCAL · NÃO PUBLICADA</span>
    </div>
    <div className="r77-alert" role="note"><strong>Ambiente de demonstração.</strong> Os dados são guardados somente neste navegador.
      Não há login de equipe, banco ou Storage conectado. Não insira documentos, preços ou dados confidenciais. Em produção, este módulo permanece bloqueado.
    </div>
    <div className="r77-metrics"><article><span>Rascunhos locais</span><strong>{pronto?registros.length:'—'}</strong></article>
      <article><span>Fotos de demonstração</span><strong>{registros.reduce((total,item)=>total+item.fotos.length,0)}</strong></article>
      <article><span>Referências públicas existentes</span><strong>{empreendimentos.length}</strong></article></div>
    <div className="r77-columns"><section className="r77-panel" id="rocha-gestao-form"><div className="r77-panel-top">
      <div><span className="r77-kicker">CADASTRO INTERNO</span><h2>{editando?'Editar rascunho':'Novo empreendimento'}</h2></div>
      {editando&&<button type="button" className="r77-link-button" onClick={cancelar}>Cancelar edição</button>}</div>
      <p className="r77-subtitle">Informações para revisão da equipe. Nenhum cadastro é enviado ao site ou a corretores.</p>
      <form className="r77-form" onSubmit={salvar}>
        <label>Nome do empreendimento <input required maxLength={95} value={form.nome} onChange={e=>muda('nome',e.target.value)} placeholder="Ex.: Novo empreendimento Rocha" /></label>
        <div className="r77-two"><label>Bairro / localidade <input required value={form.bairro} maxLength={90} onChange={e=>muda('bairro',e.target.value)} placeholder="Bairro" /></label>
          <label>Cidade <input required value={form.cidade} maxLength={90} onChange={e=>muda('cidade',e.target.value)} /></label></div>
        <div className="r77-two"><label>UF <input required value={form.uf} maxLength={2} onChange={e=>muda('uf',e.target.value.toUpperCase())} /></label>
          <label>Etapa <select value={form.etapa} onChange={e=>muda('etapa',e.target.value)}>{ESTADOS_PROJETO.map(s=><option key={s}>{s}</option>)}</select></label></div>
        <label>Resumo comercial de trabalho <textarea value={form.resumo} maxLength={900} onChange={e=>muda('resumo',e.target.value)} rows={3} placeholder="Descrição para revisão. Não incluir preço, tabela ou informação não homologada." /></label>
        <div className="r77-photo-field"><div className="r77-photo-top"><strong>Fotos de referência</strong><span>{fotos.length} / {MAX_FOTOS_PREVIA}</span></div>
          <p>JPG, PNG ou WebP, até 500 KB por arquivo. Imagens pequenas apenas para demonstrar a gestão.</p>
          <input ref={fileInput} type="file" aria-label="Selecionar fotos" accept="image/jpeg,image/png,image/webp" multiple onChange={escolheFoto} disabled={fotos.length >= MAX_FOTOS_PREVIA} />
          {fotos.length>0&&<div className="r77-thumbs">{fotos.map(f=><div key={f.id} className="r77-thumb"><img src={f.dataUrl} alt={f.nome}/><span title={f.nome}>{f.nome}</span><button type="button" onClick={()=>setFotos(old=>old.filter(x=>x.id!==f.id))} aria-label={`Remover foto ${f.nome}`}>Remover</button></div>)}</div>}</div>
        {erro&&<p className="r77-error" role="alert">{erro}</p>}
        <button className="r77-main-button" type="submit">{editando?'Salvar alterações locais':'Adicionar rascunho local'}</button>
      </form>
    </section><section className="r77-panel r77-inventory"><div className="r77-panel-top"><div><span className="r77-kicker">ORGANIZAÇÃO DO ACERVO</span><h2>Rascunhos da equipe</h2></div>
      <button className="r77-export" type="button" onClick={exportar} disabled={!registros.length}>Exportar JSON</button></div>
      <p className="r77-subtitle">Rascunhos privados desta prévia, sem publicar novos empreendimentos na vitrine.</p>
      <label className="r77-search">Buscar por nome, bairro ou cidade <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Pesquisar rascunhos" /></label>
      {vistos.length===0?<div className="r77-empty"><strong>{registros.length?'Nenhum resultado':'Seu catálogo começa aqui'}</strong>
        <p>{registros.length?'Tente outra busca.':'Cadastre um empreendimento para testar o fluxo de organização da equipe.'}</p></div>:
        <div className="r77-list">{vistos.map(item=><article className="r77-item" key={item.id}><div className="r77-item-photo">{item.fotos[0]?<img src={item.fotos[0].dataUrl} alt={'Foto do empreendimento '+item.nome}/>:<span aria-hidden="true">R</span>}</div>
          <div className="r77-item-details"><span className="r77-item-status">RASCUNHO · {item.etapa}</span><h3>{item.nome}</h3><p>{item.bairro} · {item.cidade}/{item.uf}</p><small>{item.fotos.length} foto(s) · não publicado</small>
            <div className="r77-item-actions"><button type="button" onClick={()=>editar(item)}>Editar</button><button type="button" onClick={()=>excluir(item)}>Excluir</button></div></div></article>)}</div>}
      <div className="r77-reference"><strong>Portfólio existente</strong><p>{empreendimentos.map(e=>e.nome).join(' · ')}</p><small>Estas referências não são alteradas pelos rascunhos locais.</small></div>
    </section></div>
    {mensagem&&<div className="r77-message" role="status">{mensagem}</div>}
    <div className="r77-next"><strong>Para ativar com corretores e equipe Rocha:</strong> identificar o Supabase CONVITEROCHA correto, configurar autenticação verificada e permissões no servidor, Storage privado para fotos e fluxo de revisão/publicação. Nenhuma dessas integrações foi acionada nesta versão.</div>
  </div>;
}
