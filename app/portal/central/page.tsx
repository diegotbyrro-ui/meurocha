import Link from 'next/link';
import AjudaPagina from '../ajuda/AjudaPagina';
import CabecalhoPagina from '../ui/CabecalhoPagina';
import Icone from '../ui/Icone';
import { listarEmpreendimentos, statusDados } from '@/lib/empreendimentos-central.mjs';
import './central.css';

export const dynamic = 'force-dynamic';

const PASSOS_CENTRAL: readonly string[] = [
  'Escolha o empreendimento na lista abaixo.',
  'Em Abrir, veja o CNPJ, a chave PIX, os materiais de venda e as postagens para redes sociais.',
  'Se algum dado aparecer como falta cadastrar, toque em Atualizar dados e preencha o cadastro.',
];

/** Cor solida da faixa de capa, pela posicao do empreendimento na lista. */
const CORES_CAPA: readonly string[] = ['#a51c2c', '#3d1219', '#1f5fae', '#1b7a4a'];

/** Pilula de situacao: sempre com texto, a cor so reforca. */
function Selo({ ok, textoOk, textoFalta }: { ok: boolean; textoOk: string; textoFalta: string }) {
  return (
    <span className={ok ? 'r84-selo r84-selo-ok' : 'r84-selo r84-selo-falta'}>
      <Icone nome={ok ? 'check' : 'alerta'} tamanho={16} />
      <span>{ok ? textoOk : textoFalta}</span>
    </span>
  );
}

export default function CentralEmpreendimentosPage() {
  const empreendimentos = listarEmpreendimentos();

  return (
    <section className="r82-central">
      <CabecalhoPagina
        area="central"
        icone="predio"
        titulo="Central dos empreendimentos"
        descricao="Aqui ficam o CNPJ, o PIX, os materiais de venda e as postagens de cada empreendimento."
      />

      <AjudaPagina id="central" titulo="Como usar esta central" passos={PASSOS_CENTRAL} />

      {empreendimentos.length === 0 ? (
        <div className="r82-vazio">
          <span className="r84-icone-bloco r84-icone-bloco-lg r82-vazio-bloco" aria-hidden="true">
            <Icone nome="predio" tamanho={40} />
          </span>
          <p>Ainda não há empreendimentos nesta central.</p>
          <p className="r82-muted-line">Cadastre os dados de um empreendimento para ele aparecer aqui.</p>
          <Link href="/portal/atualizar" className="r84-btn">
            <span>Cadastrar dados</span>
            <Icone nome="setaDireita" tamanho={18} />
          </Link>
        </div>
      ) : (
        <div className="r82-grid">
          {empreendimentos.map((emp, indice) => {
            const situacao = statusDados(emp);
            const cor = CORES_CAPA[indice % CORES_CAPA.length];
            return (
              <article key={emp.id} className="r82-emp-card" aria-labelledby={`r82-emp-${emp.id}`}>
                <div className="r82-capa" style={{ backgroundColor: cor }} aria-hidden="true">
                  <Icone nome="predio" tamanho={44} />
                  <span className="r82-capa-status">{emp.status}</span>
                </div>

                <div className="r82-emp-corpo">
                  <div className="r82-emp-head">
                    <h2 id={`r82-emp-${emp.id}`}>{emp.nome}</h2>
                    <p className="r82-muted-line">{emp.bairro} · {emp.cidade}</p>
                  </div>

                  <ul className="r82-checklist" aria-label={`Situação dos dados de ${emp.nome}`}>
                    <li>
                      <Selo ok={situacao.cnpj} textoOk="CNPJ cadastrado" textoFalta="CNPJ: falta cadastrar" />
                    </li>
                    <li>
                      <Selo ok={situacao.pix} textoOk="PIX cadastrado" textoFalta="PIX: falta cadastrar" />
                    </li>
                    <li>
                      <Selo
                        ok={situacao.materiais > 0}
                        textoOk={`${situacao.materiais} ${situacao.materiais === 1 ? 'material' : 'materiais'}`}
                        textoFalta="Materiais: falta cadastrar"
                      />
                    </li>
                    <li>
                      <Selo
                        ok={situacao.postagens > 0}
                        textoOk={`${situacao.postagens} ${situacao.postagens === 1 ? 'postagem' : 'postagens'}`}
                        textoFalta="Postagens: falta cadastrar"
                      />
                    </li>
                  </ul>

                  <div className="r82-actions">
                    <Link href={`/portal/central/${emp.id}`} className="r84-btn" aria-label={`Abrir ${emp.nome}`}>
                      <span>Abrir</span>
                      <Icone nome="setaDireita" tamanho={18} />
                    </Link>
                    <Link href={`/portal/atualizar?emp=${emp.id}`} className="r84-btn-sec" aria-label={`Atualizar dados de ${emp.nome}`}>
                      <Icone nome="editar" tamanho={18} />
                      <span>Atualizar dados</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
