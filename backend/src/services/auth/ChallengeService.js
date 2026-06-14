'use strict';

const crypto = require('crypto');

/**
 * ChallengeService — Desafio de segurança em sessão ativa
 *
 * A cada 300 segundos (configurado no frontend) o usuário recebe um
 * desafio de cifra ROT-N. Precisa responder corretamente em até 120s.
 * 3 erros consecutivos ou timeout → force_logout.
 *
 * Armazenamento: Map em memória (sem DB — segurança efêmera intencional).
 * Entradas expiradas são purgadas a cada 5 minutos.
 */

// Key: challengeId (hex), Value: { userId, answer, expiresAt, attempts }
const _store = new Map();

// Purga entradas expiradas automaticamente
const _purgeTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, c] of _store.entries()) {
    if (c.expiresAt < now) _store.delete(id);
  }
}, 5 * 60 * 1000);

// Node.js: evita que o timer impeça o processo de encerrar
if (_purgeTimer.unref) _purgeTimer.unref();

// Pool de palavras do domínio (construção civil) — maiúsculas, sem acento
const WORDS = [
  'CONCRETO', 'BLOCO', 'TUBO', 'ARGAMASSA', 'CIMENTO',
  'AREIA', 'BRITA', 'ACO', 'FORMA', 'MOLDE',
  'PLANTA', 'TURNO', 'LOTE', 'MARCA', 'CURA',
  'VIBRA', 'TANQUE', 'PRENSA', 'TRAÇO', 'LACRE',
  'PALLET', 'USINA', 'BOMBA', 'FILTRO', 'OBRA',
];

/**
 * Aplica cifra ROT-N: desloca apenas A-Z por n posições.
 * @param {string} str  Texto em maiúsculas
 * @param {number} n    Deslocamento (1-25)
 * @returns {string}
 */
function _rotN(str, n) {
  return str.split('').map(ch => {
    if (ch >= 'A' && ch <= 'Z') {
      return String.fromCharCode(((ch.charCodeAt(0) - 65 + n) % 26) + 65);
    }
    return ch;
  }).join('');
}

class ChallengeService {
  /**
   * Gera um novo desafio para o usuário.
   * @param {number} userId
   * @returns {{ challengeId: string, encoded: string, shift: number, expiresAt: number, wordLen: number }}
   */
  generate(userId) {
    // Escolhe palavra e deslocamento aleatórios
    const word  = WORDS[Math.floor(Math.random() * WORDS.length)];
    const shift = Math.floor(Math.random() * 20) + 3; // 3–22
    const encoded    = _rotN(word, shift);
    const expiresAt  = Date.now() + 2 * 60 * 1000;  // 2 minutos para resolver
    const challengeId = crypto.randomBytes(16).toString('hex');

    _store.set(challengeId, {
      userId,
      answer:   word,
      expiresAt,
      attempts: 0,
    });

    return { challengeId, encoded, shift, expiresAt, wordLen: word.length };
  }

  /**
   * Verifica a resposta do usuário.
   * @param {string} challengeId
   * @param {string} answer       Resposta informada (case-insensitive)
   * @param {number} userId       Deve corresponder ao dono do desafio
   * @returns {{ ok: boolean, forceLogout: boolean, message: string, attemptsLeft?: number }}
   */
  verify(challengeId, answer, userId) {
    const challenge = _store.get(challengeId);

    if (!challenge) {
      return { ok: false, forceLogout: true,
               message: 'Desafio não encontrado ou expirado. Faça login novamente.' };
    }

    if (challenge.userId !== userId) {
      _store.delete(challengeId);
      return { ok: false, forceLogout: true, message: 'Desafio inválido.' };
    }

    if (challenge.expiresAt < Date.now()) {
      _store.delete(challengeId);
      return { ok: false, forceLogout: true,
               message: 'Tempo esgotado. Sessão encerrada por segurança.' };
    }

    const normalized = (answer || '').toUpperCase().trim();

    if (normalized !== challenge.answer) {
      challenge.attempts++;
      const left = 3 - challenge.attempts;

      if (left <= 0) {
        _store.delete(challengeId);
        return { ok: false, forceLogout: true,
                 message: 'Muitas tentativas incorretas. Sessão encerrada.' };
      }

      return { ok: false, forceLogout: false,
               message: `Resposta incorreta. ${left} tentativa(s) restante(s).`,
               attemptsLeft: left };
    }

    _store.delete(challengeId);
    return { ok: true, forceLogout: false, message: 'Verificação concluída com sucesso.' };
  }

  /**
   * Invalida todos os desafios ativos de um usuário (usado no logout).
   * @param {number} userId
   */
  clearForUser(userId) {
    for (const [id, c] of _store.entries()) {
      if (c.userId === userId) _store.delete(id);
    }
  }
}

module.exports = new ChallengeService();
