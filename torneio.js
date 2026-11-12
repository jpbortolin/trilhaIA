"use strict";

const Torneio = (() => {
  const PARES_PADRAO = 30;
  const TEMPO_PADRAO = 100;
  const TEMPOS = [25, 100, 500];
  const ITERACOES_FIXAS = 1000;
  const PROFUNDIDADE_FIXA = 4;
  const ITERACOES_ABLACAO = [100, 500, 1000, 2000];
  const BLOCOS = ["tempo", "posicoes", "fixo", "ablacao"];
  const CONFRONTOS = [["mcts", "minimax"], ["mcts", "monteCarlo"], ["minimax", "monteCarlo"]];
  function validarConfiguracao(c) {
    if (!c || !Number.isInteger(c.pares) || c.pares < 1 || c.pares > 200 ||
        !Number.isInteger(c.semente) || c.semente < 0 || c.semente > 4294967295 || !TEMPOS.includes(c.tempoBase) ||
        !Array.isArray(c.blocos) || !c.blocos.length || c.blocos.some(b => !BLOCOS.includes(b)) ||
        new Set(c.blocos).size !== c.blocos.length || !Array.isArray(c.tempos) ||
        c.tempos.some(t => !TEMPOS.includes(t)) || new Set(c.tempos).size !== c.tempos.length ||
        (c.blocos.includes("tempo") && !c.tempos.length)) throw new Error("Confira os pares, a semente e os blocos selecionados.");
    return { pares: c.pares, semente: c.semente, tempoBase: c.tempoBase,
      blocos: BLOCOS.filter(b => c.blocos.includes(b)), tempos: TEMPOS.filter(t => c.tempos.includes(t)) };
  }

  function criarCenarios(configuracao) {
    const cenarios = [];
    function adicionar(bloco, posicao, limiteMs, iteracoesMcts = 0) {
      cenarios.push({ bloco, posicao, limiteMs, iteracoesMcts,
        iteracoesMonteCarlo: limiteMs ? 0 : ITERACOES_FIXAS,
        profundidadeMinimax: limiteMs ? 0 : PROFUNDIDADE_FIXA,
        cenario: [bloco, posicao, limiteMs || iteracoesMcts].join("-") });
    }
    if (configuracao.blocos.includes("tempo")) configuracao.tempos.forEach(tempo => adicionar("tempo", "vazio", tempo));
    if (configuracao.blocos.includes("posicoes")) ["vazio", "abertura", "meio", "final"].forEach(posicao => adicionar("posicoes", posicao, configuracao.tempoBase));
    if (configuracao.blocos.includes("fixo")) adicionar("fixo", "meio", 0, ITERACOES_FIXAS);
    if (configuracao.blocos.includes("ablacao")) ITERACOES_ABLACAO.forEach(iteracoes => adicionar("ablacao", "meio", 0, iteracoes));
    return cenarios;
  }

  function criarPlano(configuracao) {
    const c = validarConfiguracao(configuracao);
    const tarefas = [];
    for (const cenario of criarCenarios(c)) {
      const confrontos = cenario.bloco === "ablacao" ? [CONFRONTOS[0]] : CONFRONTOS;
      for (const [agenteA, agenteB] of confrontos) {
        for (let par = 1; par <= c.pares; par++) {
          // O mesmo par usa a mesma semente em todos os cenários e confrontos.
          const semente = Relatorio.sementeDoTexto(c.semente + "|par|" + par);
          for (const perna of [1, 2]) tarefas.push({ ...cenario, agenteA, agenteB, par, perna, semente, corA: perna,
            confronto: Relatorio.NOMES[agenteA] + " × " + Relatorio.NOMES[agenteB] });
        }
      }
    }
    return tarefas;
  }

  function estadoInicial(posicao, semente) {
    if (posicao === "vazio") return Motor.criarEstado();
    if (posicao === "abertura") {
      const sortear = Motor.criarGerador(semente);
      let estado = Motor.criarEstado();
      for (let turno = 0; turno < 8; turno++) {
        const acoes = Motor.gerarAcoes(estado);
        estado = Motor.aplicarAcao(estado, acoes[Math.floor(sortear() * acoes.length)], false);
      }
      return estado;
    }
    const tabuleiro = Array(24).fill(0);
    const brancas = posicao === "meio" ? [0, 2, 4, 6, 9, 11] : [0, 2, 4];
    const pretas = posicao === "meio" ? [8, 10, 12, 14, 17, 19] : [8, 10, 12, 14];
    if (!["meio", "final"].includes(posicao)) throw new Error("Posição inicial desconhecida.");
    brancas.forEach(p => tabuleiro[p] = 1); pretas.forEach(p => tabuleiro[p] = 2);
    return Motor.criarEstado(tabuleiro, [0, 0, 0], 1);
  }

  function opcoesDoAgente(tarefa, nome, sortear) {
    if (tarefa.limiteMs) return { limiteMs: tarefa.limiteMs, rng: sortear };
    return nome === "minimax" ? { profundidade: tarefa.profundidadeMinimax, rng: sortear } :
      { iteracoes: nome === "mcts" ? tarefa.iteracoesMcts : tarefa.iteracoesMonteCarlo, rng: sortear,
        horizonte: tarefa.horizonte, exploracao: tarefa.exploracao };
  }

  async function jogarPartida(tarefa, execucao, verificar = () => {}, informar = () => {}) {
    let estado = estadoInicial(tarefa.posicao, tarefa.semente);
    const inicial = Motor.chave(estado), turnosIniciais = estado.turnos;
    // Geradores independentes por agente, reiniciados na segunda partida do par.
    const geradores = Object.fromEntries([tarefa.agenteA, tarefa.agenteB].map(nome =>
      [nome, Motor.criarGerador(Relatorio.sementeDoTexto(tarefa.semente + "|" + nome))]));
    const acoes = [];
    const medicoes = [];
    const totais = ["A", "B"].map(() => ({ jogadas: 0, tempoTotal: 0, nos: 0, simulacoes: 0,
      profundidade: 0, truncadas: 0, coberturaInsuficiente: 0, acimaDoPrazo: 0 }));
    let fim = Motor.resultado(estado);
    while (!fim) {
      informar(estado.turnos - turnosIniciais + 1);
      await new Promise(concluir => setTimeout(concluir, 0));
      verificar();
      const lado = estado.jogador === tarefa.corA ? 0 : 1;
      const nome = lado === 0 ? tarefa.agenteA : tarefa.agenteB;
      const inicio = performance.now();
      const opcoes = opcoesDoAgente(tarefa, nome, geradores[nome]);
      if (tarefa.etapa) opcoes.inicioMedicao = inicio;
      const resposta = Agentes[nome].escolherAcao(estado, opcoes);
      const tempo = performance.now() - inicio;
      verificar();
      estado = Motor.aplicarAcao(estado, resposta.acao);
      acoes.push(resposta.acao);
      fim = Motor.resultado(estado);
      const total = totais[lado], e = resposta.estatisticas;
      const tempoMedido = tarefa.etapa ? tempo : e.tempoMs;
      if (tarefa.etapa) medicoes.push([tempoMedido, e.nos, e.simulacoes, e.truncadas, e.profundidade, Number(!!e.coberturaInsuficiente)]);
      total.jogadas++; total.tempoTotal += tempoMedido; total.nos += e.nos; total.simulacoes += e.simulacoes;
      total.profundidade += e.profundidade; total.truncadas += e.truncadas;
      if (e.coberturaInsuficiente) total.coberturaInsuficiente++;
      if (tarefa.limiteMs && tempoMedido > tarefa.limiteMs) total.acimaDoPrazo++;
    }
    // Dá ao navegador oportunidade de informar ocultação antes de aceitar o resultado.
    await new Promise(concluir => setTimeout(concluir, 0));
    verificar();
    const registro = { versao: 1, execucao, ...tarefa, quemComecou: tarefa.corA === 1 ? tarefa.agenteA : tarefa.agenteB,
      resultado: fim.vencedor === 0 ? "empate" : fim.vencedor === tarefa.corA ? "A" : "B",
      motivo: fim.motivo, chaveInicial: inicial, turnosIniciais, turnos: acoes.length, acoes };
    totais.forEach((total, indice) => {
      const lado = indice === 0 ? "A" : "B";
      for (const nome of ["jogadas", "tempoTotal", "nos", "simulacoes", "truncadas", "coberturaInsuficiente", "acimaDoPrazo"]) registro[nome + lado] = total[nome];
      registro["tempoMedio" + lado] = total.jogadas ? total.tempoTotal / total.jogadas : 0;
      registro["profundidadeMedia" + lado] = total.jogadas ? total.profundidade / total.jogadas : 0;
    });
    if (tarefa.etapa) registro.medicoes = medicoes;
    return registro;
  }

  function validarHistorico(registro, estado) {
    if (registro.acoes === undefined) return; // CSV e JSON anteriores podem ter apenas totais.
    if (!Array.isArray(registro.acoes) || registro.acoes.length !== registro.turnos) {
      throw new Error("O histórico não contém todos os turnos da partida.");
    }
    for (const acao of registro.acoes) estado = Motor.aplicarAcao(estado, acao);
    const fim = Motor.resultado(estado);
    const resultado = !fim ? null : fim.vencedor === 0 ? "empate" :
      fim.vencedor === registro.corA ? "A" : "B";
    if (resultado !== registro.resultado || fim.motivo !== registro.motivo) {
      throw new Error("O desfecho não corresponde ao histórico de jogadas.");
    }
  }

  function validarCondicoes(registros) {
    Relatorio.validarRegistros(registros);
    const iniciais = new Map();
    for (const r of registros) {
      const catalogo = criarCenarios({ blocos: BLOCOS, tempos: TEMPOS, tempoBase: r.limiteMs || TEMPO_PADRAO });
      const c = catalogo.find(candidato => candidato.cenario === r.cenario);
      if (!c || ["bloco", "posicao", "limiteMs", "iteracoesMcts", "iteracoesMonteCarlo", "profundidadeMinimax"].some(campo => r[campo] !== c[campo]) ||
          !CONFRONTOS.some(([a, b]) => a === r.agenteA && b === r.agenteB) ||
          (r.bloco === "ablacao" && (r.agenteA !== "mcts" || r.agenteB !== "minimax")) ||
          (r.limiteMs && !TEMPOS.includes(r.limiteMs))) throw new Error("Cenário ou orçamento incompatível com o protocolo.");
      const chave = r.posicao + "|" + r.semente;
      if (!iniciais.has(chave)) iniciais.set(chave, estadoInicial(r.posicao, r.semente));
      const inicial = iniciais.get(chave);
      if (r.chaveInicial !== Motor.chave(inicial) || r.turnosIniciais !== inicial.turnos) throw new Error("A posição inicial não corresponde à semente e ao cenário.");
      validarHistorico(r, inicial);
    }
    return registros;
  }

  function validarSessao(valor) {
    if (!valor || valor.versao !== 1 || typeof valor.execucao !== "string" || !valor.execucao || valor.execucao.length > 200) throw new Error("JSON de progresso inválido.");
    const registros = validarCondicoes(valor.registros);
    if (registros.some(r => r.execucao !== valor.execucao)) throw new Error("Identificação da execução inconsistente.");
    const configuracao = valor.configuracao ? validarConfiguracao(valor.configuracao) : null;
    if (configuracao) {
      const plano = new Map(criarPlano(configuracao).map(t => [Relatorio.identificador(t), t]));
      for (const r of registros) {
        const tarefa = plano.get(Relatorio.identificador(r));
        if (!tarefa || Object.keys(tarefa).some(c => tarefa[c] !== r[c])) throw new Error("Os dados não pertencem ao plano salvo.");
      }
    }
    return { versao: 1, execucao: valor.execucao, configuracao, registros,
      ambiente: typeof valor.ambiente === "string" ? valor.ambiente.slice(0, 500) : "Não informado" };
  }

  return Object.freeze({ criarPlano, criarCenarios, estadoInicial, opcoesDoAgente, jogarPartida, validarHistorico, validarCondicoes, validarSessao });
})();
