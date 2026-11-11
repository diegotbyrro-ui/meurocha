import { NextRequest, NextResponse } from 'next/server';
import { calcularRascunho } from '@/lib/simulacao.mjs';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest){
  const headers={ 'Cache-Control':'no-store, max-age=0' };
  if (process.env.NODE_ENV==='production'||process.env.ROCHA_PREVIEW_MODE!=='true') {
    return NextResponse.json({error:'Função disponível apenas em homologação local'},{status:403,headers});
  }
  const tamanho=Number(request.headers.get('content-length')||'0');
  if (tamanho>2048) return NextResponse.json({error:'Requisição muito grande'},{status:413,headers});
  try{
    const dados=await request.json();
    if (!dados || typeof dados!=='object' || Array.isArray(dados)) throw new Error('Formato inválido');
    return NextResponse.json(calcularRascunho({preco:dados.preco,percentualEntrada:dados.percentualEntrada,desconto:dados.desconto}),{headers});
  }catch{
    return NextResponse.json({error:'Informe valores válidos para a demonstração'},{status:400,headers});
  }
}
