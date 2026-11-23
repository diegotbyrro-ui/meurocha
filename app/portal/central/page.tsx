import Link from 'next/link';
import AjudaPagina from '../ajuda/AjudaPagina';
import { listarEmpreendimentos, statusDados } from '@/lib/empreendimentos-central.mjs';
import './central.css';

export const dynamic = 'force-dynamic';

const PASSOS_CENTRAL: readonly string[] = [
  'Escolha o empreendimento na lista abaixo.',
  'Em Abrir, veja o CNPJ, a chave PIX, os materiais de venda e as postagens do mês.',
  'Se algum dado aparecer como falta cadastrar, toque em Atualizar dados e preencha o cadastro.',
];

export default function CentralEmpreendimentosPage() {
  const empreendimentos = listarEmpreendimentos();

  return (
    <section className="r82-central">
      <header className="r82-head">
        <h1>Central dos empreendimentos</h1>
        <p>Aqui ficam o CNPJ, o PIX, os materiais de venda e as postagens de cada empreendimento.</p>
      </header>

      <AjudaPagina id="central" titulo="Como usar esta central" passos={PASSOS_CENTRAL} />

      {empreendimentos.length === 0 ? (
        <div className="r82-empty-state">
          <p>Ainda não há empreendimentos nesta central.</p>
          <p>Cadastre os dados de um empreendimento para ele aparecer aqui.</p>
          <Link href="/portal/atualizar" className="r82-btn">Cadastrar dados</Link>
        </div>
      ) : (
        <div className="r82-grid">
          {empreendimentos.map((emp) => {
            const situacao = statusDados(emp);
            return (
              <article key={emp.id} className="r82-emp-card" aria-labelledby={`r82-emp-${emp.id}`}>
                <div className="r82-emp-head">
                  <h2 id={`r82-emp-${emp.id}`}>{emp.nome}</h2>
                  <p className="r82-muted-line">{emp.bairro} · {emp.cidade}</p>
                  <p className="r82-status-text">Status: {emp.status}</p>
                </div>
                <ul className="r82-checklist" aria-label={`Situação dos dados de ${emp.nome}`}>
                  <li>{situacao.cnpj ? 'CNPJ: cadastrado' : 'CNPJ: falta cadastrar'}</li>
                  <li>{situacao.pix ? 'PIX: cadastrado' : 'PIX: falta cadastrar'}</li>
                  <li>{`Materiais: ${situacao.materiais} ${situacao.materiais === 1 ? 'link' : 'links'}`}</li>
                  <li>{`Postagens: ${situacao.mesesComPostagem} ${situacao.mesesComPostagem === 1 ? 'mês' : 'meses'}`}</li>
                </ul>
                <div className="r82-actions">
                  <Link href={`/portal/central/${emp.id}`} className="r82-btn" aria-label={`Abrir ${emp.nome}`}>Abrir</Link>
                  <Link href={`/portal/atualizar?emp=${emp.id}`} className="r82-btn-secondary" aria-label={`Atualizar dados de ${emp.nome}`}>Atualizar dados</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
