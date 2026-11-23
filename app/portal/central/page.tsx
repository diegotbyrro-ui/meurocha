import Link from 'next/link';
import { listarEmpreendimentos, statusDados } from '@/lib/empreendimentos-central.mjs';
import './central.css';

export const dynamic = 'force-dynamic';

export default function CentralEmpreendimentosPage() {
  const empreendimentos = listarEmpreendimentos();

  return (
    <section className="r82-central">
      <header className="r82-head">
        <span className="r82-kicker">CENTRAL DOS EMPREENDIMENTOS</span>
        <h1>Materiais e dados de cada empreendimento</h1>
        <p>Escolha um empreendimento para consultar CNPJ, PIX de pagamento, materiais de venda, vídeos, postagens mensais e o simulador de entrada.</p>
      </header>

      <div className="r82-grid">
        {empreendimentos.map((emp) => {
          const situacao = statusDados(emp);
          return (
            <Link key={emp.id} href={`/portal/central/${emp.id}`} className="r82-emp-card">
              <span className="r82-chip">{emp.status}</span>
              <h2>{emp.nome}</h2>
              <p className="r82-muted-line">{emp.bairro} · {emp.cidade}</p>
              <div className="r82-indicators">
                <span className="r82-ind">
                  <span className={`r82-dot ${situacao.cnpj ? 'is-ok' : 'is-pending'}`} aria-hidden="true" />
                  CNPJ {situacao.cnpj ? 'cadastrado' : 'pendente'}
                </span>
                <span className="r82-ind">
                  <span className={`r82-dot ${situacao.pix ? 'is-ok' : 'is-pending'}`} aria-hidden="true" />
                  PIX {situacao.pix ? 'cadastrado' : 'pendente'}
                </span>
                <span className="r82-ind">
                  <span className={`r82-dot ${situacao.materiais > 0 ? 'is-ok' : 'is-pending'}`} aria-hidden="true" />
                  {situacao.materiais} {situacao.materiais === 1 ? 'material' : 'materiais'}
                </span>
                <span className="r82-ind">
                  <span className={`r82-dot ${situacao.postagens > 0 ? 'is-ok' : 'is-pending'}`} aria-hidden="true" />
                  {situacao.postagens} {situacao.postagens === 1 ? 'postagem' : 'postagens'}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
