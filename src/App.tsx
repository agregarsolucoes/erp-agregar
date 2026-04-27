
import { useState, useEffect, useCallback } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://vikhnbvgjemmprpfxwif.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpa2huYnZnamVtbXBycGZ4d2lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNjMwNjcsImV4cCI6MjA5MjgzOTA2N30.OCZ3JMYl92wu-xwV6etOtXlR-2PQ6Rbro3Jw00fmz3k";

// ─── AUTH API (Supabase GoTrue) ───────────────────────────────────────────────
const AUTH_URL = `${SUPABASE_URL}/auth/v1`;

async function authFetch(path, body, token) {
  const res = await fetch(`${AUTH_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Erro de autenticação");
  return data;
}

const auth = {
  login:   (email, password)  => authFetch("/token?grant_type=password", { email, password }),
  logout:  (token)            => authFetch("/logout", {}, token),
  session: ()                 => {
    try { return JSON.parse(localStorage.getItem("erp_session") || "null"); } catch { return null; }
  },
  save:    (session)          => localStorage.setItem("erp_session", JSON.stringify(session)),
  clear:   ()                 => localStorage.removeItem("erp_session"),
};

// ─── REST API (usa token do usuário logado) ───────────────────────────────────
let _token = null;
function setToken(t) { _token = t; }

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${_token || SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || res.statusText);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

const api = {
  get:    (table, qs = "")  => sb(`${table}?${qs}`),
  post:   (table, body)     => sb(table, { method: "POST", body: JSON.stringify(body) }),
  patch:  (table, id, body) => sb(`${table}?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(body), prefer: "return=representation" }),
  delete: (table, id)       => sb(`${table}?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" }),
};

// ─── MOCK DATA (funciona sem Supabase para demonstração) ──────────────────────
const MOCK = {
  materiais: [
    { id:1,  codigo:"MP001", nome:"Chapa 14",                             especificacao:"Aço USI Civil 300 - 1,9 mm",              unidade:"kg", aplicacao:"Estrutura",  preco_alvo:5.44,   estoque_minimo:0, ativo:true },
    { id:2,  codigo:"MP002", nome:"Parafuso 5x16 7/8 polegada",           especificacao:"Parafuso zincado classe 8.8",             unidade:"un", aplicacao:"Fixação",    preco_alvo:0.16,   estoque_minimo:0, ativo:true },
    { id:3,  codigo:"MP003", nome:"Parafuso 5x16 2 polegadas",            especificacao:"Parafuso zincado classe 8.8",             unidade:"un", aplicacao:"Fixação",    preco_alvo:0.25,   estoque_minimo:0, ativo:true },
    { id:4,  codigo:"MP004", nome:"Porca 5x16 1 polegada",                especificacao:"Porca do Parafuso zincado classe 8.8",    unidade:"un", aplicacao:"Fixação",    preco_alvo:0.00,   estoque_minimo:0, ativo:true },
    { id:5,  codigo:"MP005", nome:"Porca 5x16 2 polegadas",               especificacao:"Porca do Parafuso zincado classe 8.8",   unidade:"un", aplicacao:"Fixação",    preco_alvo:0.08,   estoque_minimo:0, ativo:true },
    { id:6,  codigo:"MP006", nome:"Chumbador PBA 3/8x2.3/4 c/ porca e arruela","especificacao":"Aço zincado",                     unidade:"un", aplicacao:"Ancoragem",  preco_alvo:0.80,   estoque_minimo:0, ativo:true },
    { id:7,  codigo:"MP007", nome:"Chumbador PBA 1/2x2.3/4 c/ porca e arruela","especificacao":"Aço zincado",                     unidade:"un", aplicacao:"Ancoragem",  preco_alvo:1.45,   estoque_minimo:0, ativo:true },
    { id:8,  codigo:"MP008", nome:"TINNER",                               especificacao:"Produto químico para lavagem/desengraxe", unidade:"L",  aplicacao:"Lavagem",    preco_alvo:13.88,  estoque_minimo:0, ativo:true },
    { id:9,  codigo:"MP009", nome:"Decapante",                            especificacao:"Produto químico para lavagem/desengraxe", unidade:"L",  aplicacao:"Lavagem",    preco_alvo:24.00,  estoque_minimo:0, ativo:true },
    { id:10, codigo:"MP010", nome:"Arame MIG 1.0",                        especificacao:"ER70S-6",                                 unidade:"kg", aplicacao:"Solda",      preco_alvo:12.00,  estoque_minimo:0, ativo:true },
    { id:11, codigo:"MP011", nome:"Gás mistura para solda",               especificacao:"Mistura Argônio + CO2",                   unidade:"un", aplicacao:"Solda",      preco_alvo:300.00, estoque_minimo:0, ativo:true },
    { id:12, codigo:"MP012", nome:"Gás de queima por botijão",            especificacao:"GLP industrial",                          unidade:"un", aplicacao:"Corte",      preco_alvo:100.00, estoque_minimo:0, ativo:true },
    { id:13, codigo:"MP013", nome:"TINTA AZUL RAL 5002 (25 KG)",          especificacao:"Poliéster industrial",                    unidade:"cx", aplicacao:"Pintura",    preco_alvo:404.95, estoque_minimo:0, ativo:true },
    { id:14, codigo:"MP014", nome:"TINTA AMARELO RAL 1003 (25KG)",        especificacao:"Poliéster industrial",                    unidade:"cx", aplicacao:"Pintura",    preco_alvo:520.30, estoque_minimo:0, ativo:true },
    { id:15, codigo:"MP015", nome:"TINTA LARANJA RAL 2008 (25KG)",        especificacao:"Poliéster industrial",                    unidade:"cx", aplicacao:"Pintura",    preco_alvo:521.98, estoque_minimo:0, ativo:true },
    { id:16, codigo:"MP016", nome:"TINTA CINZA MUNSELL N6.5 (25KG)",      especificacao:"Poliéster industrial",                    unidade:"cx", aplicacao:"Pintura",    preco_alvo:404.95, estoque_minimo:0, ativo:true },
    { id:17, codigo:"MP017", nome:"QUEBRA DEDO",                          especificacao:"",                                        unidade:"un", aplicacao:"Fixação",    preco_alvo:0.57,   estoque_minimo:0, ativo:true },
  ],
  fornecedores: [
    { id:1, codigo:"F001", razao_social:"Aços Brasil Ltda", nome_fantasia:"AçosBR", cnpj:"12.345.678/0001-90", contato:"Carlos", telefone:"(11) 9999-0001", email:"carlos@acosbr.com", cidade_uf:"SP/SP", categoria:"Aço / Chapas", prazo_medio:30, status:"Ativo" },
    { id:2, codigo:"F002", razao_social:"Parafusos & Cia", nome_fantasia:"ParaCia", cnpj:"98.765.432/0001-10", contato:"Ana", telefone:"(11) 9888-0002", email:"ana@paracia.com", cidade_uf:"SP/SP", categoria:"Fixação", prazo_medio:15, status:"Ativo" },
    { id:3, codigo:"F003", razao_social:"MetalSupri Distribuidora", nome_fantasia:"MetalSupri", cnpj:"11.222.333/0001-44", contato:"Roberto", telefone:"(11) 9777-0003", email:"roberto@metalsupri.com", cidade_uf:"SP/SP", categoria:"Aço / Chapas", prazo_medio:20, status:"Ativo" },
  ],
  compras: [
    { id:1, codigo_material:"MP001", material:"Chapa 14", quantidade:500, criterio:"Menor Preço", fornecedor_escolhido:"F001", preco_escolhido:8.50, subtotal:4250, status:"A Emitir", data_recebimento:null, documento_nf:"" },
    { id:2, codigo_material:"MP013", material:"Tinta Azul RAL 5002 25kg", quantidade:10, criterio:"Score Inteligente", fornecedor_escolhido:"F002", preco_escolhido:390.00, subtotal:3900, status:"Concluído", data_recebimento:"2025-04-10", documento_nf:"NF-001234" },
  ],
  estoque: [
    { id:1,  codigo:"MP001", nome:"Chapa 14",                             unidade:"kg", saldo_inicial:0, entradas:0, saidas:0, estoque_atual:0, estoque_minimo:0, valor_unit:5.44,   localizacao:"" },
    { id:2,  codigo:"MP002", nome:"Parafuso 5x16 7/8 polegada",           unidade:"un", saldo_inicial:0, entradas:0, saidas:0, estoque_atual:0, estoque_minimo:0, valor_unit:0.16,   localizacao:"" },
    { id:3,  codigo:"MP003", nome:"Parafuso 5x16 2 polegadas",            unidade:"un", saldo_inicial:0, entradas:0, saidas:0, estoque_atual:0, estoque_minimo:0, valor_unit:0.25,   localizacao:"" },
    { id:4,  codigo:"MP004", nome:"Porca 5x16 1 polegada",                unidade:"un", saldo_inicial:0, entradas:0, saidas:0, estoque_atual:0, estoque_minimo:0, valor_unit:0.00,   localizacao:"" },
    { id:5,  codigo:"MP005", nome:"Porca 5x16 2 polegadas",               unidade:"un", saldo_inicial:0, entradas:0, saidas:0, estoque_atual:0, estoque_minimo:0, valor_unit:0.08,   localizacao:"" },
    { id:6,  codigo:"MP006", nome:"Chumbador PBA 3/8x2.3/4",              unidade:"un", saldo_inicial:0, entradas:0, saidas:0, estoque_atual:0, estoque_minimo:0, valor_unit:0.80,   localizacao:"" },
    { id:7,  codigo:"MP007", nome:"Chumbador PBA 1/2x2.3/4",              unidade:"un", saldo_inicial:0, entradas:0, saidas:0, estoque_atual:0, estoque_minimo:0, valor_unit:1.45,   localizacao:"" },
    { id:8,  codigo:"MP008", nome:"TINNER",                               unidade:"L",  saldo_inicial:0, entradas:0, saidas:0, estoque_atual:0, estoque_minimo:0, valor_unit:13.88,  localizacao:"" },
    { id:9,  codigo:"MP009", nome:"Decapante",                            unidade:"L",  saldo_inicial:0, entradas:0, saidas:0, estoque_atual:0, estoque_minimo:0, valor_unit:24.00,  localizacao:"" },
    { id:10, codigo:"MP010", nome:"Arame MIG 1.0",                        unidade:"kg", saldo_inicial:0, entradas:0, saidas:0, estoque_atual:0, estoque_minimo:0, valor_unit:12.00,  localizacao:"" },
    { id:11, codigo:"MP011", nome:"Gás mistura para solda",               unidade:"un", saldo_inicial:0, entradas:0, saidas:0, estoque_atual:0, estoque_minimo:0, valor_unit:300.00, localizacao:"" },
    { id:12, codigo:"MP012", nome:"Gás de queima por botijão",            unidade:"un", saldo_inicial:0, entradas:0, saidas:0, estoque_atual:0, estoque_minimo:0, valor_unit:100.00, localizacao:"" },
    { id:13, codigo:"MP013", nome:"TINTA AZUL RAL 5002 (25 KG)",          unidade:"cx", saldo_inicial:0, entradas:0, saidas:0, estoque_atual:0, estoque_minimo:0, valor_unit:404.95, localizacao:"" },
    { id:14, codigo:"MP014", nome:"TINTA AMARELO RAL 1003 (25KG)",        unidade:"cx", saldo_inicial:0, entradas:0, saidas:0, estoque_atual:0, estoque_minimo:0, valor_unit:520.30, localizacao:"" },
    { id:15, codigo:"MP015", nome:"TINTA LARANJA RAL 2008 (25KG)",        unidade:"cx", saldo_inicial:0, entradas:0, saidas:0, estoque_atual:0, estoque_minimo:0, valor_unit:521.98, localizacao:"" },
    { id:16, codigo:"MP016", nome:"TINTA CINZA MUNSELL N6.5 (25KG)",      unidade:"cx", saldo_inicial:0, entradas:0, saidas:0, estoque_atual:0, estoque_minimo:0, valor_unit:404.95, localizacao:"" },
    { id:17, codigo:"MP017", nome:"QUEBRA DEDO",                          unidade:"un", saldo_inicial:0, entradas:0, saidas:0, estoque_atual:0, estoque_minimo:0, valor_unit:0.57,   localizacao:"" },
  ],
  movimentacoes: [
    { id:1, data:"2025-04-10", tipo:"Entrada", documento:"NF-001234", codigo_material:"MP013", material:"Tinta Azul RAL 5002 25kg", unidade:"cx", quantidade:10, valor_unit:390.00, valor_total:3900, obra_cc:"", responsavel:"João", obs:"Recebimento compra" },
    { id:2, data:"2025-04-12", tipo:"Saída Obra", documento:"OS-045", codigo_material:"MP013", material:"Tinta Azul RAL 5002 25kg", unidade:"cx", quantidade:5, valor_unit:404.95, valor_total:2024.75, obra_cc:"Obra Centro SP", responsavel:"Pedro", obs:"Pintura estrutura" },
    { id:3, data:"2025-04-15", tipo:"Saída Interna", documento:"REQ-012", codigo_material:"MP001", material:"Chapa 14", unidade:"kg", quantidade:150, valor_unit:8.50, valor_total:1275, obra_cc:"Produção", responsavel:"Carlos", obs:"Corte programação" },
  ],
  // Tabela Relação Material × Fornecedor (base para Cotação Comparativa)
  relacao: [
    { id:1,  codigo_material:"MP001", codigo_fornecedor:"F001", preco:5.44,  lead_time:30, moq:100, qualidade:8, atendimento:9, status:"Ativo" },
    { id:2,  codigo_material:"MP001", codigo_fornecedor:"F002", preco:5.80,  lead_time:15, moq:50,  qualidade:7, atendimento:8, status:"Ativo" },
    { id:3,  codigo_material:"MP001", codigo_fornecedor:"F003", preco:5.60,  lead_time:20, moq:200, qualidade:9, atendimento:7, status:"Ativo" },
    { id:4,  codigo_material:"MP002", codigo_fornecedor:"F001", preco:0.16,  lead_time:30, moq:500, qualidade:8, atendimento:9, status:"Ativo" },
    { id:5,  codigo_material:"MP002", codigo_fornecedor:"F002", preco:0.14,  lead_time:10, moq:200, qualidade:9, atendimento:8, status:"Ativo" },
    { id:6,  codigo_material:"MP008", codigo_fornecedor:"F002", preco:13.88, lead_time:12, moq:10,  qualidade:8, atendimento:9, status:"Ativo" },
    { id:7,  codigo_material:"MP008", codigo_fornecedor:"F003", preco:14.50, lead_time:8,  moq:5,   qualidade:7, atendimento:8, status:"Ativo" },
    { id:8,  codigo_material:"MP010", codigo_fornecedor:"F002", preco:12.00, lead_time:12, moq:10,  qualidade:9, atendimento:9, status:"Ativo" },
    { id:9,  codigo_material:"MP010", codigo_fornecedor:"F003", preco:12.80, lead_time:8,  moq:5,   qualidade:8, atendimento:7, status:"Ativo" },
    { id:10, codigo_material:"MP013", codigo_fornecedor:"F001", preco:404.95,lead_time:25, moq:5,   qualidade:9, atendimento:8, status:"Ativo" },
    { id:11, codigo_material:"MP013", codigo_fornecedor:"F003", preco:415.00,lead_time:15, moq:3,   qualidade:8, atendimento:9, status:"Ativo" },
    { id:12, codigo_material:"MP014", codigo_fornecedor:"F001", preco:520.30,lead_time:25, moq:3,   qualidade:9, atendimento:8, status:"Ativo" },
    { id:13, codigo_material:"MP015", codigo_fornecedor:"F001", preco:521.98,lead_time:25, moq:3,   qualidade:9, atendimento:8, status:"Ativo" },
    { id:14, codigo_material:"MP016", codigo_fornecedor:"F001", preco:404.95,lead_time:25, moq:3,   qualidade:9, atendimento:8, status:"Ativo" },
    { id:15, codigo_material:"MP006", codigo_fornecedor:"F001", preco:0.80,  lead_time:20, moq:100, qualidade:7, atendimento:8, status:"Ativo" },
    { id:16, codigo_material:"MP006", codigo_fornecedor:"F002", preco:0.72,  lead_time:14, moq:50,  qualidade:8, atendimento:9, status:"Ativo" },
  ],
  // Histórico de preços (gerado a cada compra concluída)
  historico_precos: [
    { id:1,  data:"2024-08-15", codigo_material:"MP001", material:"Chapa 14",                    codigo_fornecedor:"F001", fornecedor:"Aços Brasil Ltda",        preco:4.90,   quantidade:300, nf:"NF-000891" },
    { id:2,  data:"2024-09-20", codigo_material:"MP001", material:"Chapa 14",                    codigo_fornecedor:"F001", fornecedor:"Aços Brasil Ltda",        preco:5.10,   quantidade:400, nf:"NF-000943" },
    { id:3,  data:"2024-10-05", codigo_material:"MP001", material:"Chapa 14",                    codigo_fornecedor:"F003", fornecedor:"MetalSupri Distribuidora",preco:5.30,   quantidade:250, nf:"NF-001012" },
    { id:4,  data:"2024-11-18", codigo_material:"MP001", material:"Chapa 14",                    codigo_fornecedor:"F001", fornecedor:"Aços Brasil Ltda",        preco:5.44,   quantidade:500, nf:"NF-001098" },
    { id:5,  data:"2025-01-10", codigo_material:"MP001", material:"Chapa 14",                    codigo_fornecedor:"F003", fornecedor:"MetalSupri Distribuidora",preco:5.60,   quantidade:200, nf:"NF-001187" },
    { id:6,  data:"2025-02-22", codigo_material:"MP001", material:"Chapa 14",                    codigo_fornecedor:"F001", fornecedor:"Aços Brasil Ltda",        preco:5.44,   quantidade:600, nf:"NF-001244" },
    { id:7,  data:"2025-04-10", codigo_material:"MP001", material:"Chapa 14",                    codigo_fornecedor:"F001", fornecedor:"Aços Brasil Ltda",        preco:5.44,   quantidade:500, nf:"NF-001334" },
    { id:8,  data:"2024-07-03", codigo_material:"MP013", material:"TINTA AZUL RAL 5002 (25 KG)", codigo_fornecedor:"F001", fornecedor:"Aços Brasil Ltda",        preco:380.00, quantidade:8,   nf:"NF-000820" },
    { id:9,  data:"2024-09-14", codigo_material:"MP013", material:"TINTA AZUL RAL 5002 (25 KG)", codigo_fornecedor:"F001", fornecedor:"Aços Brasil Ltda",        preco:392.00, quantidade:6,   nf:"NF-000951" },
    { id:10, data:"2024-12-02", codigo_material:"MP013", material:"TINTA AZUL RAL 5002 (25 KG)", codigo_fornecedor:"F003", fornecedor:"MetalSupri Distribuidora",preco:400.00, quantidade:10,  nf:"NF-001134" },
    { id:11, data:"2025-02-18", codigo_material:"MP013", material:"TINTA AZUL RAL 5002 (25 KG)", codigo_fornecedor:"F001", fornecedor:"Aços Brasil Ltda",        preco:398.00, quantidade:5,   nf:"NF-001231" },
    { id:12, data:"2025-04-10", codigo_material:"MP013", material:"TINTA AZUL RAL 5002 (25 KG)", codigo_fornecedor:"F001", fornecedor:"Aços Brasil Ltda",        preco:404.95, quantidade:10,  nf:"NF-001334" },
    { id:13, data:"2024-08-20", codigo_material:"MP010", material:"Arame MIG 1.0",               codigo_fornecedor:"F002", fornecedor:"Parafusos & Cia",         preco:10.50,  quantidade:15,  nf:"NF-000901" },
    { id:14, data:"2024-11-05", codigo_material:"MP010", material:"Arame MIG 1.0",               codigo_fornecedor:"F002", fornecedor:"Parafusos & Cia",         preco:11.20,  quantidade:20,  nf:"NF-001067" },
    { id:15, data:"2025-03-12", codigo_material:"MP010", material:"Arame MIG 1.0",               codigo_fornecedor:"F003", fornecedor:"MetalSupri Distribuidora",preco:12.00,  quantidade:25,  nf:"NF-001278" },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt_brl = v => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const fmt_num = v => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(v || 0);
const fmt_date = d => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";
const today = () => new Date().toISOString().split("T")[0];

// ─── DESIGN TOKENS — AGREGAR BRAND ──────────────────────────────────────────
const T = {
  dark:    "#1A1D23",       // fundo principal (mais escuro que o navy)
  surface: "#2B2F38",       // navy oficial Agregar
  card:    "#32373F",       // card ligeiramente mais claro
  border:  "#3E4350",       // borda sutil
  blue:    "#E0A85A",       // dourado Agregar (substitui azul como cor primária)
  blueL:   "#ECC07A",       // dourado claro
  orange:  "#E0A85A",       // alias dourado
  orangeL: "#ECC07A",
  green:   "#4CAF82",       // verde sucesso (mantido)
  red:     "#E05A5A",       // vermelho alerta
  yellow:  "#E0C45A",       // amarelo atenção
  teal:    "#5AADC8",       // azul info
  text:    "#F0EDE8",       // texto principal (quase branco)
  muted:   "#CCCCCC",       // cinza oficial Agregar
  white:   "#FFFFFF",
  gold:    "#E0A85A",       // atalho dourado
  goldL:   "#ECC07A",
  navy:    "#2B2F38",       // navy oficial
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Montserrat:wght@300;400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${T.dark};color:${T.text};font-family:'DM Sans',sans-serif;min-height:100vh}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:${T.dark}}
  ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
  .mono{font-family:'IBM Plex Mono',monospace}
  input,select,textarea{background:${T.dark};color:${T.text};border:1px solid ${T.border};border-radius:6px;padding:8px 12px;font-family:'Montserrat',sans-serif;font-size:13px;width:100%;outline:none;transition:border-color .15s}
  input:focus,select:focus,textarea:focus{border-color:${T.blue}}
  label{font-size:11px;font-weight:600;color:${T.muted};text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:4px}
  button{cursor:pointer;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:600;border:none;border-radius:6px;padding:8px 16px;transition:all .15s}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:${T.surface};color:${T.muted};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:10px 12px;text-align:left;border-bottom:1px solid ${T.border};white-space:nowrap}
  td{padding:10px 12px;border-bottom:1px solid ${T.border};vertical-align:middle}
  tr:hover td{background:rgba(255,255,255,.02)}
  .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap}
  .card{background:${T.card};border:1px solid ${T.border};border-radius:12px;padding:20px}
  .btn-primary{background:${T.blue};color:#fff}
  .btn-primary:hover{background:${T.blueL}}
  .btn-ghost{background:transparent;color:${T.muted};border:1px solid ${T.border}}
  .btn-ghost:hover{color:${T.text};border-color:${T.muted}}
  .btn-danger{background:transparent;color:${T.red};border:1px solid ${T.red}}
  .btn-danger:hover{background:${T.red};color:#fff}
  .btn-success{background:${T.green};color:#fff}
  .btn-success:hover{opacity:.9}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
  .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  @media(max-width:768px){
    .grid2,.grid3,.grid4{grid-template-columns:1fr}
    .sidebar-hide-mobile{display:none!important}
    .topbar-title{font-size:13px!important}
    table{font-size:11px}
    th,td{padding:7px 8px!important}
  }
  @media(max-width:480px){
    th,td{padding:5px 6px!important}
    h2{font-size:16px!important}
  }
  .fade-in{animation:fadeIn .25s ease}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .tag-ok{background:rgba(16,185,129,.15);color:${T.green}}
  .tag-crit{background:rgba(239,68,68,.15);color:${T.red}}
  .tag-warn{background:rgba(245,158,11,.15);color:${T.yellow}}
  .tag-blue{background:rgba(37,99,235,.15);color:${T.blueL}}
  .tag-orange{background:rgba(249,115,22,.15);color:${T.orange}}
  .tag-muted{background:rgba(100,116,139,.15);color:${T.muted}}
`;

// ─── BADGE STATUS ─────────────────────────────────────────────────────────────
function Badge({ v }) {
  const map = {
    "Concluído":  "tag-ok", "✔ OK": "tag-ok", "Ativo": "tag-ok", "Entrada": "tag-ok",
    "A Emitir":   "tag-warn", "⚠ Crítico": "tag-crit", "Zerado": "tag-crit",
    "Em Cotação": "tag-blue", "Enviado": "tag-blue", "Aprovado": "tag-blue",
    "Saída Obra": "tag-orange", "Saída Interna": "tag-orange",
    "Cancelado":  "tag-muted", "Inativo": "tag-muted", "Bloqueado": "tag-muted",
    "Ajuste +":   "tag-blue", "Ajuste -": "tag-warn",
    "Parcial":    "tag-warn",
  };
  const cls = map[v] || "tag-muted";
  return <span className={`badge ${cls}`}>{v}</span>;
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color = T.blue, icon }) {
  return (
    <div className="card fade-in" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".07em", marginBottom:6 }}>{label}</div>
          <div style={{ fontSize:26, fontWeight:700, color:T.white, fontFamily:"'IBM Plex Mono',monospace", lineHeight:1 }}>{value}</div>
          {sub && <div style={{ fontSize:11, color:T.muted, marginTop:6 }}>{sub}</div>}
        </div>
        <span style={{ fontSize:22, opacity:.6 }}>{icon}</span>
      </div>
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width = 600 }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fade-in" style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, width:"100%", maxWidth:width, maxHeight:"90vh", overflow:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 24px", borderBottom:`1px solid ${T.border}` }}>
          <span style={{ fontWeight:700, fontSize:15 }}>{title}</span>
          <button className="btn-ghost" style={{ padding:"4px 10px" }} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function Empty({ msg = "Nenhum registro encontrado." }) {
  return <div style={{ textAlign:"center", padding:"48px 0", color:T.muted, fontSize:13 }}>📭 {msg}</div>;
}

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────
function Search({ value, onChange, placeholder = "Buscar..." }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)}
      placeholder={`🔍  ${placeholder}`} style={{ maxWidth:300 }} />
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MÓDULO: DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
// ── Mini sparkline SVG ────────────────────────────────────────────────────────
function Spark({ values, color="#E0A85A", h=32 }) {
  if (!values || values.length < 2) return null;
  const W = 80;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v,i) =>
    `${((i/(values.length-1))*W).toFixed(1)},${(h - ((v-min)/range)*(h-4) - 2).toFixed(1)}`
  ).join(" ");
  return (
    <svg width={W} height={h} style={{ display:"block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinejoin="round" strokeLinecap="round" opacity="0.9"/>
      <circle cx={pts.split(" ").pop().split(",")[0]} cy={pts.split(" ").pop().split(",")[1]}
        r="2.5" fill={color}/>
    </svg>
  );
}

// ── KPI premium card ──────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, color, trend, spark, onClick }) {
  const isUp   = trend > 0;
  const isDown = trend < 0;
  return (
    <div onClick={onClick} style={{
      background: T.card, border:`1px solid ${T.border}`,
      borderRadius:14, padding:"18px 20px",
      borderTop:`3px solid ${color}`,
      cursor: onClick ? "pointer" : "default",
      transition:"transform .15s, box-shadow .15s",
      position:"relative", overflow:"hidden",
    }}
    onMouseEnter={e=>{ if(onClick){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 8px 24px rgba(0,0,0,.3)`; }}}
    onMouseLeave={e=>{ e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>
      {/* Glow de fundo */}
      <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80,
        borderRadius:"50%", background:color, opacity:.06, pointerEvents:"none" }}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div style={{ fontSize:10, fontWeight:700, color:T.muted, textTransform:"uppercase",
          letterSpacing:".09em", lineHeight:1.4, maxWidth:110 }}>{label}</div>
        <div style={{ fontSize:20, opacity:.75, flexShrink:0 }}>{icon}</div>
      </div>
      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:800, fontSize:22,
        color:T.white, letterSpacing:"-.02em", lineHeight:1, marginBottom:8 }}>{value}</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
        <div>
          {sub && <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>{sub}</div>}
          {trend !== undefined && (
            <div style={{ fontSize:11, fontWeight:600, marginTop:4,
              color: isUp ? T.green : isDown ? T.red : T.muted }}>
              {isUp ? "▲" : isDown ? "▼" : "—"} {Math.abs(trend)}% vs mês
            </div>
          )}
        </div>
        {spark && <Spark values={spark} color={color}/>}
      </div>
    </div>
  );
}

function Dashboard({ data }) {
  const { compras, estoque, movimentacoes } = data;
  const now = new Date();

  // ── Cálculos ────────────────────────────────────────────────────────────────
  const totalCompras  = compras.reduce((s,c) => s+(c.subtotal||0), 0);
  const aEmitir       = compras.filter(c=>c.status==="A Emitir").length;
  const concluidas    = compras.filter(c=>c.status==="Concluído").length;
  const emAndamento   = compras.filter(c=>!["Concluído","Cancelado","A Emitir"].includes(c.status)).length;

  const estoqueCalc = estoque.map(e => ({
    ...e,
    atual: (e.saldo_inicial||0)+(e.entradas||0)-(e.saidas||0),
    vt:    ((e.saldo_inicial||0)+(e.entradas||0)-(e.saidas||0))*(e.valor_unit||0),
  }));
  const valorEstoque  = estoqueCalc.reduce((s,e) => s+e.vt, 0);
  const criticos      = estoqueCalc.filter(e => e.atual < e.estoque_minimo && e.estoque_minimo > 0);
  const zerados       = estoqueCalc.filter(e => e.atual === 0 && e.estoque_minimo > 0).length;
  const giroEstoque   = estoqueCalc.filter(e=>e.saidas>0).length;

  const entradas      = movimentacoes.filter(m=>m.tipo==="Entrada");
  const saidas        = movimentacoes.filter(m=>m.tipo?.includes("Saída"));
  const totalEntradas = entradas.reduce((s,m)=>s+(m.valor_total||0),0);
  const totalSaidas   = saidas.reduce((s,m)=>s+(m.valor_total||0),0);
  const saldoLiq      = totalEntradas - totalSaidas;

  // Sparklines simulados (últimos 6 pontos com variação)
  const sparkCompras  = [totalCompras*.6, totalCompras*.7, totalCompras*.65, totalCompras*.8, totalCompras*.9, totalCompras||1];
  const sparkEstoque  = [valorEstoque*.8, valorEstoque*.85, valorEstoque*.9, valorEstoque*.88, valorEstoque*.95, valorEstoque||1];
  const sparkMov      = [2,3,2,4,3,movimentacoes.length||1];

  // Distribuição por status de compra
  const statusDistrib = ["A Emitir","Em Cotação","Enviado","Aprovado","Concluído","Cancelado"].map(s => ({
    label: s,
    count: compras.filter(c=>c.status===s).length,
    color: s==="Concluído"?T.green : s==="A Emitir"?T.red : s==="Cancelado"?T.muted : T.gold,
  })).filter(s=>s.count>0);

  const maxStatus = Math.max(...statusDistrib.map(s=>s.count), 1);

  // Top materiais em estoque por valor
  const topEstoque = [...estoqueCalc].sort((a,b)=>b.vt-a.vt).slice(0,5);

  const diasSemana = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const horaAtual  = now.getHours();
  const saudacao   = horaAtual < 12 ? "Bom dia" : horaAtual < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="fade-in" style={{ paddingBottom:32 }}>

      {/* ── Hero header ──────────────────────────────────────────────────────── */}
      <div style={{
        background:`linear-gradient(135deg, ${T.navy} 0%, #1A1D23 100%)`,
        border:`1px solid ${T.border}`, borderRadius:16, padding:"24px 28px",
        marginBottom:24, position:"relative", overflow:"hidden"
      }}>
        {/* Triângulo decorativo */}
        <svg style={{ position:"absolute", right:24, top:"50%", transform:"translateY(-50%)", opacity:.06 }}
          width="120" height="120" viewBox="0 0 100 100">
          <polygon points="50,5 95,90 5,90" fill="#E0A85A" stroke="#E0A85A" strokeWidth="2"/>
          <line x1="50" y1="5" x2="50" y2="90" stroke="#E0A85A" strokeWidth="1" opacity=".6"/>
          <line x1="27" y1="47" x2="73" y2="47" stroke="#E0A85A" strokeWidth="1" opacity=".6"/>
        </svg>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontSize:11, color:T.muted, fontWeight:600, letterSpacing:".1em",
                textTransform:"uppercase", marginBottom:6 }}>
                {diasSemana[now.getDay()]}, {now.toLocaleDateString("pt-BR",{day:"numeric",month:"long",year:"numeric"})}
              </div>
              <div style={{ fontSize:22, fontWeight:800, color:T.white, marginBottom:4 }}>
                {saudacao}, <span style={{ color:T.gold }}>Agregar</span> 👋
              </div>
              <div style={{ fontSize:13, color:T.muted }}>
                Visão geral do ERP — dados em tempo real
              </div>
            </div>
            {/* Saúde geral */}
            <div style={{ background:"rgba(255,255,255,.04)", border:`1px solid ${T.border}`,
              borderRadius:12, padding:"14px 20px", textAlign:"center", flexShrink:0 }}>
              <div style={{ fontSize:10, color:T.muted, textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>Saúde Geral</div>
              <div style={{ fontSize:28, fontWeight:800, color: criticos.length===0 ? T.green : criticos.length<3 ? T.gold : T.red }}>
                {criticos.length===0 ? "✔" : criticos.length<3 ? "⚠" : "✖"}
              </div>
              <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>
                {criticos.length===0 ? "Operacional" : `${criticos.length} alertas`}
              </div>
            </div>
          </div>

          {/* Quick stats inline */}
          <div style={{ display:"flex", gap:24, marginTop:20, flexWrap:"wrap" }}>
            {[
              { label:"Compras ativas", val: compras.length, color: T.gold },
              { label:"Itens em estoque", val: estoque.length, color: T.teal },
              { label:"Movimentações", val: movimentacoes.length, color: T.green },
              { label:"Alertas críticos", val: criticos.length, color: criticos.length>0 ? T.red : T.green },
            ].map((s,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:s.color, flexShrink:0 }}/>
                <span style={{ fontSize:12, color:T.muted }}>{s.label}:</span>
                <span style={{ fontSize:12, fontWeight:700, color:s.color,
                  fontFamily:"'IBM Plex Mono',monospace" }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Linha 1: KPIs principais 4 colunas ───────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14, marginBottom:14 }}>
        <KpiCard label="Valor em Estoque"   value={fmt_brl(valorEstoque)}    icon="💎" color={T.gold}   spark={sparkEstoque} trend={5}  />
        <KpiCard label="Total em Compras"   value={fmt_brl(totalCompras)}    icon="🛒" color={T.teal}   spark={sparkCompras} trend={12} />
        <KpiCard label="Saldo Movim."       value={fmt_brl(saldoLiq)}        icon="⚖️" color={saldoLiq>=0?T.green:T.red} trend={saldoLiq>=0?3:-5} />
        <KpiCard label="Itens Críticos"     value={criticos.length}          icon="🚨" color={criticos.length>0?T.red:T.green} sub={criticos.length>0?"Reposição urgente":"Estoque saudável"} />
      </div>

      {/* ── Linha 2: KPIs secundários ─────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10, marginBottom:24 }}>
        {[
          { label:"A Emitir",      value:aEmitir,         icon:"📋", color:aEmitir>0?T.red:T.muted    },
          { label:"Em Andamento",  value:emAndamento,     icon:"⏳", color:T.gold                      },
          { label:"Concluídas",    value:concluidas,       icon:"✅", color:T.green                    },
          { label:"Itens Zerados", value:zerados,          icon:"⬜", color:zerados>0?T.yellow:T.muted },
          { label:"Com Giro",      value:giroEstoque,      icon:"🔄", color:T.teal                     },
          { label:"Fornecedores",  value:data.fornecedores?.filter(f=>f.status==="Ativo").length||0, icon:"🏢", color:T.muted },
        ].map((k,i) => (
          <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10,
            padding:"12px 14px", borderLeft:`3px solid ${k.color}` }}>
            <div style={{ fontSize:9, color:T.muted, textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>{k.label}</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:800, fontSize:20, color:k.color }}>{k.value}</span>
              <span style={{ fontSize:18, opacity:.6 }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Linha 3: Distribuição status + Top estoque ────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>

        {/* Distribuição status compras */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 20px" }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Status das Compras</div>
          <div style={{ fontSize:11, color:T.muted, marginBottom:16 }}>Distribuição por etapa</div>
          {statusDistrib.length === 0
            ? <div style={{ color:T.muted, fontSize:12, textAlign:"center", padding:"20px 0" }}>Nenhuma compra registrada</div>
            : statusDistrib.map((s,i) => (
              <div key={i} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:12, color:T.text }}>{s.label}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:s.color,
                    fontFamily:"'IBM Plex Mono',monospace" }}>{s.count}</span>
                </div>
                <div style={{ height:6, background:T.border, borderRadius:3 }}>
                  <div style={{ height:"100%", borderRadius:3,
                    width:`${(s.count/maxStatus)*100}%`,
                    background:s.color, transition:"width .5s ease" }}/>
                </div>
              </div>
            ))
          }
          {/* Gráfico de rosca simplificado */}
          {compras.length > 0 && (
            <div style={{ display:"flex", gap:8, marginTop:16, flexWrap:"wrap" }}>
              {statusDistrib.map((s,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:s.color }}/>
                  <span style={{ fontSize:10, color:T.muted }}>{s.label} ({Math.round(s.count/compras.length*100)}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 5 materiais por valor em estoque */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 20px" }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Top Materiais em Estoque</div>
          <div style={{ fontSize:11, color:T.muted, marginBottom:16 }}>Por valor total (R$)</div>
          {topEstoque.length === 0
            ? <div style={{ color:T.muted, fontSize:12, textAlign:"center", padding:"20px 0" }}>Estoque não configurado</div>
            : topEstoque.map((e,i) => {
              const pct = valorEstoque > 0 ? (e.vt/valorEstoque*100) : 0;
              const cores = [T.gold, T.teal, T.green, "#8B80F8", T.muted];
              return (
                <div key={i} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, gap:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, minWidth:0 }}>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10,
                        color:cores[i], fontWeight:700, flexShrink:0 }}>{e.codigo}</span>
                      <span style={{ fontSize:11, color:T.text, overflow:"hidden",
                        textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.nome}</span>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color:cores[i],
                      fontFamily:"'IBM Plex Mono',monospace", flexShrink:0 }}>{fmt_brl(e.vt)}</span>
                  </div>
                  <div style={{ height:4, background:T.border, borderRadius:2 }}>
                    <div style={{ height:"100%", borderRadius:2, width:`${pct}%`,
                      background:cores[i], opacity:.85 }}/>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* ── Linha 4: Alertas + Movimentações recentes ────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns: criticos.length>0 ? "1fr 1.5fr" : "1fr", gap:16 }}>

        {/* Alertas de reposição */}
        {criticos.length > 0 && (
          <div style={{ background:T.card, border:`1px solid rgba(224,90,90,.3)`,
            borderRadius:14, padding:"18px 20px", borderTop:`3px solid ${T.red}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:T.red,
                boxShadow:`0 0 8px ${T.red}` }}/>
              <span style={{ fontWeight:700, fontSize:14 }}>Reposição Urgente</span>
              <span style={{ background:"rgba(224,90,90,.15)", color:T.red, fontSize:10,
                fontWeight:700, padding:"2px 8px", borderRadius:10 }}>{criticos.length}</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {criticos.slice(0,5).map(e => {
                const repor = Math.max(0, e.estoque_minimo - e.atual);
                const pct   = e.estoque_minimo > 0 ? Math.min((e.atual/e.estoque_minimo)*100, 100) : 0;
                return (
                  <div key={e.id} style={{ background:T.surface, borderRadius:10, padding:"10px 12px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <div>
                        <span className="mono" style={{ fontSize:10, color:T.gold, fontWeight:700 }}>{e.codigo}</span>
                        <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{e.nome}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:11, color:T.red, fontWeight:700 }}>{fmt_num(e.atual)} {e.unidade}</div>
                        <div style={{ fontSize:10, color:T.muted }}>repor {fmt_num(repor)}</div>
                      </div>
                    </div>
                    <div style={{ height:4, background:T.border, borderRadius:2 }}>
                      <div style={{ height:"100%", borderRadius:2, width:`${pct}%`,
                        background: pct<30?T.red : pct<60?T.yellow : T.green }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Movimentações recentes */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>Movimentações Recentes</div>
              <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{movimentacoes.length} registros no total</div>
            </div>
            <div style={{ display:"flex", gap:12 }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:9, color:T.muted, textTransform:"uppercase", letterSpacing:".07em" }}>Entradas</div>
                <div style={{ fontSize:13, fontWeight:700, color:T.green,
                  fontFamily:"'IBM Plex Mono',monospace" }}>{fmt_brl(totalEntradas)}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:9, color:T.muted, textTransform:"uppercase", letterSpacing:".07em" }}>Saídas</div>
                <div style={{ fontSize:13, fontWeight:700, color:T.red,
                  fontFamily:"'IBM Plex Mono',monospace" }}>{fmt_brl(totalSaidas)}</div>
              </div>
            </div>
          </div>
          {movimentacoes.length === 0
            ? <div style={{ color:T.muted, fontSize:12, textAlign:"center", padding:"32px 0" }}>
                Nenhuma movimentação registrada ainda
              </div>
            : <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {[...movimentacoes].reverse().slice(0,6).map((m,i) => {
                  const isEnt = m.tipo==="Entrada" || m.tipo==="Ajuste +";
                  const cor   = isEnt ? T.green : m.tipo?.includes("Ajuste") ? T.teal : T.red;
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
                      padding:"8px 10px", background:T.surface, borderRadius:9,
                      borderLeft:`3px solid ${cor}` }}>
                      <div style={{ flexShrink:0, width:6, height:6, borderRadius:"50%",
                        background:cor, boxShadow:`0 0 5px ${cor}` }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:T.text,
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {m.material || "—"}
                        </div>
                        <div style={{ fontSize:10, color:T.muted, display:"flex", gap:8 }}>
                          <span>{fmt_date(m.data)}</span>
                          {m.obra_cc && <span>· {m.obra_cc}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <Badge v={m.tipo}/>
                        <div style={{ fontSize:11, fontWeight:700, color:cor,
                          fontFamily:"'IBM Plex Mono',monospace", marginTop:3 }}>
                          {fmt_brl(m.valor_total||0)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MÓDULO: COMPRAS
// ══════════════════════════════════════════════════════════════════════════════
function Compras({ data, setData }) {
  const [search, setSearch] = useState("");
  const [modal, setModal]   = useState(null); // null | "new" | {row}
  const [form, setForm]     = useState({});

  const filtered = data.compras.filter(c =>
    [c.codigo_material, c.material, c.fornecedor_escolhido, c.status]
      .join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setForm({ criterio:"Menor Preço", status:"A Emitir", data_recebimento:"", documento_nf:"" });
    setModal("new");
  };

  const openEdit = row => { setForm({ ...row }); setModal(row); };

  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const reload = async () => {
    try {
      const compras = await api.get("compras","order=criado_em.desc");
      if (compras.length) setData(d => ({...d, compras}));
    } catch {}
  };

  const save = async () => {
    setSaving(true); setSaveErr("");
    try {
      const sub = (parseFloat(form.quantidade)||0) * (parseFloat(form.preco_escolhido)||0);
      const statusAuto = form.data_recebimento ? "Concluído" : "A Emitir";
      const payload = {
        codigo_material:      form.codigo_material || "",
        material:             form.material || "",
        quantidade:           parseFloat(form.quantidade) || 0,
        criterio:             form.criterio || "Menor Preço",
        fornecedor_escolhido: form.fornecedor_escolhido || "",
        preco_escolhido:      parseFloat(form.preco_escolhido) || 0,
        subtotal:             sub,
        status:               statusAuto,
        data_recebimento:     form.data_recebimento || null,
        documento_nf:         form.documento_nf || "",
      };
      if (modal === "new") {
        await api.post("compras", payload);
      } else {
        await api.patch("compras", form.id, payload);
      }
      await reload();
      setModal(null);
    } catch(e) {
      setSaveErr(e.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm("Excluir esta compra?")) return;
    try { await api.delete("compras", id); await reload(); }
    catch(e) { alert("Erro: " + e.message); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const CRITERIOS = ["Menor Preço","Menor Prazo","Score Inteligente"];
  const STATUS    = ["A Emitir","Em Cotação","Enviado","Aprovado","Parcial","Concluído","Cancelado"];

  return (
    <div className="fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, marginBottom:2 }}>Central de Compras</h2>
          <p style={{ color:T.muted, fontSize:13 }}>{data.compras.length} pedidos · {data.compras.filter(c=>c.status==="A Emitir").length} a emitir</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nova Compra</button>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
        <Search value={search} onChange={setSearch} placeholder="Buscar por material, fornecedor, status..." />
        <select style={{ width:160 }} value={""} onChange={e => setSearch(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding:0 }}>
        <table>
          <thead><tr>
            <th>#</th><th>Material</th><th>Qtd.</th><th>Critério</th>
            <th>Fornecedor</th><th>Preço Unit.</th><th>Subtotal</th>
            <th>Status</th><th>Recebimento</th><th style={{width:80}}/>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={10}><Empty msg="Nenhuma compra encontrada."/></td></tr>}
            {filtered.map((c, i) => (
              <tr key={c.id}>
                <td style={{ color:T.muted, fontSize:11 }}>{i+1}</td>
                <td>
                  <div style={{ fontWeight:600 }}>{c.material}</div>
                  <div className="mono" style={{ fontSize:10, color:T.muted }}>{c.codigo_material}</div>
                </td>
                <td className="mono">{fmt_num(c.quantidade)}</td>
                <td><span className="badge tag-blue">{c.criterio}</span></td>
                <td>{c.fornecedor_escolhido}</td>
                <td className="mono">{fmt_brl(c.preco_escolhido)}</td>
                <td className="mono" style={{ fontWeight:700, color:T.white }}>{fmt_brl(c.subtotal)}</td>
                <td><Badge v={c.status}/></td>
                <td style={{ color: c.data_recebimento ? T.green : T.muted, fontSize:12 }}>
                  {c.data_recebimento ? fmt_date(c.data_recebimento) : "Pendente"}
                </td>
                <td>
                  <div style={{ display:"flex", gap:4 }}>
                    <button className="btn-ghost" style={{ padding:"4px 8px", fontSize:11 }} onClick={() => openEdit(c)}>✏️</button>
                    <button className="btn-danger" style={{ padding:"4px 8px", fontSize:11 }} onClick={() => del(c.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal === "new" ? "Nova Compra" : "Editar Compra"} onClose={() => setModal(null)} width={680}>
          <div className="grid2" style={{ gap:16 }}>
            <div><label>Código do Material *</label><input value={form.codigo_material||""} onChange={e=>f("codigo_material",e.target.value)} placeholder="MP001"/></div>
            <div><label>Nome do Material *</label><input value={form.material||""} onChange={e=>f("material",e.target.value)} /></div>
            <div><label>Quantidade *</label><input type="number" value={form.quantidade||""} onChange={e=>f("quantidade",+e.target.value)} /></div>
            <div><label>Critério de Seleção</label>
              <select value={form.criterio||"Menor Preço"} onChange={e=>f("criterio",e.target.value)}>
                {CRITERIOS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label>Cód. Fornecedor Escolhido</label><input value={form.fornecedor_escolhido||""} onChange={e=>f("fornecedor_escolhido",e.target.value)} placeholder="F001"/></div>
            <div><label>Preço Unitário (R$)</label><input type="number" step="0.01" value={form.preco_escolhido||""} onChange={e=>f("preco_escolhido",+e.target.value)} /></div>
            <div>
              <label>Data de Recebimento</label>
              <input type="date" value={form.data_recebimento||""} onChange={e=>f("data_recebimento",e.target.value)} />
              <div style={{ fontSize:10, color:T.teal, marginTop:4 }}>📌 Preencher ao receber a mercadoria. Status vai para "Concluído" automaticamente.</div>
            </div>
            <div><label>Documento / NF</label><input value={form.documento_nf||""} onChange={e=>f("documento_nf",e.target.value)} placeholder="NF-00000"/></div>
          </div>
          {form.quantidade > 0 && form.preco_escolhido > 0 && (
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:14, marginTop:16, display:"flex", justifyContent:"space-between" }}>
              <span style={{ color:T.muted }}>Subtotal calculado:</span>
              <span style={{ fontWeight:700, fontSize:18, fontFamily:"'IBM Plex Mono',monospace", color:T.white }}>{fmt_brl(form.quantidade * form.preco_escolhido)}</span>
            </div>
          )}
          {saveErr && <div style={{ color:T.red, fontSize:12, marginTop:10, background:"rgba(224,90,90,.1)", padding:"8px 12px", borderRadius:6 }}>{saveErr}</div>}
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:20 }}>
            <button className="btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn-primary" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MÓDULO: PEDIDO DE COMPRA
// ══════════════════════════════════════════════════════════════════════════════
function PedidoCompra({ data }) {
  const [fornCod, setFornCod] = useState("");
  const [itens, setItens]     = useState([{ cod:"", desc:"", spec:"", und:"", qtd:"", preco:"", preco_alvo:0 }]);

  const forn = data.fornecedores.find(f => f.codigo === fornCod.toUpperCase());
  const total = itens.reduce((s, i) => s + (parseFloat(i.qtd)||0) * (parseFloat(i.preco)||0), 0);
  const numPedido = `${new Date().getFullYear()}-PC-${String(Date.now()).slice(-4)}`;

  const addLinha = () => setItens(p => [...p, { cod:"", desc:"", spec:"", und:"", qtd:"", preco:"", preco_alvo:0 }]);
  const delItem = i => setItens(p => p.filter((_, j) => j!==i));

  // Quando usuário digita o código — busca automática no cadastro de materiais
  const setCod = (i, cod) => {
    const codUp = cod.toUpperCase();
    const mat = data.materiais.find(m => m.codigo === codUp);
    setItens(p => p.map((x, j) => j !== i ? x : {
      ...x,
      cod:        codUp,
      desc:       mat ? mat.nome          : x.desc,
      spec:       mat ? mat.especificacao : x.spec,
      und:        mat ? mat.unidade       : x.und,
      preco:      mat && mat.preco_alvo > 0 ? String(mat.preco_alvo) : x.preco,
      preco_alvo: mat ? (mat.preco_alvo || 0) : 0,
    }));
  };

  const setItem = (i, k, v) => setItens(p => p.map((x, j) => j===i ? {...x,[k]:v} : x));

  const print = () => {
    const w = window.open("", "_blank");
    const itensFiltrados = itens.filter(i => i.cod || i.desc);
    const dataEmissao = new Date().toLocaleDateString("pt-BR", {day:"2-digit",month:"long",year:"numeric"});
    const dataValidade = new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString("pt-BR");
    const horaEmissao = new Date().toLocaleTimeString("pt-BR", {hour:"2-digit",minute:"2-digit"});

    const logoSVG = `<svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="30" stroke="#CCCCCC" stroke-width="3" fill="none" opacity="0.4"/>
      <polygon points="50,15 85,78 15,78" fill="none" stroke="#E0A85A" stroke-width="4" stroke-linejoin="round"/>
      <polygon points="50,15 85,78 15,78" fill="#E0A85A" opacity="0.1"/>
      <line x1="50" y1="15" x2="50" y2="78" stroke="#E0A85A" stroke-width="2" opacity="0.6"/>
      <line x1="32" y1="52" x2="68" y2="52" stroke="#E0A85A" stroke-width="2" opacity="0.6"/>
      <line x1="41" y1="65" x2="59" y2="65" stroke="#E0A85A" stroke-width="1.5" opacity="0.5"/>
    </svg>`;

    const watermarkSVG = `<svg style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.04;pointer-events:none;z-index:0" width="500" height="500" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,5 95,90 5,90" fill="#E0A85A" stroke="#E0A85A" stroke-width="1"/>
      <line x1="50" y1="5" x2="50" y2="90" stroke="#E0A85A" stroke-width="0.5"/>
      <line x1="27" y1="47" x2="73" y2="47" stroke="#E0A85A" stroke-width="0.5"/>
      <text x="50" y="108" text-anchor="middle" fill="#E0A85A" font-size="8" font-family="Arial" font-weight="bold" letter-spacing="4">AGREGAR</text>
    </svg>`;

    const rows = itensFiltrados.map((i, idx) => {
      const sub = (parseFloat(i.qtd)||0)*(parseFloat(i.preco)||0);
      const rowBg = idx % 2 === 0 ? "#fff" : "#f9f7f4";
      return `<tr style="background:${rowBg}">
        <td style="text-align:center;color:#888;font-size:11px">${idx+1}</td>
        <td style="font-family:monospace;font-weight:bold;color:#2B2F38;font-size:12px">${i.cod||"—"}</td>
        <td><span style="font-weight:600;color:#1a1a1a">${i.desc||"—"}</span>${i.spec ? `<br><span style="font-size:10px;color:#888">${i.spec}</span>` : ""}</td>
        <td style="text-align:center;color:#555">${i.und||"—"}</td>
        <td style="text-align:center;font-weight:600">${i.qtd||"—"}</td>
        <td style="text-align:right;font-family:monospace">R$ ${parseFloat(i.preco||0).toFixed(2)}</td>
        <td style="text-align:right;font-family:monospace;font-weight:700;color:#2B2F38">R$ ${sub.toFixed(2)}</td>
      </tr>`;
    }).join("");

    w.document.write(`<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8"/>
<title>Pedido ${numPedido} — Agregar Soluções</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Montserrat', Arial, sans-serif; font-size: 14px; color: #333; background: #fff; position: relative; }
  .page { padding: 18mm 16mm; width: 210mm; min-height: 297mm; margin: 0 auto; position: relative; z-index: 1; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 3px solid #E0A85A; margin-bottom: 18px; }
  .logo-area { display: flex; align-items: center; gap: 14px; }
  .company-name { font-size: 24px; font-weight: 800; color: #2B2F38; letter-spacing: .04em; }
  .company-sub { font-size: 11px; color: #888; font-weight: 600; letter-spacing: .15em; text-transform: uppercase; margin-top: 3px; }
  .company-info { font-size: 12px; color: #666; margin-top: 8px; line-height: 1.7; }
  .pedido-box { text-align: right; }
  .pedido-num { font-size: 26px; font-weight: 800; color: #2B2F38; font-family: monospace; }
  .pedido-label { font-size: 11px; color: #E0A85A; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; margin-bottom: 4px; }
  .pedido-data { font-size: 12px; color: #888; margin-top: 4px; }
  .status-badge { display:inline-block; background:#E0A85A; color:#2B2F38; font-size:11px; font-weight:800; padding:4px 12px; border-radius:20px; letter-spacing:.08em; margin-top:6px; }
  .section-title { font-size: 11px; font-weight: 700; color: #E0A85A; text-transform: uppercase; letter-spacing: .15em; margin-bottom: 10px; margin-top: 20px; display: flex; align-items: center; gap: 8px; }
  .section-title::after { content: ""; flex: 1; height: 1px; background: #e8e4dc; }
  .forn-box { background: #f9f7f4; border: 1px solid #e8e4dc; border-left: 4px solid #E0A85A; border-radius: 6px; padding: 14px 18px; display: grid; grid-template-columns: 2fr 1fr 2fr 1fr; gap: 14px; }
  .forn-field label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: .1em; display: block; margin-bottom: 4px; }
  .forn-field span { font-size: 13px; font-weight: 600; color: #2B2F38; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  thead tr { background: #2B2F38; }
  thead th { color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; padding: 11px 12px; text-align: left; }
  tbody td { padding: 11px 12px; border-bottom: 1px solid #f0ece4; font-size: 13px; }
  tfoot tr { background: #2B2F38; }
  tfoot td { padding: 13px 12px; color: #fff; font-weight: 700; font-size: 14px; }
  .total-val { font-size: 18px; font-family: monospace; color: #E0A85A; }
  .conditions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-top: 16px; }
  .condition-box { background: #f9f7f4; border: 1px solid #e8e4dc; border-radius: 6px; padding: 12px 16px; }
  .condition-box label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: .1em; display: block; margin-bottom: 5px; }
  .condition-box span { font-size: 14px; font-weight: 600; color: #2B2F38; }
  .signatures { display: flex; gap: 40px; margin-top: 60px; }
  .sig-line { flex: 1; border-top: 1.5px solid #ccc; padding-top: 10px; text-align: center; font-size: 12px; color: #888; }
  .sig-name { font-size: 13px; font-weight: 600; color: #2B2F38; margin-bottom: 3px; }
  .footer { margin-top: 32px; padding-top: 14px; border-top: 1px solid #e8e4dc; display: flex; justify-content: space-between; align-items: center; }
  .footer-left { font-size: 11px; color: #999; line-height: 1.7; }
  .footer-right { font-size: 11px; color: #ccc; text-align: right; }
  .gold { color: #E0A85A; }
  .navy { color: #2B2F38; }
  @media print {
    @page { size: A4; margin: 0; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 14mm 14mm; }
  }
</style>
</head>
<body>
${watermarkSVG}
<div class="page">

  <!-- CABEÇALHO -->
  <div class="header">
    <div class="logo-area">
      ${logoSVG}
      <div>
        <div class="company-name">AGREGAR</div>
        <div class="company-sub">Soluções Engenharia</div>
        <div class="company-info">
          CNPJ: 12.247.899/0001-20<br>
          Razão Social: Agregar Soluções Engenharia Ltda
        </div>
      </div>
    </div>
    <div class="pedido-box">
      <div class="pedido-label">Pedido de Compra</div>
      <div class="pedido-num">${numPedido}</div>
      <div class="pedido-data">Emitido em ${dataEmissao} às ${horaEmissao}</div>
      <div class="status-badge">ABERTO</div>
    </div>
  </div>

  <!-- FORNECEDOR -->
  <div class="section-title">Dados do Fornecedor</div>
  <div class="forn-box">
    <div class="forn-field"><label>Razão Social</label><span>${forn?.razao_social || fornCod || "—"}</span></div>
    <div class="forn-field"><label>CNPJ</label><span>${forn?.cnpj || "—"}</span></div>
    <div class="forn-field"><label>E-mail</label><span>${forn?.email || "—"}</span></div>
    <div class="forn-field"><label>Telefone</label><span>${forn?.telefone || "—"}</span></div>
    <div class="forn-field"><label>Contato</label><span>${forn?.contato || "—"}</span></div>
    <div class="forn-field"><label>Cidade / UF</label><span>${forn?.cidade_uf || "—"}</span></div>
  </div>

  <!-- CONDIÇÕES -->
  <div class="section-title">Condições Comerciais</div>
  <div class="conditions">
    <div class="condition-box"><label>Validade da Cotação</label><span>${dataValidade}</span></div>
    <div class="condition-box"><label>Prazo de Entrega</label><span>${forn?.prazo_medio ? forn.prazo_medio + " dias" : "A definir"}</span></div>
    <div class="condition-box"><label>Condição de Pagamento</label><span>A definir</span></div>
  </div>

  <!-- ITENS -->
  <div class="section-title">Itens do Pedido</div>
  <table>
    <thead>
      <tr>
        <th style="width:30px;text-align:center">#</th>
        <th style="width:90px">Código</th>
        <th>Descrição / Especificação</th>
        <th style="width:50px;text-align:center">Un.</th>
        <th style="width:70px;text-align:center">Qtd.</th>
        <th style="width:110px;text-align:right">Preço Unit.</th>
        <th style="width:110px;text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>${rows.length ? rows : '<tr><td colspan="7" style="text-align:center;color:#999;padding:20px">Nenhum item informado</td></tr>'}</tbody>
    <tfoot>
      <tr>
        <td colspan="5" style="text-align:right;font-size:11px;letter-spacing:.05em">TOTAL GERAL DO PEDIDO</td>
        <td></td>
        <td style="text-align:right" class="total-val">R$ ${total.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- OBSERVAÇÕES -->
  <div class="section-title">Observações</div>
  <div style="background:#f9f7f4;border:1px solid #e8e4dc;border-radius:6px;padding:12px 16px;min-height:50px;font-size:11px;color:#666;line-height:1.6">
    Este pedido de compra está sujeito à aprovação interna. Favor confirmar disponibilidade e prazo de entrega antes do faturamento.
  </div>

  <!-- ASSINATURAS -->
  <div class="signatures">
    <div class="sig-line"><div class="sig-name">Solicitante</div>Nome / Data</div>
    <div class="sig-line"><div class="sig-name">Aprovação Gerencial</div>Nome / Data</div>
    <div class="sig-line"><div class="sig-name">Fornecedor</div>Nome / CNPJ / Carimbo</div>
  </div>

  <!-- RODAPÉ -->
  <div class="footer">
    <div class="footer-left">
      <strong class="gold">AGREGAR SOLUÇÕES ENGENHARIA LTDA</strong><br>
      CNPJ: 12.247.899/0001-20 · Documento gerado em ${dataEmissao} às ${horaEmissao}<br>
      Este documento é válido apenas com assinatura e aprovação das partes.
    </div>
    <div class="footer-right">
      Pedido <strong>${numPedido}</strong><br>
      Página 1 de 1
    </div>
  </div>

</div>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 800);
  };

  return (
    <div className="fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, marginBottom:2 }}>Pedido de Compra</h2>
          <p style={{ color:T.muted, fontSize:13 }}>Gere e imprima pedidos para enviar ao fornecedor</p>
        </div>
        <button className="btn-success" onClick={print}>🖨 Imprimir / PDF</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
        <div className="card">
          <div style={{ fontWeight:700, marginBottom:14, fontSize:13, color:T.muted, textTransform:"uppercase", letterSpacing:".07em" }}>Dados do Pedido</div>
          <div className="grid2" style={{ gap:10 }}>
            <div><label>Nº do Pedido</label><input value={numPedido} readOnly style={{ color:T.muted }} /></div>
            <div><label>Data de Emissão</label><input value={new Date().toLocaleDateString("pt-BR")} readOnly style={{ color:T.muted }} /></div>
          </div>
        </div>
        <div className="card">
          <div style={{ fontWeight:700, marginBottom:14, fontSize:13, color:T.muted, textTransform:"uppercase", letterSpacing:".07em" }}>Fornecedor</div>
          <div><label>Código do Fornecedor *</label>
            <input value={fornCod} onChange={e=>setFornCod(e.target.value.toUpperCase())} placeholder="F001" />
          </div>
          {forn && (
            <div style={{ marginTop:10, background:T.surface, borderRadius:8, padding:12, fontSize:12 }}>
              <div style={{ fontWeight:600, color:T.white }}>{forn.razao_social}</div>
              <div style={{ color:T.muted, marginTop:2 }}>{forn.contato} · {forn.telefone}</div>
              <div style={{ color:T.muted }}>{forn.email}</div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px", borderBottom:`1px solid ${T.border}` }}>
          <span style={{ fontWeight:700 }}>Itens do Pedido</span>
          <button className="btn-ghost" style={{ fontSize:12 }} onClick={addLinha}>+ Adicionar Linha</button>
        </div>
        <table>
          <thead><tr><th>#</th><th>Cód. Material</th><th>Descrição / Especificação</th><th style={{width:60}}>Un.</th><th>Qtd.</th><th>Preço Unit. (R$)</th><th>Subtotal</th><th style={{width:40}}/></tr></thead>
          <tbody>
            {itens.map((item, i) => {
              const subtotal = (parseFloat(item.qtd)||0) * (parseFloat(item.preco)||0);
              const economia = item.preco_alvo > 0 ? (item.preco_alvo - parseFloat(item.preco||0)) * (parseFloat(item.qtd)||0) : null;
              const acimaTeto = item.preco_alvo > 0 && parseFloat(item.preco||0) > item.preco_alvo;
              return (
                <tr key={i}>
                  <td style={{ color:T.muted, fontSize:11 }}>{i+1}</td>
                  <td>
                    <input value={item.cod}
                      onChange={e => setCod(i, e.target.value)}
                      placeholder="MP001"
                      style={{ width:90, borderColor: item.cod && item.desc ? T.green : undefined }}
                    />
                    {item.cod && !item.desc && (
                      <div style={{ fontSize:9, color:T.red, marginTop:2 }}>Código não encontrado</div>
                    )}
                  </td>
                  <td>
                    <input value={item.desc} onChange={e=>setItem(i,"desc",e.target.value)}
                      placeholder="Descrição do material"
                      style={{ color: item.desc ? T.green : T.muted }}
                    />
                    {item.spec && <div style={{ fontSize:10, color:T.muted, marginTop:2, paddingLeft:2 }}>{item.spec}</div>}
                  </td>
                  <td>
                    <input value={item.und} onChange={e=>setItem(i,"und",e.target.value)}
                      style={{ width:60, color:T.muted, textAlign:"center" }} placeholder="un"/>
                  </td>
                  <td>
                    <input type="number" value={item.qtd}
                      onChange={e=>setItem(i,"qtd",e.target.value)}
                      style={{ width:80 }}/>
                  </td>
                  <td>
                    <div style={{ position:"relative" }}>
                      <input type="number" step="0.01" value={item.preco}
                        onChange={e=>setItem(i,"preco",e.target.value)}
                        style={{ width:120, borderColor: acimaTeto ? T.red : item.preco ? T.green : undefined,
                          paddingRight: item.preco_alvo > 0 ? 4 : undefined }}
                      />
                      {item.preco_alvo > 0 && (
                        <div style={{ fontSize:9, marginTop:3, display:"flex", alignItems:"center", gap:4 }}>
                          <span style={{ color:T.muted }}>Alvo:</span>
                          <span style={{ color:T.gold, fontWeight:700, fontFamily:"'IBM Plex Mono',monospace" }}>
                            {fmt_brl(item.preco_alvo)}
                          </span>
                          {acimaTeto && <span style={{ color:T.red }}>⚠ acima</span>}
                          {!acimaTeto && item.preco && <span style={{ color:T.green }}>✓</span>}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="mono" style={{ fontWeight:700, color: acimaTeto ? T.red : T.white }}>
                      {fmt_brl(subtotal)}
                    </div>
                    {economia !== null && parseFloat(item.qtd) > 0 && (
                      <div style={{ fontSize:9, color: economia >= 0 ? T.green : T.red, marginTop:2 }}>
                        {economia >= 0 ? `↓ economia ${fmt_brl(economia)}` : `↑ custo extra ${fmt_brl(Math.abs(economia))}`}
                      </div>
                    )}
                  </td>
                  <td>
                    <button className="btn-danger" style={{ padding:"4px 8px", fontSize:11 }} onClick={()=>delItem(i)}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ display:"flex", justifyContent:"flex-end", padding:"16px 20px", borderTop:`1px solid ${T.border}` }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 24px", display:"flex", gap:24, alignItems:"center" }}>
            <span style={{ color:T.muted, fontSize:13 }}>Total Geral</span>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:22, fontWeight:700, color:T.white }}>{fmt_brl(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MÓDULO: ESTOQUE
// ══════════════════════════════════════════════════════════════════════════════
function Estoque({ data, setData }) {
  const [search, setSearch] = useState("");
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState({});

  const estoqueCalc = data.estoque.map(e => ({
    ...e,
    estoque_atual: (e.saldo_inicial||0) + (e.entradas||0) - (e.saidas||0),
    valor_total:   ((e.saldo_inicial||0)+(e.entradas||0)-(e.saidas||0)) * (e.valor_unit||0),
    status: e.estoque_minimo === 0 ? "—"
      : ((e.saldo_inicial||0)+(e.entradas||0)-(e.saidas||0)) === 0 ? "Zerado"
      : ((e.saldo_inicial||0)+(e.entradas||0)-(e.saidas||0)) < e.estoque_minimo ? "⚠ Crítico"
      : "✔ OK"
  }));

  const filtered = estoqueCalc.filter(e =>
    [e.codigo, e.nome, e.localizacao, e.status].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = row => { setForm({...row}); setModal(row); };
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const save = async () => {
    setSaving(true); setSaveErr("");
    try {
      const payload = {
        saldo_inicial:  parseFloat(form.saldo_inicial) || 0,
        estoque_minimo: parseFloat(form.estoque_minimo) || 0,
        valor_unit:     parseFloat(form.valor_unit) || 0,
        localizacao:    form.localizacao || "",
      };
      await api.patch("estoque", form.id, payload);
      const est = await api.get("estoque","order=codigo");
      if (est.length) setData(d => ({...d, estoque: est}));
      setModal(null);
    } catch(e) {
      setSaveErr(e.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };
  const f = (k,v) => setForm(p => ({...p,[k]:v}));

  const totalValor   = estoqueCalc.reduce((s,e) => s+(e.valor_total||0), 0);
  const totalCritico = estoqueCalc.filter(e => e.status==="⚠ Crítico").length;
  const totalZerado  = estoqueCalc.filter(e => e.status==="Zerado").length;

  const statusColor = s => s==="⚠ Crítico" ? T.red : s==="Zerado" ? T.yellow : s==="✔ OK" ? T.green : T.muted;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Controle de Estoque</h2>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color:T.muted }}>{estoqueCalc.length} itens cadastrados</span>
            {totalCritico > 0 && <span style={{ fontSize:12, color:T.red, fontWeight:600 }}>⚠ {totalCritico} crítico(s)</span>}
            {totalZerado  > 0 && <span style={{ fontSize:12, color:T.yellow, fontWeight:600 }}>○ {totalZerado} zerado(s)</span>}
            <span style={{ fontSize:12, color:T.green, fontWeight:600 }}>{fmt_brl(totalValor)} em estoque</span>
          </div>
        </div>
        <Search value={search} onChange={setSearch} placeholder="Código, material, localização..." />
      </div>

      {/* Cards de estoque — layout responsivo em grade */}
      {filtered.length === 0
        ? <Empty/>
        : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:12 }}>
            {filtered.map(e => {
              const pct = e.estoque_minimo > 0 ? Math.min((e.estoque_atual / e.estoque_minimo) * 100, 100) : 100;
              const barColor = e.status==="⚠ Crítico" ? T.red : e.status==="Zerado" ? T.yellow : T.green;
              return (
                <div key={e.id} className="card" style={{
                  borderLeft:`3px solid ${statusColor(e.status)}`,
                  padding:"14px 16px", position:"relative"
                }}>
                  {/* Linha 1 — código + nome + editar */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                        <span className="mono" style={{ fontSize:11, color:T.blueL, fontWeight:700, flexShrink:0 }}>{e.codigo}</span>
                        <span style={{ fontSize:10, color:T.muted, background:T.surface, padding:"1px 7px", borderRadius:10, flexShrink:0 }}>{e.unidade}</span>
                        <Badge v={e.status}/>
                      </div>
                      <div style={{ fontWeight:600, fontSize:13, color:T.white, lineHeight:1.3 }}>{e.nome}</div>
                      {e.localizacao && <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>📍 {e.localizacao}</div>}
                    </div>
                    <button className="btn-ghost" style={{ padding:"4px 8px", fontSize:12, flexShrink:0, marginLeft:8 }} onClick={()=>openEdit(e)}>✏️</button>
                  </div>

                  {/* Linha 2 — métricas principais */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10 }}>
                    <div style={{ background:T.surface, borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                      <div style={{ fontSize:10, color:T.muted, marginBottom:2 }}>Atual</div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:800, fontSize:16,
                        color: e.status==="⚠ Crítico" ? T.red : e.status==="Zerado" ? T.yellow : T.white }}>
                        {fmt_num(e.estoque_atual)}
                      </div>
                    </div>
                    <div style={{ background:T.surface, borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                      <div style={{ fontSize:10, color:T.muted, marginBottom:2 }}>Mínimo</div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:600, fontSize:14, color:T.muted }}>
                        {fmt_num(e.estoque_minimo)}
                      </div>
                    </div>
                    <div style={{ background:T.surface, borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                      <div style={{ fontSize:10, color:T.muted, marginBottom:2 }}>Valor Total</div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:12, color:T.green }}>
                        {fmt_brl(e.valor_total)}
                      </div>
                    </div>
                  </div>

                  {/* Barra de nível */}
                  {e.estoque_minimo > 0 && (
                    <div>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:10, color:T.muted }}>Nível vs mínimo</span>
                        <span style={{ fontSize:10, color:barColor, fontWeight:600 }}>{Math.round(pct)}%</span>
                      </div>
                      <div style={{ height:5, background:T.border, borderRadius:3 }}>
                        <div style={{ height:"100%", borderRadius:3, width:`${pct}%`,
                          background:barColor, transition:"width .4s" }}/>
                      </div>
                    </div>
                  )}

                  {/* Linha 3 — entradas / saídas / valor unit */}
                  <div style={{ display:"flex", gap:12, marginTop:10, paddingTop:10, borderTop:`1px solid ${T.border}`, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, color:T.muted }}>
                      ⬆ <span style={{ color:T.green }}>{fmt_num(e.entradas)}</span>
                    </span>
                    <span style={{ fontSize:11, color:T.muted }}>
                      ⬇ <span style={{ color:T.orange }}>{fmt_num(e.saidas)}</span>
                    </span>
                    <span style={{ fontSize:11, color:T.muted }}>
                      Saldo ini.: <span style={{ color:T.text }}>{fmt_num(e.saldo_inicial)}</span>
                    </span>
                    <span style={{ fontSize:11, color:T.muted, marginLeft:"auto" }}>
                      <span style={{ color:T.blueL, fontWeight:600 }}>{fmt_brl(e.valor_unit)}</span>/un
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

      {modal && (
        <Modal title="Editar Item de Estoque" onClose={() => setModal(null)} width={480}>
          <div style={{ background:T.surface, borderRadius:8, padding:12, marginBottom:16, display:"flex", gap:10, alignItems:"center" }}>
            <span className="mono" style={{ fontSize:11, color:T.blueL, fontWeight:700, background:T.card, padding:"3px 8px", borderRadius:6 }}>{form.codigo}</span>
            <span style={{ fontWeight:700, fontSize:14 }}>{form.nome}</span>
          </div>
          <div className="grid2" style={{ gap:12 }}>
            <div><label>Saldo Inicial</label><input type="number" step="0.01" value={form.saldo_inicial||0} onChange={e=>f("saldo_inicial",e.target.value)} /></div>
            <div><label>Estoque Mínimo</label><input type="number" step="0.01" value={form.estoque_minimo||0} onChange={e=>f("estoque_minimo",e.target.value)} /></div>
            <div><label>Valor Unitário (R$)</label><input type="number" step="0.01" value={form.valor_unit||0} onChange={e=>f("valor_unit",e.target.value)} /></div>
            <div><label>Localização</label><input value={form.localizacao||""} onChange={e=>f("localizacao",e.target.value)} placeholder="Galpão A / Prateleira B2" /></div>
          </div>
          <div style={{ fontSize:11, color:T.teal, marginTop:12, background:"rgba(20,184,166,.08)", padding:"8px 12px", borderRadius:6 }}>
            ℹ️ Entradas e Saídas são registradas pela aba Movimentações e atualizadas automaticamente aqui.
          </div>
          {saveErr && <div style={{ color:T.red, fontSize:12, marginTop:10, background:"rgba(224,90,90,.1)", padding:"8px 12px", borderRadius:6 }}>{saveErr}</div>}
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:20 }}>
            <button className="btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn-primary" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MÓDULO: MOVIMENTAÇÕES
// ══════════════════════════════════════════════════════════════════════════════
function Movimentacoes({ data, setData }) {
  const [search, setSearch] = useState("");
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState({});

  const filtered = data.movimentacoes.filter(m =>
    [m.tipo, m.codigo_material, m.material, m.obra_cc, m.responsavel, m.documento]
      .join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const openNew = () => {
    setForm({ data: today(), tipo:"Entrada", documento:"", codigo_material:"", material:"", unidade:"", quantidade:"", valor_unit:"", obra_cc:"", responsavel:"", obs:"" });
    setModal("new"); setSaveErr("");
  };

  const save = async () => {
    const mat = data.materiais.find(m => m.codigo === form.codigo_material?.toUpperCase());
    setSaving(true); setSaveErr("");
    try {
      const payload = {
        data:            form.data || today(),
        tipo:            form.tipo || "Entrada",
        documento:       form.documento || "",
        codigo_material: form.codigo_material?.toUpperCase() || "",
        material:        form.material || mat?.nome || "",
        unidade:         form.unidade || mat?.unidade || "",
        quantidade:      parseFloat(form.quantidade) || 0,
        valor_unit:      parseFloat(form.valor_unit) || 0,
        obra_cc:         form.obra_cc || "",
        responsavel:     form.responsavel || "",
        obs:             form.obs || "",
      };
      await api.post("movimentacoes", payload);
      // Recarregar movimentações e estoque do banco
      const [movs, est] = await Promise.all([
        api.get("movimentacoes","order=data.desc"),
        api.get("estoque","order=codigo"),
      ]);
      setData(d => ({
        ...d,
        movimentacoes: movs.length ? movs : d.movimentacoes,
        estoque:       est.length  ? est  : d.estoque,
      }));
      setModal(null);
    } catch(e) {
      setSaveErr(e.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const f = (k,v) => setForm(p => ({...p,[k]:v}));
  const TIPOS = ["Entrada","Saída Obra","Saída Interna","Ajuste +","Ajuste -"];

  const rowBg = tipo => {
    if (tipo === "Entrada") return "rgba(16,185,129,.07)";
    if (tipo?.includes("Saída")) return "rgba(249,115,22,.07)";
    if (tipo?.includes("Ajuste")) return "rgba(139,92,246,.07)";
    return "transparent";
  };

  return (
    <div className="fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, marginBottom:2 }}>Movimentações de Estoque</h2>
          <p style={{ color:T.muted, fontSize:13 }}>Central única de lançamentos — entradas, saídas por obra e ajustes</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nova Movimentação</button>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        <Search value={search} onChange={setSearch} placeholder="Buscar por tipo, material, obra..." />
        {["Entrada","Saída Obra","Saída Interna","Ajuste +","Ajuste -"].map(t => (
          <button key={t} className="btn-ghost" style={{ fontSize:11, padding:"5px 10px" }}
            onClick={() => setSearch(t)}>
            <Badge v={t}/>
          </button>
        ))}
        <button className="btn-ghost" style={{ fontSize:11 }} onClick={() => setSearch("")}>Todos</button>
      </div>

      <div className="card" style={{ padding:0 }}>
        <table>
          <thead><tr>
            <th>Data</th><th>Tipo</th><th>Documento</th><th>Material</th>
            <th>Un.</th><th>Qtd.</th><th>Valor Unit.</th><th>Valor Total</th>
            <th>Obra / CC</th><th>Responsável</th><th>Obs.</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={11}><Empty msg="Nenhuma movimentação encontrada."/></td></tr>}
            {[...filtered].reverse().map(m => (
              <tr key={m.id} style={{ background: rowBg(m.tipo) }}>
                <td style={{ color:T.muted, fontSize:12 }}>{fmt_date(m.data)}</td>
                <td><Badge v={m.tipo}/></td>
                <td className="mono" style={{ fontSize:11, color:T.muted }}>{m.documento||"—"}</td>
                <td>
                  <div style={{ fontWeight:500 }}>{m.material}</div>
                  <div className="mono" style={{ fontSize:10, color:T.muted }}>{m.codigo_material}</div>
                </td>
                <td style={{ color:T.muted }}>{m.unidade}</td>
                <td className="mono" style={{ fontWeight:600 }}>{fmt_num(m.quantidade)}</td>
                <td className="mono">{fmt_brl(m.valor_unit)}</td>
                <td className="mono" style={{ fontWeight:700 }}>{fmt_brl(m.valor_total)}</td>
                <td style={{ color:T.muted, fontSize:12 }}>{m.obra_cc||"—"}</td>
                <td style={{ color:T.muted, fontSize:12 }}>{m.responsavel||"—"}</td>
                <td style={{ color:T.muted, fontSize:11, maxWidth:160 }}>{m.obs||"—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Nova Movimentação" onClose={() => setModal(null)} width={680}>
          <div className="grid3" style={{ gap:12 }}>
            <div><label>Data *</label><input type="date" value={form.data||today()} onChange={e=>f("data",e.target.value)} /></div>
            <div><label>Tipo *</label>
              <select value={form.tipo||"Entrada"} onChange={e=>f("tipo",e.target.value)}>
                {TIPOS.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label>Documento / NF</label><input value={form.documento||""} onChange={e=>f("documento",e.target.value)} placeholder="NF-0000 / OS-000"/></div>
            <div><label>Código do Material *</label>
              <input value={form.codigo_material||""} onChange={e=>{
                const v = e.target.value.toUpperCase();
                const mat = data.materiais.find(m=>m.codigo===v);
                setForm(p=>({...p, codigo_material:v, material:mat?.nome||p.material, unidade:mat?.unidade||p.unidade}));
              }} placeholder="MP001" />
            </div>
            <div><label>Material</label><input value={form.material||""} onChange={e=>f("material",e.target.value)} /></div>
            <div><label>Unidade</label><input value={form.unidade||""} onChange={e=>f("unidade",e.target.value)} style={{ width:80 }} /></div>
            <div><label>Quantidade *</label><input type="number" step="0.01" value={form.quantidade||""} onChange={e=>f("quantidade",e.target.value)} /></div>
            <div><label>Valor Unitário (R$)</label><input type="number" step="0.01" value={form.valor_unit||""} onChange={e=>f("valor_unit",e.target.value)} /></div>
            <div><label>Obra / Centro de Custo</label><input value={form.obra_cc||""} onChange={e=>f("obra_cc",e.target.value)} placeholder="Obra Centro SP" /></div>
            <div><label>Responsável</label><input value={form.responsavel||""} onChange={e=>f("responsavel",e.target.value)} /></div>
            <div style={{ gridColumn:"span 2" }}><label>Observações</label><input value={form.obs||""} onChange={e=>f("obs",e.target.value)} /></div>
          </div>
          {form.quantidade && form.valor_unit && (
            <div style={{ background:T.surface, borderRadius:8, padding:12, marginTop:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ color:T.muted, fontSize:12 }}>Valor Total</span>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:18 }}>{fmt_brl((parseFloat(form.quantidade)||0)*(parseFloat(form.valor_unit)||0))}</span>
            </div>
          )}
          <div style={{ fontSize:11, marginTop:12, color:T.teal }}>
            ℹ️ Saída Obra e Saída Interna descontam do estoque automaticamente.
          </div>
          {saveErr && <div style={{ color:T.red, fontSize:12, marginTop:10, background:"rgba(224,90,90,.1)", padding:"8px 12px", borderRadius:6 }}>{saveErr}</div>}
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:20 }}>
            <button className="btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn-primary" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MÓDULO: MATERIAIS
// ══════════════════════════════════════════════════════════════════════════════
function Materiais({ data, setData }) {
  const [search, setSearch] = useState("");
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState({});

  const filtered = data.materiais.filter(m =>
    [m.codigo, m.nome, m.aplicacao, m.unidade].join(" ").toLowerCase().includes(search.toLowerCase())
  );
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const reload = async () => {
    try {
      const mats = await api.get("materiais","order=codigo");
      if (mats.length) setData(d => ({...d, materiais: mats}));
    } catch {}
  };

  const openNew  = () => { setForm({ ativo:true }); setModal("new"); setSaveErr(""); };
  const openEdit = row => { setForm({...row}); setModal(row); setSaveErr(""); };

  const save = async () => {
    if (!form.codigo || !form.nome) { setSaveErr("Código e Nome são obrigatórios."); return; }
    setSaving(true); setSaveErr("");
    try {
      const payload = {
        codigo:         form.codigo?.toUpperCase(),
        nome:           form.nome,
        especificacao:  form.especificacao || "",
        unidade:        form.unidade || "",
        aplicacao:      form.aplicacao || "",
        preco_alvo:     parseFloat(form.preco_alvo) || 0,
        estoque_minimo: parseFloat(form.estoque_minimo) || 0,
        ativo:          form.ativo !== false,
      };
      if (modal === "new") {
        await api.post("materiais", payload);
      } else {
        await api.patch("materiais", form.id, payload);
      }
      await reload();
      setModal(null);
    } catch(e) {
      setSaveErr(e.message || "Erro ao salvar. Verifique a conexão com o Supabase.");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm("Excluir este material?")) return;
    try {
      await api.delete("materiais", id);
      await reload();
    } catch(e) {
      alert("Erro ao excluir: " + e.message);
    }
  };

  const f = (k,v) => setForm(p => ({...p,[k]:v}));

  return (
    <div className="fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div><h2 style={{ fontSize:20, fontWeight:700, marginBottom:2 }}>Cadastro de Materiais</h2>
        <p style={{ color:T.muted, fontSize:13 }}>{data.materiais.length} materiais cadastrados</p></div>
        <button className="btn-primary" onClick={openNew}>+ Novo Material</button>
      </div>
      <div style={{ marginBottom:14 }}><Search value={search} onChange={setSearch} placeholder="Código, nome, aplicação..." /></div>
      <div className="card" style={{ padding:0 }}>
        <table>
          <thead><tr><th>Código</th><th>Nome</th><th>Especificação</th><th>Un.</th><th>Aplicação</th><th>Preço Alvo</th><th>Est. Mín.</th><th>Ativo</th><th style={{width:80}}/></tr></thead>
          <tbody>
            {filtered.length===0 && <tr><td colSpan={9}><Empty/></td></tr>}
            {filtered.map(m => (
              <tr key={m.id}>
                <td className="mono" style={{ color:T.blueL }}>{m.codigo}</td>
                <td style={{ fontWeight:500 }}>{m.nome}</td>
                <td style={{ color:T.muted, fontSize:12 }}>{m.especificacao}</td>
                <td style={{ color:T.muted }}>{m.unidade}</td>
                <td><span className="badge tag-blue">{m.aplicacao}</span></td>
                <td className="mono">{m.preco_alvo > 0 ? fmt_brl(m.preco_alvo) : "—"}</td>
                <td className="mono">{m.estoque_minimo}</td>
                <td><Badge v={m.ativo ? "Ativo" : "Inativo"}/></td>
                <td>
                  <div style={{ display:"flex", gap:4 }}>
                    <button className="btn-ghost" style={{ padding:"4px 8px", fontSize:11 }} onClick={()=>openEdit(m)}>✏️</button>
                    <button className="btn-danger" style={{ padding:"4px 8px", fontSize:11 }} onClick={()=>del(m.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal==="new"?"Novo Material":"Editar Material"} onClose={()=>setModal(null)}>
          <div className="grid2" style={{ gap:12 }}>
            <div><label>Código *</label><input value={form.codigo||""} onChange={e=>f("codigo",e.target.value.toUpperCase())} placeholder="MP017"/></div>
            <div><label>Nome *</label><input value={form.nome||""} onChange={e=>f("nome",e.target.value)} /></div>
            <div style={{ gridColumn:"span 2" }}><label>Especificação Técnica</label><input value={form.especificacao||""} onChange={e=>f("especificacao",e.target.value)} /></div>
            <div><label>Unidade</label><input value={form.unidade||""} onChange={e=>f("unidade",e.target.value)} placeholder="kg / un / m² / cx" /></div>
            <div><label>Aplicação</label><input value={form.aplicacao||""} onChange={e=>f("aplicacao",e.target.value)} placeholder="Estrutura, Solda..." /></div>
            <div><label>Preço Alvo (R$)</label><input type="number" step="0.01" value={form.preco_alvo||""} onChange={e=>f("preco_alvo",+e.target.value)} /></div>
            <div><label>Estoque Mínimo</label><input type="number" value={form.estoque_minimo||""} onChange={e=>f("estoque_minimo",+e.target.value)} /></div>
          </div>
          {saveErr && <div style={{ color:T.red, fontSize:12, marginTop:10, background:"rgba(224,90,90,.1)", padding:"8px 12px", borderRadius:6 }}>{saveErr}</div>}
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:20 }}>
            <button className="btn-ghost" onClick={()=>setModal(null)}>Cancelar</button>
            <button className="btn-primary" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MÓDULO: FORNECEDORES
// ══════════════════════════════════════════════════════════════════════════════
function Fornecedores({ data, setData }) {
  const [search, setSearch] = useState("");
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState({});

  const filtered = data.fornecedores.filter(f =>
    [f.codigo, f.razao_social, f.categoria, f.cidade_uf, f.status].join(" ").toLowerCase().includes(search.toLowerCase())
  );
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const reload = async () => {
    try {
      const forns = await api.get("fornecedores","order=codigo");
      if (forns.length) setData(d => ({...d, fornecedores: forns}));
    } catch {}
  };

  const openNew  = () => { setForm({ status:"Ativo" }); setModal("new"); setSaveErr(""); };
  const openEdit = row => { setForm({...row}); setModal(row); setSaveErr(""); };

  const save = async () => {
    if (!form.codigo || !form.razao_social) { setSaveErr("Código e Razão Social são obrigatórios."); return; }
    setSaving(true); setSaveErr("");
    try {
      const payload = {
        codigo:        form.codigo?.toUpperCase(),
        razao_social:  form.razao_social,
        nome_fantasia: form.nome_fantasia || "",
        cnpj:          form.cnpj || "",
        contato:       form.contato || "",
        telefone:      form.telefone || "",
        email:         form.email || "",
        cidade_uf:     form.cidade_uf || "",
        categoria:     form.categoria || "",
        prazo_medio:   parseInt(form.prazo_medio) || 30,
        status:        form.status || "Ativo",
      };
      if (modal === "new") {
        await api.post("fornecedores", payload);
      } else {
        await api.patch("fornecedores", form.id, payload);
      }
      await reload();
      setModal(null);
    } catch(e) {
      setSaveErr(e.message || "Erro ao salvar. Verifique a conexão com o Supabase.");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!window.confirm("Excluir este fornecedor?")) return;
    try {
      await api.delete("fornecedores", id);
      await reload();
    } catch(e) {
      alert("Erro ao excluir: " + e.message);
    }
  };

  const f = (k,v) => setForm(p => ({...p,[k]:v}));

  return (
    <div className="fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div><h2 style={{ fontSize:20, fontWeight:700, marginBottom:2 }}>Cadastro de Fornecedores</h2>
        <p style={{ color:T.muted, fontSize:13 }}>{data.fornecedores.filter(f=>f.status==="Ativo").length} ativos</p></div>
        <button className="btn-primary" onClick={openNew}>+ Novo Fornecedor</button>
      </div>
      <div style={{ marginBottom:14 }}><Search value={search} onChange={setSearch} placeholder="Código, razão social, categoria..." /></div>
      <div className="card" style={{ padding:0 }}>
        <table>
          <thead><tr><th>Código</th><th>Razão Social</th><th>Contato</th><th>Telefone</th><th>E-mail</th><th>Cidade/UF</th><th>Categoria</th><th>Prazo Médio</th><th>Status</th><th style={{width:80}}/></tr></thead>
          <tbody>
            {filtered.length===0 && <tr><td colSpan={10}><Empty/></td></tr>}
            {filtered.map(forn => (
              <tr key={forn.id}>
                <td className="mono" style={{ color:T.blueL }}>{forn.codigo}</td>
                <td style={{ fontWeight:500 }}>{forn.razao_social}</td>
                <td style={{ color:T.muted }}>{forn.contato}</td>
                <td style={{ color:T.muted, fontSize:12 }}>{forn.telefone}</td>
                <td style={{ color:T.muted, fontSize:12 }}>{forn.email}</td>
                <td style={{ color:T.muted, fontSize:12 }}>{forn.cidade_uf}</td>
                <td><span className="badge tag-blue">{forn.categoria}</span></td>
                <td className="mono" style={{ color:T.muted }}>{forn.prazo_medio}d</td>
                <td><Badge v={forn.status}/></td>
                <td>
                  <div style={{ display:"flex", gap:4 }}>
                    <button className="btn-ghost" style={{ padding:"4px 8px", fontSize:11 }} onClick={()=>openEdit(forn)}>✏️</button>
                    <button className="btn-danger" style={{ padding:"4px 8px", fontSize:11 }} onClick={()=>del(forn.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal==="new"?"Novo Fornecedor":"Editar Fornecedor"} onClose={()=>setModal(null)} width={700}>
          <div className="grid2" style={{ gap:12 }}>
            <div><label>Código *</label><input value={form.codigo||""} onChange={e=>f("codigo",e.target.value.toUpperCase())} placeholder="F004"/></div>
            <div><label>Razão Social *</label><input value={form.razao_social||""} onChange={e=>f("razao_social",e.target.value)} /></div>
            <div><label>Nome Fantasia</label><input value={form.nome_fantasia||""} onChange={e=>f("nome_fantasia",e.target.value)} /></div>
            <div><label>CNPJ</label><input value={form.cnpj||""} onChange={e=>f("cnpj",e.target.value)} placeholder="00.000.000/0001-00"/></div>
            <div><label>Contato</label><input value={form.contato||""} onChange={e=>f("contato",e.target.value)} /></div>
            <div><label>Telefone</label><input value={form.telefone||""} onChange={e=>f("telefone",e.target.value)} /></div>
            <div><label>E-mail</label><input value={form.email||""} onChange={e=>f("email",e.target.value)} /></div>
            <div><label>Cidade/UF</label><input value={form.cidade_uf||""} onChange={e=>f("cidade_uf",e.target.value)} placeholder="São Paulo/SP"/></div>
            <div><label>Categoria</label><input value={form.categoria||""} onChange={e=>f("categoria",e.target.value)} /></div>
            <div><label>Prazo Médio (dias)</label><input type="number" value={form.prazo_medio||""} onChange={e=>f("prazo_medio",+e.target.value)} /></div>
            <div><label>Status</label>
              <select value={form.status||"Ativo"} onChange={e=>f("status",e.target.value)}>
                {["Ativo","Inativo","Bloqueado"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {saveErr && <div style={{ color:T.red, fontSize:12, marginTop:10, background:"rgba(224,90,90,.1)", padding:"8px 12px", borderRadius:6 }}>{saveErr}</div>}
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:20 }}>
            <button className="btn-ghost" onClick={()=>setModal(null)}>Cancelar</button>
            <button className="btn-primary" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MÓDULO: COTAÇÃO COMPARATIVA
// ══════════════════════════════════════════════════════════════════════════════
function calcScore(row, allRows) {
  const grupo = allRows.filter(r => r.codigo_material === row.codigo_material && r.status === "Ativo");
  if (!grupo.length || !row.preco || !row.lead_time) return 0;
  const minPreco   = Math.min(...grupo.map(r => r.preco));
  const minPrazo   = Math.min(...grupo.map(r => r.lead_time));
  const scorePreco = minPreco / row.preco;
  const scorePrazo = minPrazo / row.lead_time;
  const scoreQual  = (row.qualidade || 0) / 10;
  const scoreAtd   = (row.atendimento || 0) / 10;
  return +(0.40 * scorePreco + 0.30 * scorePrazo + 0.20 * scoreQual + 0.10 * scoreAtd).toFixed(3);
}

function Cotacao({ data, setData }) {
  const [codMat, setCodMat]   = useState("");
  const [qtd, setQtd]         = useState("");
  const [criterio, setCriterio] = useState("Score Inteligente");
  const [escolhido, setEscolhido] = useState(null);
  const [modal, setModal]     = useState(false); // modal add fornecedor na relação

  const mat = data.materiais.find(m => m.codigo === codMat.toUpperCase());

  const cotacoes = data.relacao
    .filter(r => r.codigo_material === codMat.toUpperCase() && r.status === "Ativo")
    .map(r => {
      const forn  = data.fornecedores.find(f => f.codigo === r.codigo_fornecedor);
      const score = calcScore(r, data.relacao);
      const sub   = (parseFloat(qtd) || 0) * r.preco;
      return { ...r, forn, score, subtotal: sub };
    })
    .sort((a, b) => {
      if (criterio === "Menor Preço")       return a.preco - b.preco;
      if (criterio === "Menor Prazo")       return a.lead_time - b.lead_time;
      if (criterio === "Score Inteligente") return b.score - a.score;
      return 0;
    });

  const melhor = cotacoes[0] || null;

  const gerarCompra = () => {
    if (!escolhido || !qtd || !mat) return;
    const row = cotacoes.find(c => c.codigo_fornecedor === escolhido);
    if (!row) return;
    const nova = {
      id: Date.now(),
      codigo_material: mat.codigo,
      material: mat.nome,
      quantidade: parseFloat(qtd),
      criterio,
      fornecedor_escolhido: row.codigo_fornecedor,
      preco_escolhido: row.preco,
      subtotal: parseFloat(qtd) * row.preco,
      status: "A Emitir",
      data_recebimento: null,
      documento_nf: "",
    };
    setData(d => ({ ...d, compras: [...d.compras, nova] }));
    alert(`✅ Compra gerada com sucesso para ${row.forn?.razao_social}!\nAcesse a aba Compras para acompanhar.`);
  };

  // barras de comparação visual
  const maxPreco = cotacoes.length ? Math.max(...cotacoes.map(c => c.preco)) : 1;
  const maxPrazo = cotacoes.length ? Math.max(...cotacoes.map(c => c.lead_time)) : 1;

  const rankColor = i => i === 0 ? T.green : i === 1 ? T.yellow : T.muted;

  return (
    <div className="fade-in">
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Cotação Comparativa</h2>
        <p style={{ color:T.muted, fontSize:13 }}>Compare todos os fornecedores de um material lado a lado e gere a compra com um clique.</p>
      </div>

      {/* Painel de busca */}
      <div className="card" style={{ marginBottom:20 }}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:14, color:T.muted, textTransform:"uppercase", letterSpacing:".07em" }}>Parâmetros da Cotação</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:14, alignItems:"flex-end" }}>
          <div>
            <label>Código do Material</label>
            <input value={codMat} onChange={e => { setCodMat(e.target.value.toUpperCase()); setEscolhido(null); }}
              placeholder="MP001" />
            {mat && <div style={{ fontSize:11, color:T.teal, marginTop:4 }}>✓ {mat.nome} · {mat.unidade} · Preço Alvo: {fmt_brl(mat.preco_alvo)}</div>}
            {codMat && !mat && <div style={{ fontSize:11, color:T.red, marginTop:4 }}>Material não encontrado</div>}
          </div>
          <div>
            <label>Quantidade</label>
            <input type="number" value={qtd} onChange={e => setQtd(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label>Critério de Ordenação</label>
            <select value={criterio} onChange={e => setCriterio(e.target.value)}>
              <option>Score Inteligente</option>
              <option>Menor Preço</option>
              <option>Menor Prazo</option>
            </select>
          </div>
          <div>
            <button className="btn-primary" style={{ whiteSpace:"nowrap" }}
              onClick={() => setEscolhido(melhor?.codigo_fornecedor || null)}>
              🔍 Cotar
            </button>
          </div>
        </div>
      </div>

      {/* Tabela comparativa */}
      {cotacoes.length > 0 && (
        <>
          <div className="card" style={{ padding:0, marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px", borderBottom:`1px solid ${T.border}` }}>
              <span style={{ fontWeight:700 }}>Fornecedores Disponíveis — {mat?.nome}</span>
              <span style={{ fontSize:11, color:T.muted }}>{cotacoes.length} fornecedor(es) ativo(s)</span>
            </div>
            <table>
              <thead><tr>
                <th>Rank</th><th>Fornecedor</th><th>Preço Unit.</th><th style={{width:130}}>vs Preço Alvo</th>
                <th>Subtotal</th><th>Lead Time</th><th style={{width:100}}>Prazo (bar)</th>
                <th>Qualidade</th><th>Atend.</th><th>Score</th><th>MOQ</th><th>Selecionar</th>
              </tr></thead>
              <tbody>
                {cotacoes.map((c, i) => {
                  const difAlvo = mat?.preco_alvo > 0 ? ((c.preco - mat.preco_alvo) / mat.preco_alvo * 100) : null;
                  const isMelhor = i === 0;
                  const isEsc    = escolhido === c.codigo_fornecedor;
                  return (
                    <tr key={c.id} style={{ background: isEsc ? "rgba(37,99,235,.1)" : isMelhor ? "rgba(16,185,129,.05)" : "transparent" }}>
                      <td>
                        <span style={{ fontWeight:800, fontSize:16, color: rankColor(i) }}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight:600 }}>{c.forn?.razao_social || c.codigo_fornecedor}</div>
                        <div style={{ fontSize:11, color:T.muted }}>{c.forn?.contato} · {c.forn?.telefone}</div>
                      </td>
                      <td>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:14,
                          color: i===0 ? T.green : T.white }}>{fmt_brl(c.preco)}</span>
                        {/* barra comparativa de preço */}
                        <div style={{ height:4, background:T.border, borderRadius:2, marginTop:5, width:90 }}>
                          <div style={{ height:"100%", borderRadius:2, width:`${(c.preco/maxPreco)*100}%`,
                            background: i===0 ? T.green : i===1 ? T.yellow : T.red, transition:"width .4s" }}/>
                        </div>
                      </td>
                      <td>
                        {difAlvo !== null ? (
                          <span style={{ fontSize:12, fontWeight:600,
                            color: difAlvo <= 0 ? T.green : difAlvo < 5 ? T.yellow : T.red }}>
                            {difAlvo > 0 ? "+" : ""}{difAlvo.toFixed(1)}%
                          </span>
                        ) : <span style={{ color:T.muted }}>—</span>}
                      </td>
                      <td className="mono" style={{ fontWeight:600 }}>
                        {qtd ? fmt_brl(c.subtotal) : "—"}
                      </td>
                      <td>
                        <span style={{ color: c.lead_time <= 15 ? T.green : c.lead_time <= 25 ? T.yellow : T.red }}>
                          {c.lead_time}d
                        </span>
                      </td>
                      <td>
                        <div style={{ height:6, background:T.border, borderRadius:3, width:"100%" }}>
                          <div style={{ height:"100%", borderRadius:3, width:`${(c.lead_time/maxPrazo)*100}%`,
                            background: c.lead_time===Math.min(...cotacoes.map(x=>x.lead_time)) ? T.green : T.orange }}/>
                        </div>
                      </td>
                      <td>
                        <div style={{ display:"flex", gap:2 }}>
                          {Array.from({length:10}).map((_,j) => (
                            <div key={j} style={{ width:6, height:6, borderRadius:1,
                              background: j < c.qualidade ? T.blueL : T.border }}/>
                          ))}
                        </div>
                        <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{c.qualidade}/10</div>
                      </td>
                      <td>
                        <div style={{ display:"flex", gap:2 }}>
                          {Array.from({length:10}).map((_,j) => (
                            <div key={j} style={{ width:6, height:6, borderRadius:1,
                              background: j < c.atendimento ? T.teal : T.border }}/>
                          ))}
                        </div>
                        <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{c.atendimento}/10</div>
                      </td>
                      <td>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:15,
                          color: i===0 ? T.green : i===1 ? T.yellow : T.muted }}>
                          {(c.score * 100).toFixed(1)}
                        </div>
                        <div style={{ fontSize:9, color:T.muted }}>/ 100</div>
                      </td>
                      <td style={{ color:T.muted, fontSize:12 }}>{c.moq}</td>
                      <td>
                        <button onClick={() => setEscolhido(c.codigo_fornecedor)}
                          style={{ background: isEsc ? T.blue : "transparent",
                            color: isEsc ? T.white : T.muted,
                            border:`1px solid ${isEsc ? T.blue : T.border}`,
                            borderRadius:6, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                          {isEsc ? "✓ Selecionado" : "Selecionar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Painel de decisão */}
          {escolhido && (
            <div className="card fade-in" style={{ borderTop:`3px solid ${T.green}` }}>
              {(() => {
                const sel = cotacoes.find(c => c.codigo_fornecedor === escolhido);
                const economia = cotacoes.length > 1
                  ? (Math.max(...cotacoes.map(c=>c.preco)) - sel.preco) * (parseFloat(qtd)||1)
                  : 0;
                return (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:24, alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:11, color:T.muted, textTransform:"uppercase", letterSpacing:".07em", marginBottom:6 }}>Fornecedor Selecionado</div>
                      <div style={{ fontWeight:800, fontSize:18 }}>{sel?.forn?.razao_social}</div>
                      <div style={{ display:"flex", gap:20, marginTop:10, flexWrap:"wrap" }}>
                        <div><div style={{ fontSize:10, color:T.muted }}>Preço Unit.</div>
                          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:20, color:T.green }}>{fmt_brl(sel.preco)}</div></div>
                        <div><div style={{ fontSize:10, color:T.muted }}>Subtotal</div>
                          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:20 }}>{fmt_brl(sel.subtotal)}</div></div>
                        <div><div style={{ fontSize:10, color:T.muted }}>Lead Time</div>
                          <div style={{ fontWeight:700, fontSize:18, color:T.teal }}>{sel.lead_time} dias</div></div>
                        <div><div style={{ fontSize:10, color:T.muted }}>Score</div>
                          <div style={{ fontWeight:700, fontSize:18, color:T.blueL }}>{(sel.score*100).toFixed(1)}</div></div>
                        {economia > 0 && <div>
                          <div style={{ fontSize:10, color:T.muted }}>Economia vs pior opção</div>
                          <div style={{ fontWeight:700, fontSize:18, color:T.green }}>+ {fmt_brl(economia)}</div>
                        </div>}
                      </div>
                    </div>
                    <button className="btn-success" style={{ padding:"14px 28px", fontSize:14, whiteSpace:"nowrap" }}
                      onClick={gerarCompra} disabled={!qtd}>
                      ✅ Gerar Compra
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}

      {codMat && mat && cotacoes.length === 0 && (
        <div style={{ textAlign:"center", padding:"48px", color:T.muted }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
          <div style={{ fontWeight:600, marginBottom:6 }}>Nenhum fornecedor cadastrado para {mat.nome}</div>
          <div style={{ fontSize:12 }}>Cadastre fornecedores na aba Relação ou adicione-os via Fornecedores.</div>
        </div>
      )}

      {!codMat && (
        <div style={{ textAlign:"center", padding:"48px", color:T.muted }}>
          <div style={{ fontSize:40, marginBottom:12 }}>⚖️</div>
          <div style={{ fontWeight:600, marginBottom:6 }}>Digite o código do material para iniciar a cotação</div>
          <div style={{ fontSize:12 }}>Ex: MP001, MP013... Os fornecedores cadastrados aparecerão automaticamente.</div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MÓDULO: HISTÓRICO DE PREÇOS
// ══════════════════════════════════════════════════════════════════════════════
function MiniLineChart({ points, color = "#3B82F6", height = 50 }) {
  if (!points || points.length < 2) return null;
  const W = 260; const H = height;
  const vals = points.map(p => p.y);
  const min  = Math.min(...vals); const max = Math.max(...vals);
  const range = max - min || 1;
  const xs = points.map((_, i) => (i / (points.length - 1)) * W);
  const ys = vals.map(v => H - ((v - min) / range) * (H - 8) - 4);
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${path} L${W},${H} L0,${H} Z`;
  return (
    <svg width={W} height={H} style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${color.replace("#","")})`}/>
      <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
      {points.map((p, i) => (
        <circle key={i} cx={xs[i]} cy={ys[i]} r="3" fill={color} stroke={T.dark} strokeWidth="1.5"/>
      ))}
    </svg>
  );
}

function HistoricoPrecos({ data }) {
  const [codMat, setCodMat]   = useState("MP001");
  const [codForn, setCodForn] = useState("Todos");
  const [periodo, setPeriodo] = useState("12m");

  const mat    = data.materiais.find(m => m.codigo === codMat);
  const fornList = ["Todos", ...new Set(
    data.historico_precos.filter(h => h.codigo_material === codMat).map(h => h.codigo_fornecedor)
  )];

  const cutoff = (() => {
    const d = new Date();
    if (periodo === "3m")  d.setMonth(d.getMonth() - 3);
    if (periodo === "6m")  d.setMonth(d.getMonth() - 6);
    if (periodo === "12m") d.setFullYear(d.getFullYear() - 1);
    if (periodo === "all") return new Date("2000-01-01");
    return d;
  })();

  const registros = data.historico_precos
    .filter(h =>
      h.codigo_material === codMat &&
      (codForn === "Todos" || h.codigo_fornecedor === codForn) &&
      new Date(h.data) >= cutoff
    )
    .sort((a,b) => new Date(a.data) - new Date(b.data));

  // Preço médio, mín e máx do período
  const precos  = registros.map(r => r.preco);
  const pMedia  = precos.length ? precos.reduce((s,v) => s+v, 0) / precos.length : 0;
  const pMin    = precos.length ? Math.min(...precos) : 0;
  const pMax    = precos.length ? Math.max(...precos) : 0;
  const pUltimo = registros.length ? registros[registros.length-1].preco : 0;
  const pAnterior = registros.length > 1 ? registros[registros.length-2].preco : pUltimo;
  const varPct  = pAnterior ? ((pUltimo - pAnterior) / pAnterior * 100) : 0;

  // Série de pontos para gráfico geral
  const chartPoints = registros.map((r, i) => ({ x: i, y: r.preco }));

  // Por fornecedor (série separada)
  const fornCores = { F001: T.blue, F002: T.orange, F003: T.teal };
  const fornSeries = [...new Set(registros.map(r => r.codigo_fornecedor))].map(cod => ({
    cod,
    nome: data.fornecedores.find(f => f.codigo === cod)?.razao_social || cod,
    cor:  fornCores[cod] || T.muted,
    pts:  registros.filter(r => r.codigo_fornecedor === cod)
           .map((r,i) => ({ x:i, y:r.preco, label: r.data })),
  }));

  const matList = [...new Set(data.historico_precos.map(h => h.codigo_material))];

  return (
    <div className="fade-in">
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Histórico de Preços</h2>
        <p style={{ color:T.muted, fontSize:13 }}>Evolução de preços por material e fornecedor — identifique tendências e negocie com dados.</p>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom:20 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
          <div>
            <label>Material</label>
            <select value={codMat} onChange={e => { setCodMat(e.target.value); setCodForn("Todos"); }}>
              {matList.map(c => {
                const m = data.materiais.find(x => x.codigo === c);
                return <option key={c} value={c}>{c} — {m?.nome || c}</option>;
              })}
            </select>
          </div>
          <div>
            <label>Fornecedor</label>
            <select value={codForn} onChange={e => setCodForn(e.target.value)}>
              {fornList.map(f => {
                const fn = data.fornecedores.find(x => x.codigo === f);
                return <option key={f} value={f}>{f === "Todos" ? "Todos os fornecedores" : `${f} — ${fn?.razao_social || f}`}</option>;
              })}
            </select>
          </div>
          <div>
            <label>Período</label>
            <div style={{ display:"flex", gap:4, marginTop:4 }}>
              {["3m","6m","12m","all"].map(p => (
                <button key={p} onClick={() => setPeriodo(p)}
                  style={{ flex:1, padding:"8px 0", borderRadius:6, border:`1px solid ${periodo===p ? T.blue : T.border}`,
                    background: periodo===p ? `rgba(37,99,235,.15)` : "transparent",
                    color: periodo===p ? T.blueL : T.muted, cursor:"pointer", fontSize:12, fontWeight:600 }}>
                  {p === "all" ? "Tudo" : p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {registros.length === 0 ? (
        <div style={{ textAlign:"center", padding:48, color:T.muted }}>
          <div style={{ fontSize:36, marginBottom:12 }}>📈</div>
          <div style={{ fontWeight:600 }}>Nenhum registro encontrado para este filtro</div>
        </div>
      ) : (
        <>
          {/* KPIs do período */}
          <div className="grid4" style={{ marginBottom:20 }}>
            <KPI label="Último Preço"   value={fmt_brl(pUltimo)} icon="🏷️"
              color={varPct > 5 ? T.red : varPct < 0 ? T.green : T.yellow}
              sub={`${varPct > 0 ? "▲" : "▼"} ${Math.abs(varPct).toFixed(1)}% vs anterior`} />
            <KPI label="Preço Médio"    value={fmt_brl(pMedia)}  icon="📊" color={T.blue} />
            <KPI label="Menor Preço"    value={fmt_brl(pMin)}    icon="⬇️" color={T.green} sub="no período" />
            <KPI label="Maior Preço"    value={fmt_brl(pMax)}    icon="⬆️" color={T.red}  sub={`variação: ${pMin > 0 ? ((pMax-pMin)/pMin*100).toFixed(1) : 0}%`} />
          </div>

          {/* Gráfico de linha interativo */}
          <div className="card" style={{ marginBottom:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>Evolução do Preço — {mat?.nome || codMat}</div>
                <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{registros.length} compras registradas</div>
              </div>
              {mat?.preco_alvo > 0 && (
                <div style={{ fontSize:12, color:T.muted }}>
                  Preço Alvo: <span style={{ color:T.orange, fontWeight:700 }}>{fmt_brl(mat.preco_alvo)}</span>
                </div>
              )}
            </div>

            {/* Gráfico SVG responsivo */}
            <div style={{ overflowX:"auto" }}>
              {(() => {
                const W = Math.max(500, registros.length * 60);
                const H = 180;
                const PAD = { t:16, r:20, b:48, l:64 };
                const innerW = W - PAD.l - PAD.r;
                const innerH = H - PAD.t - PAD.b;

                const allVals = registros.map(r => r.preco);
                if (mat?.preco_alvo > 0) allVals.push(mat.preco_alvo);
                const minV = Math.min(...allVals) * 0.97;
                const maxV = Math.max(...allVals) * 1.03;
                const range = maxV - minV || 1;

                const xScale = i => PAD.l + (i / Math.max(registros.length - 1, 1)) * innerW;
                const yScale = v => PAD.t + innerH - ((v - minV) / range) * innerH;

                const linePath = registros.map((r,i) =>
                  `${i===0?"M":"L"}${xScale(i).toFixed(1)},${yScale(r.preco).toFixed(1)}`
                ).join(" ");

                const areaPath = `${linePath} L${xScale(registros.length-1)},${PAD.t+innerH} L${xScale(0)},${PAD.t+innerH} Z`;

                // Linha de preço alvo
                const alvoY = mat?.preco_alvo > 0 ? yScale(mat.preco_alvo) : null;

                // Ticks Y
                const yTicks = 4;
                const yTickVals = Array.from({length:yTicks+1}).map((_,i) => minV + (range * i / yTicks));

                const fornColors = registros.reduce((acc, r) => {
                  acc[r.codigo_fornecedor] = fornCores[r.codigo_fornecedor] || T.muted;
                  return acc;
                }, {});

                return (
                  <svg width={W} height={H} style={{ display:"block" }}>
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={T.blue} stopOpacity="0.3"/>
                        <stop offset="100%" stopColor={T.blue} stopOpacity="0"/>
                      </linearGradient>
                    </defs>

                    {/* Grid Y */}
                    {yTickVals.map((v,i) => (
                      <g key={i}>
                        <line x1={PAD.l} y1={yScale(v)} x2={W-PAD.r} y2={yScale(v)}
                          stroke={T.border} strokeWidth="1" strokeDasharray="3,4"/>
                        <text x={PAD.l-6} y={yScale(v)+4} textAnchor="end"
                          fill={T.muted} fontSize="9" fontFamily="'IBM Plex Mono',monospace">
                          {v >= 1 ? `R$${v.toFixed(0)}` : `R$${v.toFixed(2)}`}
                        </text>
                      </g>
                    ))}

                    {/* Linha preço alvo */}
                    {alvoY && (
                      <>
                        <line x1={PAD.l} y1={alvoY} x2={W-PAD.r} y2={alvoY}
                          stroke={T.orange} strokeWidth="1.5" strokeDasharray="6,4" opacity="0.7"/>
                        <text x={W-PAD.r+4} y={alvoY+4} fill={T.orange} fontSize="9">Alvo</text>
                      </>
                    )}

                    {/* Área */}
                    <path d={areaPath} fill="url(#lineGrad)"/>

                    {/* Linha */}
                    <path d={linePath} stroke={T.blue} strokeWidth="2.5" fill="none"
                      strokeLinejoin="round" strokeLinecap="round"/>

                    {/* Pontos com cor por fornecedor */}
                    {registros.map((r, i) => (
                      <g key={i}>
                        <circle cx={xScale(i)} cy={yScale(r.preco)} r="5"
                          fill={fornColors[r.codigo_fornecedor] || T.blue}
                          stroke={T.dark} strokeWidth="2"/>
                        {/* Label data */}
                        <text x={xScale(i)} y={PAD.t+innerH+14} textAnchor="middle"
                          fill={T.muted} fontSize="8" fontFamily="'IBM Plex Mono',monospace"
                          transform={`rotate(-35,${xScale(i)},${PAD.t+innerH+14})`}>
                          {r.data.slice(2,7).replace("-","/")}
                        </text>
                        {/* Tooltip preço */}
                        <text x={xScale(i)} y={yScale(r.preco)-10} textAnchor="middle"
                          fill={fornColors[r.codigo_fornecedor] || T.blue} fontSize="9"
                          fontFamily="'IBM Plex Mono',monospace" fontWeight="600">
                          {r.preco >= 1 ? `R$${r.preco.toFixed(0)}` : `R$${r.preco.toFixed(2)}`}
                        </text>
                      </g>
                    ))}
                  </svg>
                );
              })()}
            </div>

            {/* Legenda fornecedores */}
            <div style={{ display:"flex", gap:16, marginTop:12, flexWrap:"wrap" }}>
              {Object.entries(fornCores).filter(([cod]) => registros.some(r=>r.codigo_fornecedor===cod)).map(([cod, cor]) => {
                const fn = data.fornecedores.find(f => f.codigo === cod);
                return (
                  <div key={cod} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:T.muted }}>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:cor }}/>
                    {cod} — {fn?.razao_social || cod}
                  </div>
                );
              })}
              {mat?.preco_alvo > 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:T.muted }}>
                  <div style={{ width:24, height:2, background:T.gold, borderRadius:1 }}/>
                  Preço Alvo ({fmt_brl(mat.preco_alvo)})
                </div>
              )}
            </div>
          </div>

          {/* Mini sparklines por fornecedor */}
          {codForn === "Todos" && fornSeries.length > 1 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:12, color:T.muted, textTransform:"uppercase", letterSpacing:".07em" }}>Comparativo por Fornecedor</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12 }}>
                {fornSeries.map(fs => {
                  const ul = fs.pts[fs.pts.length-1]?.y || 0;
                  const ant = fs.pts[fs.pts.length-2]?.y || ul;
                  const v = ant ? ((ul-ant)/ant*100) : 0;
                  return (
                    <div key={fs.cod} className="card" style={{ display:"flex", gap:16, alignItems:"center" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:12 }}>{fs.nome}</div>
                        <div style={{ fontSize:10, color:T.muted, marginBottom:6 }}>{fs.cod} · {fs.pts.length} compra(s)</div>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:800, fontSize:18, color:fs.cor }}>{fmt_brl(ul)}</div>
                        <div style={{ fontSize:11, color: v>0?T.red:T.green, marginTop:2 }}>
                          {v>0?"▲":"▼"} {Math.abs(v).toFixed(1)}% vs anterior
                        </div>
                      </div>
                      <MiniLineChart points={fs.pts} color={fs.cor} height={55}/>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabela histórico detalhado */}
          <div className="card" style={{ padding:0 }}>
            <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, fontWeight:700 }}>
              Registros Detalhados
            </div>
            <table>
              <thead><tr><th>Data</th><th>Fornecedor</th><th>Preço Unit.</th><th>vs Alvo</th><th>vs Anterior</th><th>Quantidade</th><th>Total Comprado</th><th>NF</th></tr></thead>
              <tbody>
                {[...registros].reverse().map((r, i, arr) => {
                  const prev   = arr[i+1]?.preco;
                  const varA   = prev ? ((r.preco - prev) / prev * 100) : null;
                  const difAlvo = mat?.preco_alvo > 0 ? ((r.preco - mat.preco_alvo)/mat.preco_alvo*100) : null;
                  const fn = data.fornecedores.find(f => f.codigo === r.codigo_fornecedor);
                  const cor = fornCores[r.codigo_fornecedor] || T.muted;
                  return (
                    <tr key={r.id}>
                      <td style={{ color:T.muted, fontSize:12 }}>{fmt_date(r.data)}</td>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:cor, flexShrink:0 }}/>
                          <div>
                            <div style={{ fontWeight:600, fontSize:12 }}>{fn?.razao_social || r.codigo_fornecedor}</div>
                            <div style={{ fontSize:10, color:T.muted }}>{r.codigo_fornecedor}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:700 }}>{fmt_brl(r.preco)}</span>
                      </td>
                      <td>
                        {difAlvo !== null
                          ? <span style={{ fontSize:12, fontWeight:600, color: difAlvo<=0?T.green:difAlvo<5?T.yellow:T.red }}>
                              {difAlvo>0?"+":""}{difAlvo.toFixed(1)}%
                            </span>
                          : <span style={{ color:T.muted }}>—</span>}
                      </td>
                      <td>
                        {varA !== null
                          ? <span style={{ fontSize:12, fontWeight:600, color: varA>0?T.red:T.green }}>
                              {varA>0?"▲":"▼"} {Math.abs(varA).toFixed(1)}%
                            </span>
                          : <span style={{ color:T.muted }}>—</span>}
                      </td>
                      <td className="mono">{fmt_num(r.quantidade)}</td>
                      <td className="mono" style={{ fontWeight:600 }}>{fmt_brl(r.preco * r.quantidade)}</td>
                      <td style={{ color:T.muted, fontSize:11 }}>{r.nf}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// TELA DE LOGIN — Agregar ERP
// ══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [senha, setSenha]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [erro, setErro]         = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !senha) { setErro("Preencha e-mail e senha."); return; }
    setLoading(true); setErro("");
    try {
      const session = await auth.login(email.trim(), senha);
      auth.save(session);
      setToken(session.access_token);
      onLogin(session);
    } catch(err) {
      setErro(err.message.includes("Invalid login") || err.message.includes("invalid_grant")
        ? "E-mail ou senha incorretos."
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:"100vh", background:"#1A1D23",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Montserrat',sans-serif", padding:20,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Montserrat:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        @keyframes glow   { 0%,100%{opacity:.4} 50%{opacity:.8} }
        .login-card { animation: fadeUp .4s ease; }
        .login-input { transition: border-color .2s, box-shadow .2s; }
        .login-input:focus { border-color:#E0A85A!important; box-shadow:0 0 0 3px rgba(224,168,90,.15)!important; outline:none; }
        .login-btn { transition: all .15s; }
        .login-btn:hover:not(:disabled) { background:#ECC07A!important; transform:translateY(-1px); box-shadow:0 4px 16px rgba(224,168,90,.3); }
        .login-btn:active { transform:none; }
      `}</style>

      {/* Fundo com triângulo decorativo */}
      <div style={{ position:"fixed", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <svg style={{ position:"absolute", right:-80, top:-80, opacity:.04 }}
          width="500" height="500" viewBox="0 0 100 100">
          <polygon points="50,5 95,90 5,90" fill="#E0A85A" stroke="#E0A85A" strokeWidth="1"/>
          <line x1="50" y1="5" x2="50" y2="90" stroke="#E0A85A" strokeWidth=".5"/>
          <line x1="27" y1="47" x2="73" y2="47" stroke="#E0A85A" strokeWidth=".5"/>
        </svg>
        <svg style={{ position:"absolute", left:-120, bottom:-120, opacity:.03 }}
          width="600" height="600" viewBox="0 0 100 100">
          <polygon points="50,5 95,90 5,90" fill="#E0A85A" stroke="#E0A85A" strokeWidth="1"/>
        </svg>
        {/* Grade de pontos */}
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:"radial-gradient(circle, rgba(224,168,90,.08) 1px, transparent 1px)",
          backgroundSize:"32px 32px",
        }}/>
      </div>

      <div className="login-card" style={{
        width:"100%", maxWidth:420, position:"relative", zIndex:1,
      }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center",
            width:72, height:72, borderRadius:20, background:"#2B2F38",
            border:"1px solid rgba(224,168,90,.3)", marginBottom:16,
            boxShadow:"0 8px 32px rgba(0,0,0,.4)" }}>
            <svg width="44" height="44" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="28" stroke="#CCCCCC" strokeWidth="3" fill="none" opacity="0.3"/>
              <polygon points="50,18 82,74 18,74" fill="none" stroke="#E0A85A" strokeWidth="3.5" strokeLinejoin="round"/>
              <polygon points="50,18 82,74 18,74" fill="#E0A85A" opacity="0.12"/>
              <line x1="50" y1="18" x2="50" y2="74" stroke="#E0A85A" strokeWidth="1.5" opacity="0.6"/>
              <line x1="34" y1="50" x2="66" y2="50" stroke="#E0A85A" strokeWidth="1.5" opacity="0.6"/>
            </svg>
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:"#E0A85A", letterSpacing:".08em" }}>AGREGAR</div>
          <div style={{ fontSize:11, color:"#CCCCCC", fontWeight:600, letterSpacing:".2em",
            textTransform:"uppercase", marginTop:4 }}>SOLUÇÕES · ERP v3.1</div>
        </div>

        {/* Card de login */}
        <div style={{
          background:"#2B2F38", border:"1px solid #3E4350",
          borderRadius:20, padding:"32px 36px",
          boxShadow:"0 24px 64px rgba(0,0,0,.5)",
        }}>
          <div style={{ marginBottom:24 }}>
            <h1 style={{ fontSize:18, fontWeight:700, color:"#F0EDE8", marginBottom:4 }}>Bem-vindo de volta</h1>
            <p style={{ fontSize:12, color:"#CCCCCC" }}>Faça login para acessar o sistema</p>
          </div>

          <form onSubmit={handleLogin}>
            {/* E-mail */}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#CCCCCC", textTransform:"uppercase",
                letterSpacing:".08em", display:"block", marginBottom:8 }}>E-mail</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
                  fontSize:15, opacity:.5 }}>✉</span>
                <input
                  className="login-input"
                  type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="seu@email.com.br"
                  style={{ width:"100%", background:"#1A1D23", border:"1px solid #3E4350",
                    borderRadius:10, padding:"12px 14px 12px 38px", fontSize:14,
                    color:"#F0EDE8", fontFamily:"'Montserrat',sans-serif", boxSizing:"border-box" }}
                />
              </div>
            </div>

            {/* Senha */}
            <div style={{ marginBottom:24 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#CCCCCC", textTransform:"uppercase",
                letterSpacing:".08em", display:"block", marginBottom:8 }}>Senha</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
                  fontSize:15, opacity:.5 }}>🔒</span>
                <input
                  className="login-input"
                  type={showPass?"text":"password"} value={senha} onChange={e=>setSenha(e.target.value)}
                  placeholder="••••••••"
                  style={{ width:"100%", background:"#1A1D23", border:"1px solid #3E4350",
                    borderRadius:10, padding:"12px 40px 12px 38px", fontSize:14,
                    color:"#F0EDE8", fontFamily:"'Montserrat',sans-serif", boxSizing:"border-box" }}
                />
                <button type="button" onClick={()=>setShowPass(p=>!p)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                    background:"none", border:"none", cursor:"pointer", fontSize:14, opacity:.5, padding:0 }}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <div style={{ background:"rgba(224,90,90,.1)", border:"1px solid rgba(224,90,90,.3)",
                borderRadius:8, padding:"10px 14px", marginBottom:16, display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:14 }}>⚠️</span>
                <span style={{ fontSize:12, color:"#E05A5A", fontWeight:500 }}>{erro}</span>
              </div>
            )}

            {/* Botão */}
            <button className="login-btn" type="submit" disabled={loading} style={{
              width:"100%", padding:"14px", background:"#E0A85A", color:"#1A1D23",
              border:"none", borderRadius:10, fontSize:14, fontWeight:800,
              fontFamily:"'Montserrat',sans-serif", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? .7 : 1, letterSpacing:".05em",
            }}>
              {loading ? "Entrando..." : "Entrar no Sistema"}
            </button>
          </form>

          <div style={{ marginTop:20, padding:"12px 0 0", borderTop:"1px solid #3E4350",
            textAlign:"center", fontSize:11, color:"#CCCCCC" }}>
            🔐 Acesso restrito · Agregar Soluções Engenharia
          </div>
        </div>

        <div style={{ textAlign:"center", marginTop:20, fontSize:11, color:"rgba(204,204,204,.4)" }}>
          ERP v3.1 · Powered by Supabase
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BANNER SUPABASE SETUP
// ══════════════════════════════════════════════════════════════════════════════
function SetupBanner({ onDismiss }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div style={{ background:"linear-gradient(135deg,#1e3a5f,#0f2a45)", border:`1px solid ${T.border}`, borderRadius:12, padding:20, marginBottom:24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:8 }}>🚀 Conectar ao Supabase (banco de dados online)</div>
          <div style={{ fontSize:13, color:T.muted, lineHeight:1.7, maxWidth:700 }}>
            Este app roda com dados de demonstração. Para salvar dados permanentemente na nuvem:<br/>
            <strong style={{ color:T.text }}>1.</strong> Crie uma conta gratuita em <a href="https://supabase.com" target="_blank" style={{ color:T.blueL }}>supabase.com</a> → Novo Projeto<br/>
            <strong style={{ color:T.text }}>2.</strong> No painel Supabase, vá em <strong style={{ color:T.text }}>SQL Editor</strong> e execute o script SQL abaixo para criar as tabelas<br/>
            <strong style={{ color:T.text }}>3.</strong> Em <strong style={{ color:T.text }}>Settings → API</strong>, copie a <strong style={{ color:T.text }}>Project URL</strong> e a <strong style={{ color:T.text }}>anon key</strong><br/>
            <strong style={{ color:T.text }}>4.</strong> Substitua <code style={{ background:T.dark, padding:"1px 6px", borderRadius:4, fontSize:11 }}>SUPABASE_URL</code> e <code style={{ background:T.dark, padding:"1px 6px", borderRadius:4, fontSize:11 }}>SUPABASE_KEY</code> no topo do código JSX
          </div>
          <details style={{ marginTop:12 }}>
            <summary style={{ cursor:"pointer", color:T.blueL, fontSize:12, fontWeight:600 }}>Ver script SQL de criação das tabelas ▼</summary>
            <pre style={{ background:T.dark, borderRadius:8, padding:16, marginTop:10, fontSize:11, color:T.text, overflow:"auto", maxHeight:300, lineHeight:1.6 }}>{`-- MATERIAIS
create table materiais (
  id bigint generated always as identity primary key,
  codigo text unique not null,
  nome text not null,
  especificacao text,
  unidade text,
  aplicacao text,
  preco_alvo numeric default 0,
  estoque_minimo numeric default 0,
  ativo boolean default true,
  criado_em timestamptz default now()
);

-- FORNECEDORES
create table fornecedores (
  id bigint generated always as identity primary key,
  codigo text unique not null,
  razao_social text not null,
  nome_fantasia text,
  cnpj text,
  contato text,
  telefone text,
  email text,
  cidade_uf text,
  categoria text,
  prazo_medio integer default 30,
  status text default 'Ativo',
  criado_em timestamptz default now()
);

-- COMPRAS
create table compras (
  id bigint generated always as identity primary key,
  codigo_material text,
  material text,
  quantidade numeric,
  criterio text default 'Menor Preço',
  fornecedor_escolhido text,
  preco_escolhido numeric default 0,
  subtotal numeric default 0,
  status text default 'A Emitir',
  data_recebimento date,
  documento_nf text,
  criado_em timestamptz default now()
);

-- ESTOQUE
create table estoque (
  id bigint generated always as identity primary key,
  codigo text unique not null,
  nome text not null,
  unidade text,
  saldo_inicial numeric default 0,
  entradas numeric default 0,
  saidas numeric default 0,
  estoque_atual numeric generated always as (saldo_inicial + entradas - saidas) stored,
  estoque_minimo numeric default 0,
  valor_unit numeric default 0,
  localizacao text,
  atualizado_em timestamptz default now()
);

-- MOVIMENTAÇÕES
create table movimentacoes (
  id bigint generated always as identity primary key,
  data date not null,
  tipo text not null,
  documento text,
  codigo_material text,
  material text,
  unidade text,
  quantidade numeric,
  valor_unit numeric default 0,
  valor_total numeric generated always as (quantidade * valor_unit) stored,
  obra_cc text,
  responsavel text,
  obs text,
  criado_em timestamptz default now()
);

-- Habilitar RLS (segurança por linha)
alter table materiais    enable row level security;
alter table fornecedores enable row level security;
alter table compras      enable row level security;
alter table estoque      enable row level security;
alter table movimentacoes enable row level security;

-- Políticas de acesso (ajuste conforme autenticação necessária)
create policy "acesso_total" on materiais     for all using (true);
create policy "acesso_total" on fornecedores  for all using (true);
create policy "acesso_total" on compras       for all using (true);
create policy "acesso_total" on estoque       for all using (true);
create policy "acesso_total" on movimentacoes for all using (true);`}
            </pre>
          </details>
        </div>
        <button className="btn-ghost" style={{ fontSize:12, whiteSpace:"nowrap", marginLeft:12 }} onClick={() => setOpen(false)}>Fechar ✕</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
const MODULES = [
  { id:"dashboard",      label:"Dashboard",         icon:"📊" },
  { id:"cotacao",        label:"Cotação Comparativa",icon:"⚖️" },
  { id:"historico",      label:"Histórico de Preços",icon:"📈" },
  { id:"compras",        label:"Compras",            icon:"🛒" },
  { id:"pedido",         label:"Pedido Compra",      icon:"📄" },
  { id:"estoque",        label:"Estoque",            icon:"📦" },
  { id:"movimentacoes",  label:"Movimentações",      icon:"🔄" },
  { id:"materiais",      label:"Materiais",          icon:"🔩" },
  { id:"fornecedores",   label:"Fornecedores",       icon:"🏢" },
];

export default function App() {
  const [active, setActive]   = useState("dashboard");
  const [data, setData]       = useState(MOCK);
  const [sideOpen, setSide]   = useState(true);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Verificar sessão salva
  useEffect(() => {
    const saved = auth.session();
    if (saved?.access_token) {
      setToken(saved.access_token);
      setSession(saved);
    }
    setAuthReady(true);
  }, []);

  // Carregar dados após login
  useEffect(() => {
    if (!session) return;
    setLoading(true);
    async function loadAll() {
      try {
        const [mats, forns, compras, estoque, movs] = await Promise.all([
          api.get("materiais",    "order=codigo"),
          api.get("fornecedores", "order=codigo"),
          api.get("compras",      "order=criado_em.desc"),
          api.get("estoque",      "order=codigo"),
          api.get("movimentacoes","order=data.desc"),
        ]);
        setData(d => ({
          ...d,
          materiais:     mats.length     ? mats     : d.materiais,
          fornecedores:  forns.length    ? forns    : d.fornecedores,
          compras:       compras.length  ? compras  : d.compras,
          estoque:       estoque.length  ? estoque  : d.estoque,
          movimentacoes: movs.length     ? movs     : d.movimentacoes,
        }));
        setDbError(null);
      } catch(e) {
        setDbError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [session]);

  const handleLogin  = (sess) => { setSession(sess); };
  const handleLogout = async () => {
    try { await auth.logout(session?.access_token); } catch {}
    auth.clear(); setToken(null); setSession(null);
    setData(MOCK); setLoading(true);
  };

  if (!authReady) return null;
  if (!session)   return <LoginScreen onLogin={handleLogin}/>;

  const renderModule = () => {
    const props = { data, setData, session, handleLogout };
    switch(active) {
      case "dashboard":     return <Dashboard     {...props}/>;
      case "cotacao":       return <Cotacao       {...props}/>;
      case "historico":     return <HistoricoPrecos {...props}/>;
      case "compras":       return <Compras       {...props}/>;
      case "pedido":        return <PedidoCompra  {...props}/>;
      case "estoque":       return <Estoque       {...props}/>;
      case "movimentacoes": return <Movimentacoes {...props}/>;
      case "materiais":     return <Materiais     {...props}/>;
      case "fornecedores":  return <Fornecedores  {...props}/>;
      default:              return <Dashboard     {...props}/>;
    }
  };

  return (
    <>
      <style>{css}</style>
      <style>{`
        @media(max-width:768px){
          .erp-sidebar{
            position:fixed!important;
            left:${sideOpen?"0":"-100%"}!important;
            z-index:200!important;
            width:240px!important;
            min-width:240px!important;
            height:100vh!important;
            box-shadow:4px 0 24px rgba(0,0,0,.5)!important;
            transition:left .25s ease!important;
          }
          .erp-overlay{
            display:${sideOpen?"block":"none"}!important;
          }
          .erp-main{margin-left:0!important}
        }
      `}</style>

      {/* Overlay mobile */}
      <div className="erp-overlay" onClick={()=>setSide(false)} style={{
        display:"none", position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:199
      }}/>

      <div style={{ display:"flex", minHeight:"100vh" }}>

        {/* SIDEBAR */}
        <div className="erp-sidebar" style={{
          width: sideOpen ? 220 : 64, minWidth: sideOpen ? 220 : 64,
          background: T.surface, borderRight:`1px solid ${T.border}`,
          display:"flex", flexDirection:"column", transition:"width .2s, min-width .2s",
          position:"sticky", top:0, height:"100vh", overflow:"hidden",
          flexShrink:0
        }}>
          {/* Logo Agregar */}
          <div style={{ padding:"14px 12px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10, background:`linear-gradient(180deg, rgba(224,168,90,.08) 0%, transparent 100%)` }}>
            {/* SVG Logo — triângulo + engrenagem */}
            <svg width="38" height="38" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink:0 }}>
              {/* Engrenagem */}
              <path d="M50 18 L53 10 L47 10 Z M50 82 L53 90 L47 90 Z M18 50 L10 53 L10 47 Z M82 50 L90 53 L90 47 Z M26 26 L20 20 L16 24 Z M74 74 L80 80 L84 76 Z M74 26 L80 20 L84 24 Z M26 74 L20 80 L16 76 Z" fill="#CCCCCC" opacity="0.6"/>
              <circle cx="50" cy="50" r="30" stroke="#CCCCCC" strokeWidth="4" fill="none" opacity="0.4"/>
              {/* Triângulo A dourado */}
              <polygon points="50,20 80,75 20,75" fill="none" stroke="#E0A85A" strokeWidth="3.5" strokeLinejoin="round"/>
              <polygon points="50,20 80,75 20,75" fill="#E0A85A" opacity="0.15"/>
              {/* Divisões internas */}
              <line x1="50" y1="20" x2="50" y2="75" stroke="#E0A85A" strokeWidth="1.5" opacity="0.6"/>
              <line x1="35" y1="52" x2="65" y2="52" stroke="#E0A85A" strokeWidth="1.5" opacity="0.6"/>
              <line x1="42" y1="63" x2="58" y2="63" stroke="#E0A85A" strokeWidth="1" opacity="0.5"/>
            </svg>
            {sideOpen && (
              <div>
                <div style={{ fontWeight:800, fontSize:13, color:T.gold, letterSpacing:".08em", lineHeight:1.1, fontFamily:"'Montserrat',sans-serif" }}>AGREGAR</div>
                <div style={{ fontSize:8, color:T.muted, fontWeight:600, letterSpacing:".15em", textTransform:"uppercase", marginTop:2 }}>SOLUÇÕES · ERP v3.1</div>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav style={{ flex:1, padding:"12px 8px", display:"flex", flexDirection:"column", gap:2 }}>
            {MODULES.map(m => (
              <button key={m.id} onClick={() => { setActive(m.id); if(window.innerWidth<=768) setSide(false); }} style={{
                display:"flex", alignItems:"center", gap:10, padding:"10px 10px",
                borderRadius:8, border:"none", cursor:"pointer", transition:"all .15s", textAlign:"left",
                background: active===m.id ? `rgba(224,168,90,.12)` : "transparent",
                color: active===m.id ? T.gold : T.muted,
                fontWeight: active===m.id ? 700 : 400,
                borderLeft: active===m.id ? `3px solid ${T.gold}` : "3px solid transparent",
              }}>
                <span style={{ fontSize:16, flexShrink:0 }}>{m.icon}</span>
                {sideOpen && <span style={{ fontSize:13, whiteSpace:"nowrap" }}>{m.label}</span>}
              </button>
            ))}
          </nav>

          {/* Toggle */}
          <div style={{ padding:"12px 8px", borderTop:`1px solid ${T.border}` }}>
            <button className="btn-ghost" onClick={() => setSide(p=>!p)}
              style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, padding:"8px" }}>
              {sideOpen ? "◀" : "▶"}
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
          {/* Topbar */}
          <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"10px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:10, gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {/* Hamburguer mobile */}
              <button onClick={()=>setSide(p=>!p)} style={{
                background:"transparent", border:`1px solid ${T.border}`, borderRadius:8,
                color:T.muted, cursor:"pointer", padding:"6px 8px", fontSize:14,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0
              }}>☰</button>
              <span style={{ fontSize:16 }}>{MODULES.find(m=>m.id===active)?.icon}</span>
              <span className="topbar-title" style={{ fontWeight:700, fontSize:15, color:T.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:200 }}>
                {MODULES.find(m=>m.id===active)?.label}
              </span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
              <div style={{ fontSize:11, color:T.muted, fontFamily:"'IBM Plex Mono',monospace", whiteSpace:"nowrap" }}>
                {new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}
              </div>
              {/* Avatar dourado */}
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ textAlign:"right", display:"none" }} className="hide-mobile">
                  <div style={{ fontSize:10, color:T.muted }}>{session?.user?.email?.split("@")[0]}</div>
                </div>
                <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${T.gold},${T.navy})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:T.dark, flexShrink:0, letterSpacing:".05em", cursor:"default" }} title={session?.user?.email}>
                  {(session?.user?.email||"AG").slice(0,2).toUpperCase()}
                </div>
                <button onClick={handleLogout} title="Sair" style={{
                  background:"transparent", border:`1px solid ${T.border}`,
                  borderRadius:8, color:T.muted, cursor:"pointer",
                  padding:"6px 8px", fontSize:12, transition:"all .15s",
                  display:"flex", alignItems:"center", gap:4
                }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.red; e.currentTarget.style.color=T.red; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.muted; }}>
                  ⏻
                </button>
              </div>
            </div>
          </div>

          {/* Main */}
          <div style={{ flex:1, padding:"20px", overflowY:"auto", minWidth:0 }}>
            {/* Banner conexão Supabase */}
            {dbError && (
              <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", borderRadius:10, padding:"12px 16px", marginBottom:20, display:"flex", gap:10, alignItems:"center" }}>
                <span style={{ fontSize:16 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:"#EF4444" }}>Erro ao conectar ao Supabase</div>
                  <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>{dbError} — exibindo dados de demonstração.</div>
                </div>
              </div>
            )}
            {!dbError && !loading && (
              <div style={{ background:"rgba(224,168,90,.08)", border:"1px solid rgba(224,168,90,.3)", borderRadius:10, padding:"10px 16px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:"#E0A85A", display:"inline-block", boxShadow:"0 0 6px #E0A85A" }}/>
                  <span style={{ fontSize:12, color:"#E0A85A", fontWeight:600 }}>Conectado ao Supabase — ERP AGREGAR · dados em tempo real</span>
                </div>
                <span style={{ fontSize:11, color:"#64748B" }}>vikhnbvgjemmprpfxwif.supabase.co</span>
              </div>
            )}
            {loading && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:200, gap:12, flexDirection:"column" }}>
                <div style={{ width:32, height:32, border:"3px solid #243447", borderTop:"3px solid #2563EB", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
                <span style={{ color:"#64748B", fontSize:13 }}>Carregando dados do banco...</span>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}
            {!loading && renderModule()}
          </div>
        </div>
      </div>
    </>
  );
}
