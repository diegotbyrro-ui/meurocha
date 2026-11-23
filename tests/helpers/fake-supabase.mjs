// Supabase falso, em memória, para testar os repositórios do portal sem rede.
// Suporta o subconjunto usado pelo portal: from().select/insert/update/upsert/delete,
// filtros eq/neq/in/is/ilike/or(simples)/order/limit/range, single/maybeSingle, rpc e auth.admin.
import { randomUUID } from 'node:crypto';

export function criarFakeSupabase(inicial = {}, { rpcs = {}, padroes = {} } = {}) {
  const tabelas = Object.fromEntries(Object.entries(inicial).map(([k, v]) => [k, v.map((r) => ({ ...r }))]));
  const usuarios = [];
  const chamadas = [];
  const tabela = (nome) => (tabelas[nome] ||= []);

  function builder(nome) {
    let op = 'select', payload = null, filtros = [], ordem = [], limite = null, faixa = null, modo = 'many', retornar = false, conflito = null, contar = false, total = null;
    const api = {
      select(_colunas, o = {}) { if (op !== 'select') retornar = true; if (o.count) contar = true; return api; },
      insert(v) { op = 'insert'; payload = v; return api; },
      update(v) { op = 'update'; payload = v; return api; },
      upsert(v, o = {}) { op = 'upsert'; payload = v; conflito = o.onConflict || 'id'; return api; },
      delete() { op = 'delete'; return api; },
      eq(c, v) { filtros.push((r) => r[c] === v); return api; },
      neq(c, v) { filtros.push((r) => r[c] !== v); return api; },
      in(c, arr) { filtros.push((r) => arr.includes(r[c])); return api; },
      is(c, v) { filtros.push((r) => (r[c] ?? null) === v); return api; },
      ilike(c, padrao) { const re = new RegExp('^' + String(padrao).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*') + '$', 'i'); filtros.push((r) => re.test(String(r[c] ?? ''))); return api; },
      or(expr) {
        const partes = String(expr).split(',').map((p) => p.split('.'));
        filtros.push((r) => partes.some(([c, o, ...v]) => { const val = v.join('.'); if (o === 'eq') return String(r[c]) === val; if (o === 'ilike') return new RegExp('^' + val.replace(/%/g, '.*') + '$', 'i').test(String(r[c] ?? '')); return false; }));
        return api;
      },
      order(c, o = {}) { ordem.push([c, o.ascending !== false]); return api; },
      limit(n) { limite = n; return api; },
      range(a, b) { faixa = [a, b]; return api; },
      single() { modo = 'single'; return api; },
      maybeSingle() { modo = 'maybe'; return api; },
      then(res, rej) { return Promise.resolve().then(executar).then(res, rej); },
    };
    function aplicarFiltros(linhas) { return linhas.filter((r) => filtros.every((f) => f(r))); }
    function executar() {
      chamadas.push({ tabela: nome, op });
      const t = tabela(nome);
      let dados;
      if (op === 'insert' || op === 'upsert') {
        const lista = (Array.isArray(payload) ? payload : [payload]).map((v) => ({ ...(padroes[nome]?.() || {}), id: v.id ?? randomUUID(), ...v }));
        dados = [];
        for (const linha of lista) {
          const chaves = String(conflito || 'id').split(',');
          const existente = op === 'upsert' ? t.find((r) => chaves.every((k) => r[k] === linha[k])) : null;
          if (existente) { Object.assign(existente, linha); dados.push({ ...existente }); }
          else { t.push(linha); dados.push({ ...linha }); }
        }
      } else if (op === 'update') {
        const alvo = aplicarFiltros(t);
        alvo.forEach((r) => Object.assign(r, payload));
        dados = alvo.map((r) => ({ ...r }));
      } else if (op === 'delete') {
        const alvo = aplicarFiltros(t);
        tabelas[nome] = t.filter((r) => !alvo.includes(r));
        dados = alvo.map((r) => ({ ...r }));
      } else {
        dados = aplicarFiltros(t).map((r) => ({ ...r }));
        for (const [c, asc] of [...ordem].reverse()) dados.sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1));
        total = dados.length;
        if (faixa) dados = dados.slice(faixa[0], faixa[1] + 1);
        if (limite !== null) dados = dados.slice(0, limite);
      }
      if (op !== 'select' && !retornar && modo === 'many') return { data: null, error: null };
      if (modo === 'single') return dados.length === 1 ? { data: dados[0], error: null } : { data: null, error: { message: 'Esperava 1 linha', code: 'PGRST116' } };
      if (modo === 'maybe') return { data: dados[0] ?? null, error: null };
      return contar ? { data: dados, error: null, count: total } : { data: dados, error: null };
    }
    return api;
  }

  return {
    tabelas,
    usuarios,
    chamadas,
    from: (nome) => builder(nome),
    rpc: async (nome, args) => {
      chamadas.push({ rpc: nome, args });
      if (rpcs[nome]) return { data: await rpcs[nome](args, tabelas), error: null };
      return { data: null, error: null };
    },
    auth: {
      admin: {
        async createUser({ email, password }) {
          if (usuarios.some((u) => u.email === email)) return { data: { user: null }, error: { message: 'User already registered' } };
          const user = { id: randomUUID(), email, password };
          usuarios.push(user);
          return { data: { user }, error: null };
        },
        async updateUserById(id, attrs) {
          const u = usuarios.find((x) => x.id === id);
          if (!u) return { data: { user: null }, error: { message: 'User not found' } };
          Object.assign(u, attrs);
          return { data: { user: u }, error: null };
        },
        async deleteUser(id) {
          const i = usuarios.findIndex((x) => x.id === id);
          if (i >= 0) usuarios.splice(i, 1);
          return { data: {}, error: null };
        },
      },
    },
  };
}
