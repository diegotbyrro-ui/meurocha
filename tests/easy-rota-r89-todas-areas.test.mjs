import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const root='app/experiencia/easy-rota-do-mar/';
const client=read(root+'EasyRotaClient.tsx');
const editor=read(root+'anotacoes/Integradas.tsx');
const css=read(root+'anotacoes/integradas.css');

test('R89: botao funciona na abertura e no menu principal',()=>{
  assert.match(client,/\(!started \|\| centralMenuOpen\) && <button/);
  assert.match(client,/className="erm89-globalButton"/);
  assert.match(client,/id: 'tela:abertura'/);
  assert.match(client,/id: 'tela:menu'/);
  assert.match(client,/seletor: '\.erm23-splash'/);
  assert.match(client,/seletor: '\.erm25-centralMenu'/);
});
test('R89: botao lateral e mobile habilitados em todos os modulos',()=>{
  assert.match(client,/className="erm87-sideAnnotate" onClick=/);
  assert.match(client,/className="erm87-mobileAnnotate" onClick=/);
  assert.doesNotMatch(client,/className="erm87-sideAnnotate" disabled=/);
  assert.doesNotMatch(client,/className="erm87-mobileAnnotate" disabled=/);
  assert.match(client,/r88Context \|\| \{/);
  for(const section of ['localizacao','lazer','plantas','imagens','videos','ficha','institucional'])
    assert.ok(client.includes("{ id: '"+section+"'"),section);
  assert.match(client,/seletor: '\.erm20-main'/);
});
test('R89: editor unico para todos os contextos e navegacao por local',()=>{
  assert.match(client,/<AnotacoesIntegradas contexto=\{r89Context\}/);
  assert.equal((client.match(/<AnotacoesIntegradas\s/g)||[]).length,1);
  assert.match(client,/const r89Navegar/);
  assert.match(client,/r88Navegar\(nota\)/);
  assert.match(editor,/tela:\(\?:abertura\|menu/);
  assert.match(editor,/createPortal\(/);
  assert.match(editor,/localStorage\.setItem/);
});
test('R89: video pausa, mapa bloqueia interacao e guarda anotacoes',()=>{
  assert.match(client,/congelar: section === 'videos' \|\| section === 'localizacao'/);
  assert.match(editor,/querySelectorAll\('video'\)/);
  assert.match(editor,/video\.pause\(\)/);
  assert.match(editor,/erm89-bloqueio/);
  assert.match(css,/\.erm88-camada\.erm89-bloqueio\{pointer-events:auto/);
  assert.match(editor,/As setas são relativas à visão atual/);
  assert.doesNotMatch(editor,/\bfetch\s*\(|service_role|supabase/i);
});
