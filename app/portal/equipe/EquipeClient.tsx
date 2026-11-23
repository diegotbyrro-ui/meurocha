'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { nomeSetor, SETORES } from '@/lib/portal-acesso.mjs';
import AjudaPagina from '../ajuda/AjudaPagina';
import Icone from '../ui/Icone';
import CabecalhoPagina from '../ui/CabecalhoPagina';
import './equipe.css';

type Pessoa = { id: string; nome: string; email: string; setor: string; ativo: boolean; criado_em: string };
type Criada = { nome: string; email: string; senha: string };
type Modal =
  | { tipo: 'adicionar' }
  | { tipo: 'editar'; pessoa: Pessoa }
  | { tipo: 'senha'; pessoa: Pessoa }
  | { tipo: 'situacao'; pessoa: Pessoa };
type Resposta<T> = { ok: true; dados: T } | { ok: false; erro: string };

const PORTAL_URL = 'https://conviterocha.com.br/portal';
// Cor de cada setor: Diretoria vinho, Marketing roxo, Equipe Rocha petróleo (cores das áreas do R84).
const AREA_SETOR: Record<string, string> = { diretoria: 'central', marketing: 'biblioteca', equipe: 'ajuda' };
const LETRAS = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const ALFABETO = LETRAS + '23456789';

/** Senha aleatória de 12 caracteres, sempre com letra e número (passa na regra da equipe). */
function gerarSenha(): string {
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  const senha = Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join('');
  return /[A-Za-z]/.test(senha) && /[0-9]/.test(senha) ? senha : gerarSenha();
}

async function chamar<T>(url: string, metodo: 'GET' | 'POST' | 'PATCH', corpo?: unknown): Promise<Resposta<T>> {
  try {
    const r = await fetch(url, {
      method: metodo,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: corpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
    const dados = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, erro: dados.erro || 'Algo deu errado. Tente de novo.' };
    return { ok: true, dados: dados as T };
  } catch {
    return { ok: false, erro: 'Sem conexão com o servidor. Confira a internet e tente de novo.' };
  }
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] || '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

function mensagemAcesso(criada: Criada) {
  const primeiro = criada.nome.split(' ')[0];
  return `Olá, ${primeiro}! Seu acesso ao portal da Rocha está pronto.\n\nEndereço: ${PORTAL_URL}\nE-mail: ${criada.email}\nSenha: ${criada.senha}\n\nEntre com esse e-mail e essa senha. Não repasse a senha para outras pessoas.`;
}

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

export default function EquipeClient({ eu }: { eu: { id: string } }) {
  const [equipe, setEquipe] = useState<Pessoa[] | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState<Modal | null>(null);
  const [criada, setCriada] = useState<Criada | null>(null);
  const [aviso, setAviso] = useState('');
  const [copiado, setCopiado] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    const r = await chamar<{ equipe: Pessoa[] }>('/api/portal/equipe', 'GET');
    if (r.ok) setEquipe(r.dados.equipe);
    else setErro(r.erro);
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 2500);
    return () => clearTimeout(t);
  }, [aviso]);
  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(t);
  }, [copiado]);

  function trocarNaLista(pessoa: Pessoa) {
    setEquipe((lista) => (lista ? lista.map((p) => (p.id === pessoa.id ? pessoa : p)) : lista));
  }

  async function copiarMensagem() {
    if (!criada) return;
    const ok = await copiar(mensagemAcesso(criada));
    if (ok) { setCopiado(true); setAviso('Mensagem copiada.'); }
    else setAviso('Não foi possível copiar. Selecione o texto e copie.');
  }

  const ativas = equipe?.filter((p) => p.ativo).length ?? 0;

  return <div className="r85e">
    <CabecalhoPagina
      area="cadastro"
      icone="chaves"
      titulo="Equipe Rocha"
      descricao="Quem entra com e-mail e senha. Só essas pessoas veem tarefas e podem editar o portal."
    >
      <button type="button" className="r84-btn" onClick={() => setModal({ tipo: 'adicionar' })}>
        <Icone nome="mais" tamanho={18} /> Adicionar pessoa
      </button>
    </CabecalhoPagina>

    <AjudaPagina
      id="equipe"
      passos={[
        'Para cadastrar alguém, clique em Adicionar pessoa, preencha os dados e defina uma senha (ou use Gerar senha).',
        'Depois de salvar, copie a mensagem de acesso e envie para a pessoa. A senha aparece só nessa tela.',
        'Use Editar para mudar o nome ou o setor. Use Trocar senha se a pessoa esqueceu.',
        'Desativar tira o acesso da pessoa ao portal, sem apagar nada. Você não pode desativar o seu próprio acesso.',
      ]}
    />

    {criada ? <section className="r84-cartao r85e-sucesso" aria-labelledby="sucesso-titulo">
      <div className="r85e-sucesso-topo">
        <span className="r84-icone-bloco r84-icone-bloco-lg r85e-sucesso-icone" aria-hidden="true"><Icone nome="checkCirculo" tamanho={26} /></span>
        <div>
          <h2 id="sucesso-titulo">Acesso criado para {criada.nome}</h2>
          <p>Envie a mensagem abaixo pelo WhatsApp ou e-mail. A senha aparece só nesta tela.</p>
        </div>
      </div>
      <pre className="r85e-mensagem" tabIndex={0}>{mensagemAcesso(criada)}</pre>
      <div className="r85e-acoes-grupo">
        <button type="button" className={`r84-btn${copiado ? ' is-feito' : ''}`} onClick={copiarMensagem}>
          <Icone nome={copiado ? 'check' : 'copiar'} tamanho={18} /> {copiado ? 'Copiado' : 'Copiar mensagem'}
        </button>
        <button type="button" className="r84-btn-sec" onClick={() => setCriada(null)}>Fechar</button>
      </div>
    </section> : null}

    <section className="r84-cartao r85e-lista-cartao" aria-labelledby="lista-titulo">
      <div className="r85e-lista-topo">
        <h2 id="lista-titulo">Pessoas com acesso</h2>
        {equipe ? <p>{equipe.length} {equipe.length === 1 ? 'pessoa cadastrada' : 'pessoas cadastradas'}, {ativas} {ativas === 1 ? 'ativa' : 'ativas'}</p> : null}
      </div>

      {erro ? <div className="r85e-erro" role="alert">
        <p><Icone nome="alerta" tamanho={18} /> {erro}</p>
        <button type="button" className="r84-btn-sec" onClick={carregar}>Tentar de novo</button>
      </div> : null}

      {carregando && !equipe ? <div className="r85e-skeleton" aria-live="polite" aria-label="Carregando a equipe">
        <span /><span /><span />
      </div> : null}

      {equipe && equipe.length === 0 ? <div className="r85e-vazio">
        <span className="r84-icone-bloco r84-icone-bloco-lg" aria-hidden="true"><Icone nome="chaves" tamanho={26} /></span>
        <p>Ninguém cadastrado ainda. Adicione a primeira pessoa da equipe.</p>
        <button type="button" className="r84-btn" onClick={() => setModal({ tipo: 'adicionar' })}><Icone nome="mais" tamanho={18} /> Adicionar pessoa</button>
      </div> : null}

      {equipe && equipe.length > 0 ? <ul className="r85e-lista">
        <li className="r85e-cabecalho-lista" aria-hidden="true"><span>Pessoa</span><span>Setor</span><span>Situação</span><span>Ações</span></li>
        {equipe.map((p) => {
          const voce = p.id === eu.id;
          return <li key={p.id} className={`r85e-item${p.ativo ? '' : ' is-desativada'}`}>
            <div className="r85e-pessoa">
              <span className="r85e-avatar" aria-hidden="true">{iniciais(p.nome)}</span>
              <div className="r85e-pessoa-texto">
                <strong>{p.nome}{voce ? <span className="r85e-voce"> (você)</span> : null}</strong>
                <small>{p.email}</small>
              </div>
            </div>
            <div className="r85e-campo">
              <span className="r85e-rotulo">Setor</span>
              <span className="r84-selo" data-area={AREA_SETOR[p.setor] || 'ajuda'}>{nomeSetor(p.setor)}</span>
            </div>
            <div className="r85e-campo">
              <span className="r85e-rotulo">Situação</span>
              {p.ativo
                ? <span className="r85e-situacao is-ativo"><Icone nome="checkCirculo" tamanho={16} /> Ativo</span>
                : <span className="r85e-situacao is-desativado"><Icone nome="fechar" tamanho={16} /> Desativado</span>}
            </div>
            <div className="r85e-acoes">
              <button type="button" className="r84-btn-sec" onClick={() => setModal({ tipo: 'editar', pessoa: p })} aria-label={`Editar ${p.nome}`}>
                <Icone nome="editar" tamanho={16} /> Editar
              </button>
              <button type="button" className="r84-btn-sec" onClick={() => setModal({ tipo: 'senha', pessoa: p })} aria-label={`Trocar senha de ${p.nome}`}>
                <Icone nome="chaves" tamanho={16} /> Trocar senha
              </button>
              {voce ? null : p.ativo
                ? <button type="button" className="r85e-perigo" onClick={() => setModal({ tipo: 'situacao', pessoa: p })} aria-label={`Desativar ${p.nome}`}>
                    <Icone nome="fechar" tamanho={16} /> Desativar
                  </button>
                : <button type="button" className="r84-btn-sec" onClick={() => setModal({ tipo: 'situacao', pessoa: p })} aria-label={`Reativar ${p.nome}`}>
                    <Icone nome="check" tamanho={16} /> Reativar
                  </button>}
            </div>
          </li>;
        })}
      </ul> : null}
    </section>

    {modal?.tipo === 'adicionar' ? <FormAdicionar
      onFechar={() => setModal(null)}
      onCriada={(pessoa, senha) => {
        setModal(null);
        setCriada({ nome: pessoa.nome, email: pessoa.email, senha });
        carregar();
      }}
    /> : null}
    {modal?.tipo === 'editar' ? <FormEditar
      pessoa={modal.pessoa}
      onFechar={() => setModal(null)}
      onSalva={(pessoa) => { setModal(null); trocarNaLista(pessoa); setAviso('Dados salvos.'); }}
    /> : null}
    {modal?.tipo === 'senha' ? <FormSenha
      pessoa={modal.pessoa}
      onFechar={() => setModal(null)}
      onSalva={() => { setModal(null); setAviso('Senha trocada. Envie a nova senha para a pessoa.'); }}
    /> : null}
    {modal?.tipo === 'situacao' ? <ConfirmarSituacao
      pessoa={modal.pessoa}
      onFechar={() => setModal(null)}
      onSalva={(pessoa) => { setModal(null); trocarNaLista(pessoa); setAviso(pessoa.ativo ? 'Acesso reativado.' : 'Acesso desativado.'); }}
    /> : null}

    {aviso ? <div className="r84-toast" role="status"><Icone nome="check" tamanho={18} /> {aviso}</div> : null}
  </div>;
}

function Dialogo({ titulo, descricao, onFechar, children }: { titulo: string; descricao?: string; onFechar: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const aoApertar = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar(); };
    window.addEventListener('keydown', aoApertar);
    return () => window.removeEventListener('keydown', aoApertar);
  }, [onFechar]);
  return <div className="r85e-fundo" onMouseDown={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
    <div className="r85e-dialogo" role="dialog" aria-modal="true" aria-labelledby="dialogo-titulo">
      <div className="r85e-dialogo-topo">
        <h2 id="dialogo-titulo">{titulo}</h2>
        <button type="button" className="r85e-fechar" onClick={onFechar} aria-label="Fechar">
          <Icone nome="fechar" tamanho={20} />
        </button>
      </div>
      {descricao ? <p className="r85e-dialogo-texto">{descricao}</p> : null}
      {children}
    </div>
  </div>;
}

function CampoSenha({ valor, onMudar, ajuda }: { valor: string; onMudar: (v: string) => void; ajuda: string }) {
  const [copiadaSenha, setCopiadaSenha] = useState(false);
  async function copiarSenha() {
    if (await copiar(valor)) setCopiadaSenha(true);
  }
  useEffect(() => {
    if (!copiadaSenha) return;
    const t = setTimeout(() => setCopiadaSenha(false), 2000);
    return () => clearTimeout(t);
  }, [copiadaSenha]);
  return <div className="r85e-campo-senha">
    <label className="r85e-label">Senha
      <input className="r85e-input" type="text" autoComplete="new-password" value={valor} onChange={(e) => onMudar(e.target.value)} required aria-describedby="senha-ajuda" />
    </label>
    <p id="senha-ajuda" className="r85e-ajuda">{ajuda}</p>
    <div className="r85e-acoes-grupo">
      <button type="button" className="r84-btn-sec" onClick={() => onMudar(gerarSenha())}><Icone nome="refazer" tamanho={16} /> Gerar senha</button>
      <button type="button" className={`r84-btn-sec${copiadaSenha ? ' is-feito' : ''}`} onClick={copiarSenha} disabled={!valor}>
        <Icone nome={copiadaSenha ? 'check' : 'copiar'} tamanho={16} /> {copiadaSenha ? 'Copiada' : 'Copiar senha'}
      </button>
    </div>
  </div>;
}

const AJUDA_SENHA = 'Pelo menos 10 caracteres, com letras e números.';

function FormAdicionar({ onFechar, onCriada }: { onFechar: () => void; onCriada: (p: Pessoa, senha: string) => void }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [setor, setSetor] = useState('equipe');
  const [senha, setSenha] = useState(() => gerarSenha());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro('');
    const r = await chamar<{ pessoa: Pessoa }>('/api/portal/equipe', 'POST', { nome, email, setor, senha });
    setEnviando(false);
    if (r.ok) onCriada(r.dados.pessoa, senha);
    else setErro(r.erro);
  }

  return <Dialogo titulo="Adicionar pessoa" descricao="Crie o acesso de quem vai entrar no portal com e-mail e senha." onFechar={onFechar}>
    <form className="r85e-form" onSubmit={enviar}>
      <label className="r85e-label">Nome completo
        <input className="r85e-input" type="text" value={nome} onChange={(e) => setNome(e.target.value)} required minLength={2} maxLength={80} autoFocus autoComplete="off" />
      </label>
      <label className="r85e-label">E-mail de acesso
        <input className="r85e-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" />
      </label>
      <label className="r85e-label">Setor
        <select className="r85e-input" value={setor} onChange={(e) => setSetor(e.target.value)}>
          {SETORES.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
      </label>
      <CampoSenha valor={senha} onMudar={setSenha} ajuda={AJUDA_SENHA} />
      {erro ? <p className="r85e-aviso-erro" role="alert"><Icone nome="alerta" tamanho={18} /> {erro}</p> : null}
      <div className="r85e-acoes-grupo r85e-fim">
        <button type="button" className="r84-btn-sec" onClick={onFechar}>Cancelar</button>
        <button type="submit" className="r84-btn" disabled={enviando}>{enviando ? 'Salvando...' : 'Criar acesso'}</button>
      </div>
    </form>
  </Dialogo>;
}

function FormEditar({ pessoa, onFechar, onSalva }: { pessoa: Pessoa; onFechar: () => void; onSalva: (p: Pessoa) => void }) {
  const [nome, setNome] = useState(pessoa.nome);
  const [setor, setSetor] = useState(pessoa.setor);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro('');
    const r = await chamar<{ pessoa: Pessoa }>(`/api/portal/equipe/${pessoa.id}`, 'PATCH', { nome, setor });
    setEnviando(false);
    if (r.ok) onSalva(r.dados.pessoa);
    else setErro(r.erro);
  }

  return <Dialogo titulo="Editar pessoa" descricao={`E-mail de acesso: ${pessoa.email}. Para mudar o e-mail, crie um novo acesso.`} onFechar={onFechar}>
    <form className="r85e-form" onSubmit={enviar}>
      <label className="r85e-label">Nome completo
        <input className="r85e-input" type="text" value={nome} onChange={(e) => setNome(e.target.value)} required minLength={2} maxLength={80} autoFocus autoComplete="off" />
      </label>
      <label className="r85e-label">Setor
        <select className="r85e-input" value={setor} onChange={(e) => setSetor(e.target.value)}>
          {SETORES.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
      </label>
      {erro ? <p className="r85e-aviso-erro" role="alert"><Icone nome="alerta" tamanho={18} /> {erro}</p> : null}
      <div className="r85e-acoes-grupo r85e-fim">
        <button type="button" className="r84-btn-sec" onClick={onFechar}>Cancelar</button>
        <button type="submit" className="r84-btn" disabled={enviando}>{enviando ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  </Dialogo>;
}

function FormSenha({ pessoa, onFechar, onSalva }: { pessoa: Pessoa; onFechar: () => void; onSalva: () => void }) {
  const [senha, setSenha] = useState(() => gerarSenha());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro('');
    const r = await chamar<{ ok: true }>(`/api/portal/equipe/${pessoa.id}`, 'PATCH', { senha });
    setEnviando(false);
    if (r.ok) onSalva();
    else setErro(r.erro);
  }

  return <Dialogo titulo={`Trocar senha de ${pessoa.nome}`} descricao="A senha antiga deixa de valer. Copie a nova senha e envie para a pessoa." onFechar={onFechar}>
    <form className="r85e-form" onSubmit={enviar}>
      <CampoSenha valor={senha} onMudar={setSenha} ajuda={AJUDA_SENHA} />
      {erro ? <p className="r85e-aviso-erro" role="alert"><Icone nome="alerta" tamanho={18} /> {erro}</p> : null}
      <div className="r85e-acoes-grupo r85e-fim">
        <button type="button" className="r84-btn-sec" onClick={onFechar}>Cancelar</button>
        <button type="submit" className="r84-btn" disabled={enviando}>{enviando ? 'Salvando...' : 'Trocar senha'}</button>
      </div>
    </form>
  </Dialogo>;
}

function ConfirmarSituacao({ pessoa, onFechar, onSalva }: { pessoa: Pessoa; onFechar: () => void; onSalva: (p: Pessoa) => void }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const desativar = pessoa.ativo;

  async function confirmar() {
    setEnviando(true);
    setErro('');
    const r = await chamar<{ pessoa: Pessoa }>(`/api/portal/equipe/${pessoa.id}`, 'PATCH', { ativo: !desativar });
    setEnviando(false);
    if (r.ok) onSalva(r.dados.pessoa);
    else setErro(r.erro);
  }

  return <Dialogo
    titulo={desativar ? `Desativar ${pessoa.nome}?` : `Reativar ${pessoa.nome}?`}
    descricao={desativar
      ? 'A pessoa deixa de entrar no portal até você reativar o acesso. Nada é apagado.'
      : 'A pessoa volta a entrar no portal com o mesmo e-mail e senha.'}
    onFechar={onFechar}
  >
    {erro ? <p className="r85e-aviso-erro" role="alert"><Icone nome="alerta" tamanho={18} /> {erro}</p> : null}
    <div className="r85e-acoes-grupo r85e-fim">
      <button type="button" className="r84-btn-sec" onClick={onFechar} autoFocus>Cancelar</button>
      <button type="button" className={desativar ? 'r85e-perigo-cheio' : 'r84-btn'} onClick={confirmar} disabled={enviando}>
        {enviando ? 'Salvando...' : desativar ? 'Desativar acesso' : 'Reativar acesso'}
      </button>
    </div>
  </Dialogo>;
}
