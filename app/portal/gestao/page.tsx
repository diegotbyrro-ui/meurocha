import GestaoClient from '../../plataforma/gestao/GestaoClient';
import '../../plataforma/gestao/gestao.css';
import { exigirEquipe } from '@/lib/portal-guard';
export const dynamic='force-dynamic';
export default async function Gestao() {await exigirEquipe(); return <GestaoClient dentroDoPortal />;}
