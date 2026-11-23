import { obterSessao } from '@/lib/portal-guard';
import DashboardClient from './DashboardClient';
import InicioCorretor from './InicioCorretor';

// R81: esta é uma demonstração local, sem publicação automática de tarefas,
// materiais, dados comerciais ou alterações em empreendimentos.
// R85: corretor vê o Início de corretor; a equipe Rocha vê o painel completo.
export default async function PortalIndex() {
  const sessao = await obterSessao();
  if (!sessao) return null; // o layout já barra quem não entrou
  if (sessao.t === 'corretor') return <InicioCorretor nome={sessao.nome} />;
  return <DashboardClient eu={{ id: sessao.id, nome: sessao.nome }} />;
}
