'use strict';
/**
 * Funções do setor de Segurança do Trabalho.
 */
const FuncoesSeguranca = {

  f01VerEscala: () => FuncaoCore.executar({
    titulo: 'Ver Escala de Trabalho',
    descricao: 'Visualiza a escala de plantões e rondas do setor de Segurança do Trabalho.',
    nivelMinimo: 0, departamentos: ['Segurança do Trabalho'],
    render: (user) => window.SegurancaForms && window.SegurancaForms.f01VerEscala(user),
  }),

  f02Ocorrencias: () => FuncaoCore.executar({
    titulo: 'Ocorrências de Segurança',
    descricao: 'Registro e acompanhamento de acidentes, incidentes e quase-acidentes no trabalho.',
    nivelMinimo: 3, departamentos: ['Segurança do Trabalho'],
    render: (user) => window.SegurancaForms && window.SegurancaForms.f02Ocorrencias(user),
  }),

  f03RegistrarCAT: () => FuncaoCore.executar({
    titulo: 'Comunicação de Acidente de Trabalho (CAT)',
    descricao: 'Emissão e registro de CATs para acidentes com afastamento conforme legislação trabalhista.',
    nivelMinimo: 4, departamentos: ['Segurança do Trabalho'],
    render: (user) => window.SegurancaForms && window.SegurancaForms.f03RegistrarCAT(user),
  }),

  f04Inspecoes: () => FuncaoCore.executar({
    titulo: 'Inspeções de Segurança',
    descricao: 'Realização e registro de inspeções periódicas de segurança por departamento.',
    nivelMinimo: 4, departamentos: ['Segurança do Trabalho'],
    render: (user) => window.SegurancaForms && window.SegurancaForms.f04Inspecoes(user),
  }),

  f05Treinamentos: () => FuncaoCore.executar({
    titulo: 'Treinamentos de Segurança',
    descricao: 'Registro de treinamentos obrigatórios de segurança (NRs) e lista de participantes.',
    nivelMinimo: 4, departamentos: ['Segurança do Trabalho'],
    render: (user) => window.SegurancaForms && window.SegurancaForms.f05Treinamentos(user),
  }),

  f06GerenciarEscalas: () => FuncaoCore.executar({
    titulo: 'Gerenciar Escalas',
    descricao: 'Define turnos e plantões dos técnicos de segurança do trabalho.',
    nivelMinimo: 4, departamentos: ['Segurança do Trabalho'],
    render: (user) => window.SegurancaForms && window.SegurancaForms.f06GerenciarEscalas(user),
  }),
};

window.FuncoesSeguranca = FuncoesSeguranca;
