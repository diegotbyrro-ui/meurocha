import { bibliotecaCategorias } from '@/lib/biblioteca.mjs';
import BibliotecaClient from './BibliotecaClient';
import { exigirEquipe } from '@/lib/portal-guard';

export const dynamic = 'force-dynamic';

export default async function Biblioteca() {
  await exigirEquipe();
  return <BibliotecaClient categorias={bibliotecaCategorias} />;
}
