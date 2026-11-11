import { NextResponse } from 'next/server';
export const dynamic='force-dynamic';
export async function GET(){
  return NextResponse.json({sistema:'Plataforma Rocha',fase:'R1',modo:'sem-dados-reais',
    supabaseConectado:false,convitesIntegrados:false,autenticacaoAtiva:false,
    siteOriginal:'https://meurocha.com.br/home'},
    {headers:{'Cache-Control':'no-store, max-age=0'}});
}
