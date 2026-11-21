import { bibliotecaCategorias } from '@/lib/biblioteca.mjs';
import BibliotecaClient from './BibliotecaClient';

export const dynamic = 'force-dynamic';

export default function Biblioteca() {
  return <BibliotecaClient categorias={bibliotecaCategorias} />;
}
