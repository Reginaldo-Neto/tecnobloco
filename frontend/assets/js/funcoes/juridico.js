'use strict';
/**
 * Funções do setor Jurídico / Compliance.
 */
const FuncoesJuridico = {

  f01VerEscala: () => FuncaoCore.executar({
    titulo: 'Ver Escala de Trabalho',
    descricao: 'Visualiza a escala e agenda de compromissos do departamento Jurídico.',
    nivelMinimo: 0, departamentos: ['Jurídico'],
    render: (user) => window.JuridicoForms && window.JuridicoForms.f01VerEscala(user),
  }),

  f02Contratos: () => FuncaoCore.executar({
    titulo: 'Contratos',
    descricao: 'Gestão do ciclo de vida dos contratos: criação, vigência, renovação e encerramento.',
    nivelMinimo: 4, departamentos: ['Jurídico'],
    render: (user) => window.JuridicoForms && window.JuridicoForms.f02Contratos(user),
  }),

  f03Processos: () => FuncaoCore.executar({
    titulo: 'Processos Judiciais / Administrativos',
    descricao: 'Acompanhamento de processos judiciais e administrativos em que a empresa é parte.',
    nivelMinimo: 4, departamentos: ['Jurídico'],
    render: (user) => window.JuridicoForms && window.JuridicoForms.f03Processos(user),
  }),

  f04AgendaPrazos: () => FuncaoCore.executar({
    titulo: 'Agenda de Prazos',
    descricao: 'Controle de prazos processuais e contratuais com alertas de vencimento.',
    nivelMinimo: 4, departamentos: ['Jurídico'],
    render: (user) => window.JuridicoForms && window.JuridicoForms.f04AgendaPrazos(user),
  }),

  f05GerenciarEscalas: () => FuncaoCore.executar({
    titulo: 'Gerenciar Escalas',
    descricao: 'Define turnos e disponibilidade dos profissionais do departamento Jurídico.',
    nivelMinimo: 5, departamentos: ['Jurídico'],
    render: (user) => window.JuridicoForms && window.JuridicoForms.f05GerenciarEscalas(user),
  }),
};

window.FuncoesJuridico = FuncoesJuridico;
