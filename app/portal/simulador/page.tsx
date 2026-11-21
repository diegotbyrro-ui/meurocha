import { SimuladorNativo } from '../../plataforma/simulador/SimuladorNativo';
export const dynamic='force-dynamic';
export default function Simulador(){return <div className="rocha-portal-simulador">
  <aside className="rocha-portal-notice">Simulador em prévia demonstrativa, sem conexão com taxas CAIXA, tabelas do CV CRM ou valores oficiais. Use apenas dados de teste.</aside>
  <SimuladorNativo />
</div>}
