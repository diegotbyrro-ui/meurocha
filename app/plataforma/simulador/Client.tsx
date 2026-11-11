 'use client';
import { useState } from 'react';
type Resultado={precoLiquido:number,entrada:number,saldo:number,aviso:string};
const brl=(n:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
export default function SimuladorClient(){
  const [preco,setPreco]=useState('300000');
  const [pct,setPct]=useState('20');
  const [desconto,setDesconto]=useState('0');
  const [resultado,setResultado]=useState<Resultado|null>(null);
  const [erro,setErro]=useState('');const [carregando,setCarregando]=useState(false);
  async function calcular(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setErro('');setResultado(null);setCarregando(true);
    try{
      const r=await fetch('/api/preview/simulacao',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({preco:Number(preco),percentualEntrada:Number(pct),desconto:Number(desconto)})});
      const data=await r.json();if(!r.ok)throw new Error(data.error||'Erro ao simular');setResultado(data);
    }catch(e){setErro(e instanceof Error?e.message:'Não foi possível calcular');}finally{setCarregando(false);}
  }
  return <div className="two-col simulation-columns"><section className="panel"><div className="panel-head"><div><span className="eyebrow">TESTE DO MOTOR DE CÁLCULO</span><h2>Valores hipotéticos</h2></div></div><form onSubmit={calcular} className="sim-form"><label>Valor hipotético do imóvel (R$)<input inputMode="decimal" type="number" min="1" max="100000000" step="0.01" value={preco} onChange={e=>setPreco(e.target.value)} required /></label><label>Entrada (%)<input type="number" min="0" max="100" step="0.01" value={pct} onChange={e=>setPct(e.target.value)} required /></label><label>Desconto hipotético (R$)<input type="number" min="0" step="0.01" value={desconto} onChange={e=>setDesconto(e.target.value)} required /></label><button type="submit" className="btn-primary" disabled={carregando}>{carregando?'Calculando…':'Calcular teste'}</button>{erro&&<p role="alert" className="error-message">{erro}</p>}</form></section><section className="panel result-card"><span className="eyebrow">RESULTADO DIDÁTICO</span>{resultado?<><div className="result-row"><span>Valor após desconto</span><strong>{brl(resultado.precoLiquido)}</strong></div><div className="result-row"><span>Entrada calculada</span><strong>{brl(resultado.entrada)}</strong></div><div className="result-row"><span>Saldo restante</span><strong>{brl(resultado.saldo)}</strong></div><div className="warning">{resultado.aviso}</div></>:<div className="result-empty"><strong>Nenhuma simulação ainda</strong><p>Informe valores de teste. O servidor calculará a entrada e o saldo, sem juros ou dados oficiais.</p></div>}</section></div>
}
