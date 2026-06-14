'use strict';

// Remove formatação de CPF: "123.456.789-09" → "12345678909"
function normalizeCpf(cpf) {
  return String(cpf).replace(/[^\d]/g, '');
}

// Valida CPF (dígitos verificadores)
function validarCpf(cpf) {
  cpf = normalizeCpf(cpf);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(cpf[10]);
}

// Formata CPF para exibição
function formatarCpf(cpf) {
  cpf = normalizeCpf(cpf);
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Paginação padrão
function paginar(page = 1, limit = 20) {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  return { offset: (p - 1) * l, limit: l, page: p };
}

// Retorna apenas os campos permitidos de um objeto
function pick(obj, fields) {
  return fields.reduce((acc, k) => { if (k in obj) acc[k] = obj[k]; return acc; }, {});
}

// Remove campos undefined/null de um objeto (para UPDATE dinâmico)
function omitEmpty(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}

module.exports = { normalizeCpf, validarCpf, formatarCpf, paginar, pick, omitEmpty };
