import { SimuladorNativo } from './SimuladorNativo';

// R6: rota principal utiliza apenas a implementacao nativa.
// Dados comerciais CV CRM e regras oficiais CAIXA aguardam integracao verificada.
export default function PaginaSimuladorRocha() {
  return <SimuladorNativo />;
}
