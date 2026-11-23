import { SimuladorNativo } from '../../plataforma/simulador/SimuladorNativo';
import SimuladorEntradaClient from './SimuladorEntradaClient';
import './simulador-entrada.css';

export const dynamic = 'force-dynamic';

// R82: o simulador de entrada calcula a proposta no navegador, sem tabelas oficiais.
// O painel R6 (disponibilidade, CAIXA e evolução) segue disponível como prévia secundária.
export default async function Simulador({ searchParams }: { searchParams: Promise<{ emp?: string | string[] }> }) {
  const params = await searchParams;
  const emp = typeof params.emp === 'string' ? params.emp.slice(0, 60) : undefined;
  return <div className="rocha-portal-simulador">
    <SimuladorEntradaClient empreendimentoInicial={emp} />
    <details className="r82s-legado">
      <summary>Painel de disponibilidade, CAIXA e evolução da obra (prévia, aguardando integração com o CV CRM)</summary>
      <aside className="rocha-portal-notice">Simulador em prévia demonstrativa, sem conexão com taxas CAIXA, tabelas do CV CRM ou valores oficiais. Use apenas dados de teste.</aside>
      <SimuladorNativo />
    </details>
  </div>;
}
