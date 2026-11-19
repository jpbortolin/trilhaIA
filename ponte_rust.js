"use strict";

// Uma decisão inteira acontece dentro do WebAssembly. A interface recebe a jogada e as métricas.
const Rust = (() => {
  const VERSAO = "rust-wasm-1";
  let gerador;
  const binario = Uint8Array.from(atob(BINARIO_RUST), letra => letra.charCodeAt(0));
  const modulo = new WebAssembly.Module(binario);
  const funcoes = new WebAssembly.Instance(modulo, { ambiente: {
    agora: () => performance.now(),
    sortear: () => gerador()
  } }).exports;

  function escrever(estado) {
    const quantidade = estado.historico.size;
    if (31 + quantidade * 3 > 8192) throw new Error("Histórico excede a capacidade do módulo Rust.");
    const dados = new Uint32Array(funcoes.memory.buffer, funcoes.entrada(), 8192);
    dados.set(estado.tabuleiro);
    dados[24] = estado.reservas[1];
    dados[25] = estado.reservas[2];
    dados[26] = estado.jogador;
    dados[27] = estado.turnos;
    dados[28] = estado.semCaptura;
    dados[30] = quantidade;
    let indice = 31;
    for (const [texto, contagem] of estado.historico) {
      const [tabuleiro, jogador, reserva1, reserva2] = texto.split(":");
      let chave = BigInt(jogador) << 48n | BigInt(reserva1) << 50n | BigInt(reserva2) << 54n;
      for (let p = 0; p < 24; p++) chave |= BigInt(tabuleiro[p]) << BigInt(p * 2);
      dados[indice++] = Number(chave & 0xffffffffn);
      dados[indice++] = Number(chave >> 32n);
      dados[indice++] = contagem;
    }
  }

  function lerSaida() {
    // A memória pode crescer durante a busca. Crie uma vista nova a cada leitura.
    return new Float64Array(funcoes.memory.buffer, funcoes.saida(), 1024);
  }

  function decodificar(codigo) {
    if (!codigo) return null;
    const origem = codigo & 31;
    const destino = codigo >> 5 & 31;
    const remocao = codigo >> 10 & 31;
    return { origem: origem ? origem - 1 : null, destino: destino - 1,
      remocao: remocao ? remocao - 1 : null };
  }

  function decidir(algoritmo, estado, opcoes = {}) {
    const inicio = opcoes.inicioMedicao ?? performance.now();
    const temporizado = opcoes.limiteMs !== undefined;
    const iteracoes = opcoes.iteracoes ?? 1000;
    const profundidade = opcoes.profundidade ?? (temporizado ? 400 : 4);
    const horizonte = opcoes.horizonte ?? 80;
    const exploracao = opcoes.exploracao ?? Math.SQRT2;
    gerador = opcoes.rng ?? Motor.criarGerador(1);
    if ((temporizado && (!Number.isFinite(opcoes.limiteMs) || opcoes.limiteMs < 0)) ||
        !Number.isSafeInteger(iteracoes) || iteracoes < 1 || iteracoes > 4294967295 ||
        !Number.isSafeInteger(profundidade) || profundidade < 1 || profundidade > 400 ||
        !Number.isSafeInteger(horizonte) || horizonte < 1 || horizonte > 4294967295 ||
        !Number.isFinite(exploracao) || exploracao < 0 || typeof gerador !== "function") {
      throw new Error("Orçamento, horizonte, exploração ou gerador inválido.");
    }
    escrever(estado);
    const local = typeof gerador.lerEstado === "function" && typeof gerador.definirEstado === "function";
    funcoes.decidir(algoritmo, temporizado ? opcoes.limiteMs : -1, inicio, iteracoes,
      profundidade, horizonte, exploracao, Number(local), local ? gerador.lerEstado() : 0);
    const dados = lerSaida();
    if (local) gerador.definirEstado(dados[9]);
    const estatisticas = {
      tempoMs: 0, nos: dados[2], simulacoes: dados[3], iteracoes: dados[4],
      profundidade: dados[5], truncadas: dados[6], interrompido: !!dados[7]
    };
    if (algoritmo === 1) estatisticas.valor = Number.isNaN(dados[8]) ? null : dados[8];
    if (algoritmo === 2 && dados[10]) {
      estatisticas.amostrasPorAcao = Array.from(dados.slice(16, 16 + dados[10]));
      estatisticas.cobertura = estatisticas.amostrasPorAcao.filter(n => n > 0).length / dados[10];
      estatisticas.coberturaInsuficiente = estatisticas.cobertura < 1;
    }
    const acao = decodificar(dados[0]);
    estatisticas.tempoMs = performance.now() - inicio;
    return { acao, estatisticas };
  }

  function conferir(estado, jogador = estado.jogador) {
    escrever(estado);
    funcoes.conferir_estado(jogador);
    const dados = lerSaida();
    return { acoes: Array.from(dados.slice(16, 16 + dados[0]), decodificar),
      vencedor: dados[1], motivo: dados[2], valor: dados[3] };
  }

  return Object.freeze({ VERSAO, decidir, conferir });
})();

const Agentes = Object.freeze({
  avaliar: AgentesJavaScript.avaliar,
  selecionar: AgentesJavaScript.selecionar,
  mcts: Object.freeze({ escolherAcao: (estado, opcoes) => Rust.decidir(0, estado, opcoes) }),
  minimax: Object.freeze({ escolherAcao: (estado, opcoes) => Rust.decidir(1, estado, opcoes) }),
  monteCarlo: Object.freeze({ escolherAcao: (estado, opcoes) => Rust.decidir(2, estado, opcoes) }),
  aleatorio: Object.freeze({ escolherAcao: (estado, opcoes) => Rust.decidir(3, estado, opcoes) })
});
