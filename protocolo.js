"use strict";

const Protocolo = (() => {
  const CONFRONTOS = [["mcts", "minimax"], ["mcts", "monteCarlo"], ["minimax", "monteCarlo"]];
  const SEMENTE_BASE = 2026;
  const VERSAO = 1;
  const BASE = { iteracoesMcts: 1000, iteracoesMonteCarlo: 1000,
    profundidadeMinimax: 4, exploracao: Math.SQRT2, horizonte: 80 };
  const VARIANTES = [
    ["base", "Referência · esforço fixo", {}],
    ["iteracoes", "MCTS · 500 iterações", { iteracoesMcts: 500 }],
    ["profundidade", "Minimax · profundidade 3", { profundidadeMinimax: 3 }],
    ["exploracao", "MCTS · exploração 1", { exploracao: 1 }],
    ["horizonte", "Simulações · horizonte 40", { horizonte: 40 }]
  ];
  const NOMES_POSICOES = { vazio: "Vazio", abertura: "Abertura", meio: "Meio-jogo", final: "Final" };

  function condicao(etapa, bloco, pares, limiteMs, posicao, rotulo, identificador = etapa, mudancas = {}) {
    const parametros = limiteMs ? { ...BASE, iteracoesMcts: 0, iteracoesMonteCarlo: 0, profundidadeMinimax: 0 } : BASE;
    return { etapa, bloco, pares, limiteMs, posicao, rotulo, cenario: identificador, ...parametros, ...mudancas };
  }

  function condicoes(bloco) {
    switch (bloco) {
      case "piloto": return [condicao("piloto", "tempo", 10, 100, "vazio", "Piloto · 100 ms")];
      case "principal": return [
        condicao("aquecimento", "tempo", 5, 100, "vazio", "Aquecimento · 100 ms"),
        condicao("principal", "tempo", 100, 100, "vazio", "Principal · vazio · 100 ms")
      ];
      case "fixo": return [condicao("fixo", "fixo", 100, 0, "vazio", "Esforço fixo · vazio")];
      case "ablacoes": return VARIANTES.map(([id, nome, mudancas]) =>
        condicao("ablacoes", "ablacao", 20, 0, "vazio", nome, "ablacao-" + id, mudancas));
      case "posicoes": return Object.entries(NOMES_POSICOES).map(([id, nome]) =>
        condicao("posicoes", "posicoes", 20, 100, id, nome + " · 100 ms", "posicao-" + id));
      default: throw new Error("Bloco de coleta inválido.");
    }
  }

  function embaralhar(lista, sortear) {
    for (let i = lista.length - 1; i > 0; i--) {
      const j = Math.floor(sortear() * (i + 1));
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista;
  }

  function criarPlano(bloco) {
    const sortear = Motor.criarGerador(Relatorio.sementeDoTexto(SEMENTE_BASE + "|ordem|" + bloco));
    return condicoes(bloco).flatMap(({ pares, ...cenario }) => {
      const paresDePartidas = [];
      for (const [agenteA, agenteB] of CONFRONTOS) {
        const confronto = Relatorio.NOMES[agenteA] + " × " + Relatorio.NOMES[agenteB];
        for (let par = 1; par <= pares; par++) {
          // As condições de teste usam sementes comuns. Piloto e aquecimento usam fluxos próprios.
          const grupo = ["piloto", "aquecimento"].includes(cenario.etapa) ? cenario.etapa : "teste";
          const semente = Relatorio.sementeDoTexto(SEMENTE_BASE + "|" + grupo + "|" + par);
          paresDePartidas.push([1, 2].map(perna => ({
            ...cenario, agenteA, agenteB, confronto, par, perna, corA: perna, semente,
            sementeA: Relatorio.sementeDoTexto(semente + "|" + agenteA),
            sementeB: Relatorio.sementeDoTexto(semente + "|" + agenteB)
          })));
        }
      }
      return embaralhar(paresDePartidas, sortear).flat();
    }).map((tarefa, indice) => ({ ...tarefa, ordem: indice + 1 }));
  }

  // Cada par contribui com -2, -1, 0, 1 ou 2 em torno da pontuação neutra.
  // Acumulamos a distribuição de somas sob todas as trocas independentes de sinal.
  function permutacao(diferencas) {
    let distribuicao = new Map([[0, 1]]);
    for (const valor of diferencas) {
      const nova = new Map();
      for (const [soma, probabilidade] of distribuicao) {
        for (const destino of [soma - valor, soma + valor]) {
          nova.set(destino, (nova.get(destino) ?? 0) + probabilidade / 2);
        }
      }
      distribuicao = nova;
    }
    const observado = Math.abs(diferencas.reduce((soma, valor) => soma + valor, 0));
    return [...distribuicao].reduce((p, [soma, peso]) => p + (Math.abs(soma) >= observado ? peso : 0), 0);
  }

  function holm(valores) {
    const ordenados = valores.map((p, indice) => ({ p, indice })).sort((a, b) => a.p - b.p);
    const ajustados = [];
    let maior = 0;
    ordenados.forEach(({ p, indice }, ordem) => {
      maior = Math.max(maior, Math.min(1, p * (ordenados.length - ordem)));
      ajustados[indice] = maior;
    });
    return ajustados;
  }

  function significancia(registros) {
    const grupos = CONFRONTOS.map(([a, b]) => {
      const pares = new Map();
      for (const r of registros) {
        if (r.etapa !== "principal" || r.agenteA !== a || r.agenteB !== b) continue;
        pares.set(r.par, (pares.get(r.par) ?? 0) + (r.resultado === "A" ? 1 : r.resultado === "B" ? -1 : 0));
      }
      return { a, b, pares };
    });
    if (registros.filter(r => r.etapa === "principal").length !== 600 || grupos.some(g => g.pares.size !== 100)) return [];
    const valores = grupos.map(g => permutacao([...g.pares.values()]));
    const ajustados = holm(valores);
    return grupos.map((g, i) => ({ confronto: Relatorio.NOMES[g.a] + " × " + Relatorio.NOMES[g.b],
      p: valores[i], ajustado: ajustados[i], significativo: ajustados[i] <= 0.05 }));
  }

  function validarMedicoes(registro) {
    for (const [indice, lado] of ["A", "B"].entries()) {
      const medidas = registro.medicoes.filter((_, turno) =>
        (turno % 2 === registro.corA - 1 ? 0 : 1) === indice);
      const somar = coluna => medidas.reduce((total, medida) => total + medida[coluna], 0);
      const campos = ["tempoTotal", "nos", "simulacoes", "truncadas", "profundidadeMedia", "coberturaInsuficiente"];
      const totais = campos.map((_, coluna) => somar(coluna));
      totais[4] /= medidas.length || 1;
      const acima = medidas.filter(m => registro.limiteMs && m[0] > registro.limiteMs).length;
      if (campos.some((campo, coluna) => Math.abs(registro[campo + lado] - totais[coluna]) > 0.00001) ||
          registro["acimaDoPrazo" + lado] !== acima) throw new Error("As medições divergem dos totais da partida.");
    }
  }

  function validar(sessao) {
    if (!sessao || sessao.protocolo !== VERSAO || typeof sessao.execucao !== "string" ||
        !sessao.execucao || typeof sessao.ambiente !== "string") throw new Error("Arquivo de coleta inválido.");
    const plano = new Map(criarPlano(sessao.bloco).map(tarefa => [Relatorio.identificador(tarefa), tarefa]));
    Relatorio.validarRegistros(sessao.registros);
    for (const r of sessao.registros) {
      const tarefa = plano.get(Relatorio.identificador(r));
      if (!tarefa || r.execucao !== sessao.execucao || Object.keys(tarefa).some(campo => tarefa[campo] !== r[campo])) {
        throw new Error("Há partidas incompatíveis com o plano de coleta.");
      }
      const estado = Torneio.estadoInicial(r.posicao, r.semente);
      if (Motor.chave(estado) !== r.chaveInicial || estado.turnos !== r.turnosIniciais ||
          !Array.isArray(r.acoes) || !Array.isArray(r.medicoes) || r.medicoes.length !== r.turnos ||
          r.medicoes.some(m => !Array.isArray(m) || m.length !== 6 || m.some(v => !Number.isFinite(v) || v < 0))) {
        throw new Error("Histórico ou medições inválidos.");
      }
      validarMedicoes(r);
      Torneio.validarHistorico(r, estado);
    }
    return sessao;
  }

  return Object.freeze({ VERSAO, SEMENTE_BASE, criarPlano, permutacao, holm, significancia, validar });
})();
