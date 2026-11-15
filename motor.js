"use strict";

const Motor = (() => {
  // Cada quadrado tem oito pontos em sentido horário, desde o canto superior esquerdo.
  // Externo: 0 a 7; intermediário: 8 a 15; interno: 16 a 23.
  const ADJACENCIAS = [
    [1, 7], [0, 2, 9], [1, 3], [2, 4, 11],
    [3, 5], [4, 6, 13], [5, 7], [6, 0, 15],
    [9, 15], [8, 10, 1, 17], [9, 11], [10, 12, 3, 19],
    [11, 13], [12, 14, 5, 21], [13, 15], [14, 8, 7, 23],
    [17, 23], [16, 18, 9], [17, 19], [18, 20, 11],
    [19, 21], [20, 22, 13], [21, 23], [22, 16, 15]
  ];
  const MOINHOS = [
    [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
    [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
    [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
    [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23]
  ];
  ADJACENCIAS.forEach(Object.freeze);
  MOINHOS.forEach(Object.freeze);
  Object.freeze(ADJACENCIAS);
  Object.freeze(MOINHOS);

  function contarPecas(estado, jogador) {
    return estado.tabuleiro.reduce((total, peca) => total + Number(peca === jogador), 0);
  }

  function chave(estado) {
    return estado.tabuleiro.join("") + ":" + estado.jogador +
      ":" + estado.reservas[1] + ":" + estado.reservas[2];
  }

  function criarEstado(tabuleiro = Array(24).fill(0), reservas = [0, 9, 9], jogador = 1) {
    if (tabuleiro.length !== 24 || !Array.from(tabuleiro).every(p => [0, 1, 2].includes(p)) ||
        ![1, 2].includes(jogador) || reservas.length !== 3 || reservas[0] !== 0 ||
        !reservas.every(r => Number.isInteger(r) && r >= 0 && r <= 9)) {
      throw new Error("Estado inicial inválido.");
    }
    const estado = {
      tabuleiro: Int8Array.from(tabuleiro), reservas: Array.from(reservas), jogador,
      turnos: 0, semCaptura: 0, historico: new Map()
    };
    if ([1, 2].some(j => contarPecas(estado, j) + reservas[j] > 9)) {
      throw new Error("Um jogador não pode ter mais de nove peças.");
    }
    estado.historico.set(chave(estado), 1);
    return estado;
  }

  function copiarEstado(estado) {
    return { ...estado, tabuleiro: estado.tabuleiro.slice(),
      reservas: estado.reservas.slice(), historico: new Map(estado.historico) };
  }

  function emMoinho(tabuleiro, posicao, jogador) {
    return MOINHOS.some(trinca => trinca.includes(posicao) &&
      trinca.every(p => tabuleiro[p] === jogador));
  }

  function removiveis(tabuleiro, jogador) {
    const pecas = [];
    for (let p = 0; p < 24; p++) if (tabuleiro[p] === jogador) pecas.push(p);
    const livres = pecas.filter(p => !emMoinho(tabuleiro, p, jogador));
    return livres.length ? livres : pecas;
  }

  function fase(estado, jogador = estado.jogador) {
    if (estado.reservas[1] + estado.reservas[2] > 0) return "colocação";
    return contarPecas(estado, jogador) === 3 ? "voo" : "movimento";
  }

  // Ações básicas não incluem capturas; servem também para medir mobilidade.
  function acoesBasicas(estado, jogador = estado.jogador) {
    const acoes = [];
    const vazias = [];
    for (let p = 0; p < 24; p++) if (estado.tabuleiro[p] === 0) vazias.push(p);
    if (estado.reservas[jogador] > 0) {
      return vazias.map(destino => ({ origem: null, destino, remocao: null }));
    }
    if (estado.reservas[1] + estado.reservas[2] > 0) return acoes;
    const podeVoar = contarPecas(estado, jogador) === 3;
    for (let origem = 0; origem < 24; origem++) {
      if (estado.tabuleiro[origem] !== jogador) continue;
      const destinos = podeVoar ? vazias : ADJACENCIAS[origem];
      for (const destino of destinos) {
        if (estado.tabuleiro[destino] === 0) acoes.push({ origem, destino, remocao: null });
      }
    }
    return acoes;
  }

  function resultado(estado) {
    // Verificar vitória antes dos três critérios de empate.
    for (const jogador of [estado.jogador, 3 - estado.jogador]) {
      if (estado.reservas[jogador] === 0 && contarPecas(estado, jogador) < 3) {
        return { vencedor: 3 - jogador, motivo: "menos de três peças" };
      }
    }
    if (fase(estado) !== "colocação" && acoesBasicas(estado).length === 0) {
      return { vencedor: 3 - estado.jogador, motivo: "sem movimentos" };
    }
    if ((estado.historico.get(chave(estado)) || 0) >= 3) {
      return { vencedor: 0, motivo: "terceira repetição" };
    }
    if (fase(estado) !== "colocação" && estado.semCaptura >= 100) {
      return { vencedor: 0, motivo: "100 turnos sem captura" };
    }
    if (estado.turnos >= 400) return { vencedor: 0, motivo: "limite de 400 turnos" };
    return null;
  }

  function gerarAcoes(estado) {
    if (resultado(estado)) return [];
    const acoes = [];
    for (const acao of acoesBasicas(estado)) {
      const tabuleiro = estado.tabuleiro.slice();
      if (acao.origem !== null) tabuleiro[acao.origem] = 0;
      tabuleiro[acao.destino] = estado.jogador;
      const capturas = emMoinho(tabuleiro, acao.destino, estado.jogador)
        ? removiveis(tabuleiro, 3 - estado.jogador) : [];
      if (capturas.length) {
        // Mesmo um moinho duplo gera somente uma remoção por ação.
        for (const remocao of capturas) acoes.push({ ...acao, remocao });
      } else acoes.push(acao);
    }
    return acoes;
  }

  function aplicarAcao(estado, acao, validar = true) {
    // Na busca, validar=false só pode ser usado com ações retornadas por gerarAcoes.
    if (validar && (!acao || !gerarAcoes(estado).some(a =>
      a.origem === acao.origem && a.destino === acao.destino && a.remocao === acao.remocao))) {
      throw new Error("Jogada ilegal.");
    }
    const novo = copiarEstado(estado);
    if (acao.origem === null) novo.reservas[estado.jogador]--;
    else novo.tabuleiro[acao.origem] = 0;
    novo.tabuleiro[acao.destino] = estado.jogador;
    if (acao.remocao !== null) novo.tabuleiro[acao.remocao] = 0;
    // A última colocação ainda não conta como turno de movimento sem captura.
    novo.semCaptura = acao.remocao !== null || fase(estado) === "colocação"
      ? 0 : estado.semCaptura + 1;
    novo.turnos++;
    novo.jogador = 3 - estado.jogador;
    const identificador = chave(novo);
    novo.historico.set(identificador, (novo.historico.get(identificador) || 0) + 1);
    return novo;
  }

  function criarGerador(semente) {
    if (!Number.isInteger(semente)) throw new Error("A semente deve ser inteira.");
    // Xorshift32 não aceita estado interno zero; a semente zero usa este valor fixo.
    let valor = (semente >>> 0) || 0x9e3779b9;
    return function sortear() {
      valor ^= valor << 13;
      valor ^= valor >>> 17;
      valor ^= valor << 5;
      return (valor >>> 0) / 4294967296;
    };
  }

  return Object.freeze({ ADJACENCIAS, MOINHOS, criarEstado, copiarEstado,
    contarPecas, chave, emMoinho, removiveis, fase, acoesBasicas,
    resultado, gerarAcoes, aplicarAcao, criarGerador });
})();
