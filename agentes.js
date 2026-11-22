"use strict";

const AgentesJavaScript = (() => {
  const HORIZONTE = 80;
  const EXPLORACAO = Math.SQRT2;
  const VITORIA = 10000;
  const PRAZO_ESGOTADO = Symbol("prazo esgotado");

  function preparar(opcoes) {
    const inicio = opcoes.inicioMedicao ?? performance.now();
    const temporizado = opcoes.limiteMs !== undefined;
    const iteracoes = opcoes.iteracoes ?? 1000;
    const profundidade = opcoes.profundidade ?? (temporizado ? 400 : 4);
    const horizonte = opcoes.horizonte ?? HORIZONTE;
    const exploracao = opcoes.exploracao ?? EXPLORACAO;
    if (!Number.isSafeInteger(horizonte) || horizonte < 1 || !Number.isFinite(exploracao) || exploracao < 0) {
      throw new Error("Horizonte ou exploração inválido.");
    }
    const sortear = opcoes.rng ?? Motor.criarGerador(1);
    if ((temporizado && (!Number.isFinite(opcoes.limiteMs) || opcoes.limiteMs < 0)) ||
        !Number.isSafeInteger(iteracoes) || iteracoes < 1 ||
        !Number.isSafeInteger(profundidade) || profundidade < 1 || typeof sortear !== "function") {
      throw new Error("Orçamento ou gerador aleatório inválido.");
    }
    return { inicio, temporizado, iteracoes, profundidade, sortear, horizonte, exploracao,
      prazo: temporizado ? inicio + opcoes.limiteMs : Infinity,
      estatisticas: { tempoMs: 0, nos: 0, simulacoes: 0, iteracoes: 0,
        profundidade: 0, truncadas: 0, interrompido: false } };
  }

  function conferirPrazo(controle) {
    if (performance.now() >= controle.prazo) throw PRAZO_ESGOTADO;
  }

  function terminar(acao, controle) {
    controle.estatisticas.tempoMs = performance.now() - controle.inicio;
    return { acao, estatisticas: controle.estatisticas };
  }

  function escolher(lista, sortear) {
    return lista[Math.floor(sortear() * lista.length)];
  }

  function embaralhar(lista, sortear) {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(sortear() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  // Ambos os métodos Monte Carlo usam exatamente esta simulação.
  function simular(estado, jogador, controle) {
    let atual = estado;
    for (let turno = 0; turno < controle.horizonte; turno++) {
      conferirPrazo(controle);
      const fim = Motor.resultado(atual);
      if (fim) return recompensaFinal(fim, jogador);
      const acao = escolher(Motor.gerarAcoes(atual), controle.sortear);
      atual = Motor.aplicarAcao(atual, acao, false);
    }
    conferirPrazo(controle);
    const fim = Motor.resultado(atual);
    return fim ? recompensaFinal(fim, jogador) : { recompensa: 0.5, truncada: true };
  }

  function recompensaFinal(fim, jogador) {
    return { recompensa: fim.vencedor === 0 ? 0.5 : Number(fim.vencedor === jogador), truncada: false };
  }

  function avaliar(estado, jogador) {
    const fim = Motor.resultado(estado);
    if (fim) return fim.vencedor === 0 ? 0 : (fim.vencedor === jogador ? VITORIA : -VITORIA);
    function caracteristicas(dono) {
      let moinhos = 0;
      let ameacas = 0;
      for (const trinca of Motor.MOINHOS) {
        const pecas = trinca.filter(p => estado.tabuleiro[p] === dono).length;
        const vazias = trinca.filter(p => estado.tabuleiro[p] === 0).length;
        if (pecas === 3) moinhos++;
        if (pecas === 2 && vazias === 1) ameacas++;
      }
      return 10 * (Motor.contarPecas(estado, dono) + estado.reservas[dono]) / 9 +
        3 * moinhos / 16 + 2 * ameacas / 16 + Motor.acoesBasicas(estado, dono).length / 63;
    }
    return caracteristicas(jogador) - caracteristicas(3 - jogador);
  }

  function ordenar(estado, controle) {
    const sucessores = [];
    for (const acao of Motor.gerarAcoes(estado)) {
      conferirPrazo(controle);
      const novo = Motor.aplicarAcao(estado, acao, false);
      sucessores.push({ acao, estado: novo, valor: avaliar(novo, estado.jogador) });
    }
    return sucessores.sort((primeiro, segundo) => segundo.valor - primeiro.valor);
  }

  function* buscar(estado, profundidade, alfa, beta, jogador, controle, no, pai, acao) {
    const { debug } = controle;
    if (debug) yield { etapa: "Visita", no, pai, acao, alfa, beta };
    conferirPrazo(controle);
    controle.estatisticas.nos++;
    if (Motor.resultado(estado) || profundidade === 0) {
      const valor = avaliar(estado, jogador);
      if (debug) yield { etapa: "Avaliação", no, valor };
      return { valor, acao: null };
    }
    const maximizar = estado.jogador === jogador;
    let valor = maximizar ? -Infinity : Infinity;
    let melhor = null;
    let melhorFilho;
    const sucessores = ordenar(estado, controle);
    for (const [indice, sucessor] of sucessores.entries()) {
      const filho = debug ? ++debug.ultimo : undefined;
      const resposta = yield* buscar(sucessor.estado, profundidade - 1, alfa, beta, jogador,
        controle, filho, no, sucessor.acao);
      if (melhor === null || (maximizar ? resposta.valor > valor : resposta.valor < valor)) {
        valor = resposta.valor;
        melhor = sucessor.acao;
        melhorFilho = filho;
      }
      if (maximizar) alfa = Math.max(alfa, valor);
      else beta = Math.min(beta, valor);
      const poda = alfa >= beta;
      if (debug) yield { etapa: poda ? "Poda alfa-beta" : "Retorno", no, valor,
        alfa, beta, melhorFilho, cortados: poda ? sucessores.length - indice - 1 : 0,
        lideres: no === 0 ? [melhor] : undefined };
      if (poda) break;
    }
    return { valor, acao: melhor };
  }

  function* escolherMinimax(estado, opcoes = {}) {
    const controle = preparar(opcoes);
    const debug = opcoes.debug ? { ultimo: 0 } : null;
    controle.debug = debug;
    const acoes = Motor.gerarAcoes(estado);
    if (!acoes.length) return terminar(null, controle);
    let melhor = acoes[0];
    controle.estatisticas.valor = null;
    const primeira = controle.temporizado ? 1 : controle.profundidade;
    try {
      for (let profundidade = primeira; profundidade <= controle.profundidade; profundidade++) {
        const resposta = yield* buscar(estado, profundidade, -Infinity, Infinity, estado.jogador, controle, 0, null, null);
        conferirPrazo(controle);
        // Só substitui a decisão depois de concluir toda a profundidade.
        melhor = resposta.acao;
        controle.estatisticas.valor = resposta.valor;
        controle.estatisticas.profundidade = profundidade;
        controle.estatisticas.iteracoes++;
        if (Math.abs(resposta.valor) === VITORIA) break;
      }
    } catch (erro) {
      if (erro !== PRAZO_ESGOTADO) throw erro;
      controle.estatisticas.interrompido = true;
    }
    return terminar(melhor, controle);
  }

  function* escolherMonteCarlo(estado, opcoes = {}) {
    const controle = preparar(opcoes);
    const debug = opcoes.debug ? { ultimo: 0 } : null;
    controle.debug = debug;
    const acoes = Motor.gerarAcoes(estado);
    if (!acoes.length) return terminar(null, controle);
    const registros = acoes.map((acao, indice) => ({ acao, visitas: 0, soma: 0, id: indice + 1 }));
    if (debug) yield { etapa: "Ações candidatas", no: 0,
      atualizacoes: registros.map(r => ({ no: r.id, pai: 0, acao: r.acao, visitas: 0 })) };
    const limite = controle.temporizado ? Infinity : controle.iteracoes;
    try {
      while (controle.estatisticas.simulacoes < limite) {
        for (const registro of embaralhar(registros, controle.sortear)) {
          if (controle.estatisticas.simulacoes >= limite) break;
          conferirPrazo(controle);
          const novo = Motor.aplicarAcao(estado, registro.acao, false);
          const resposta = simular(novo, estado.jogador, controle);
          conferirPrazo(controle);
          registro.visitas++;
          registro.soma += resposta.recompensa;
          controle.estatisticas.simulacoes++;
          controle.estatisticas.iteracoes++;
          controle.estatisticas.truncadas += Number(resposta.truncada);
          if (debug) yield { etapa: "Simulação", no: registro.id, visitas: registro.visitas,
            valor: mediaDeRecompensa(registro), ...resposta,
            lideres: lideres(registros.filter(r => r.visitas), mediaDeRecompensa),
            cobertura: registros.filter(r => r.visitas).length / registros.length };
        }
      }
    } catch (erro) {
      if (erro !== PRAZO_ESGOTADO) throw erro;
      controle.estatisticas.interrompido = true;
    }
    const cobertura = registros.filter(r => r.visitas > 0).length;
    controle.estatisticas.cobertura = cobertura / acoes.length;
    controle.estatisticas.coberturaInsuficiente = cobertura < acoes.length;
    controle.estatisticas.amostrasPorAcao = registros.map(r => r.visitas);
    // Sem cobertura completa, usa sorteio legal e registra a limitação.
    if (cobertura < acoes.length) return terminar(escolher(acoes, controle.sortear), controle);
    return terminar(escolherMelhor(registros, mediaDeRecompensa, controle.sortear).acao, controle);
  }

  function criarNo(estado, acao = null, profundidade = 0) {
    return { estado, acao, profundidade, visitas: 0, soma: 0,
      pendentes: Motor.gerarAcoes(estado), filhos: [] };
  }

  function mediaDeRecompensa(no) {
    return no.soma / no.visitas;
  }

  function candidatosMelhores(lista, pontuar) {
    let maior = -Infinity;
    let candidatos = [];
    for (const item of lista) {
      const valor = pontuar(item);
      if (valor > maior) {
        maior = valor;
        candidatos = [item];
      } else if (valor === maior) candidatos.push(item);
    }
    return candidatos;
  }

  function escolherMelhor(lista, pontuar, sortear) {
    return escolher(candidatosMelhores(lista, pontuar), sortear);
  }

  function lideres(lista, pontuar) {
    return candidatosMelhores(lista, pontuar).map(item => item.acao);
  }

  function lideresMcts(raiz) {
    const maisVisitados = candidatosMelhores(raiz.filhos, filho => filho.visitas);
    return lideres(maisVisitados, mediaDeRecompensa);
  }

  function selecionar(no, jogador, sortear, exploracao = EXPLORACAO) {
    return escolherMelhor(no.filhos, filho => pontuarUct(no, filho, jogador, exploracao), sortear);
  }

  function pontuarUct(no, filho, jogador, exploracao) {
    const media = mediaDeRecompensa(filho);
    const recompensa = no.estado.jogador === jogador ? media : 1 - media;
    return recompensa + exploracao * Math.sqrt(Math.log(no.visitas) / filho.visitas);
  }

  function* escolherMcts(estado, opcoes = {}) {
    const controle = preparar(opcoes);
    const debug = opcoes.debug ? { ultimo: 0 } : null;
    controle.debug = debug;
    const raiz = criarNo(estado);
    raiz.id = 0;
    controle.estatisticas.nos = 1;
    if (!raiz.pendentes.length) return terminar(null, controle);
    const acoes = raiz.pendentes.slice();
    const limite = controle.temporizado ? Infinity : controle.iteracoes;
    try {
      while (controle.estatisticas.iteracoes < limite) {
        conferirPrazo(controle);
        // 1. Seleção: descer até um nó com ação ainda não explorada.
        let no = raiz;
        const caminho = [no];
        while (!no.pendentes.length && no.filhos.length) {
          conferirPrazo(controle);
          const paiSelecao = no;
          no = selecionar(no, estado.jogador, controle.sortear, controle.exploracao);
          if (debug) yield { etapa: "Seleção UCT", no: no.id,
            uct: pontuarUct(paiSelecao, no, estado.jogador, controle.exploracao) };
          caminho.push(no);
        }
        // 2. Expansão: preparar um filho para uma ação ainda não explorada.
        let pai = null;
        let indice = -1;
        if (no.pendentes.length) {
          pai = no;
          indice = Math.floor(controle.sortear() * pai.pendentes.length);
          const acao = pai.pendentes[indice];
          no = criarNo(Motor.aplicarAcao(pai.estado, acao, false), acao, pai.profundidade + 1);
          caminho.push(no);
          if (debug) {
            no.id = ++debug.ultimo;
            yield { etapa: "Expansão", no: no.id, pai: pai.id, acao, visitas: 0 };
          }
        }
        // 3. Simulação: jogar ao acaso a partir do nó alcançado.
        const resposta = simular(no.estado, estado.jogador, controle);
        conferirPrazo(controle);
        if (debug) yield { etapa: "Simulação", no: no.id, ...resposta };
        // 4. Retropropagação: confirmar o filho e atualizar o caminho após a simulação.
        if (pai) {
          pai.pendentes.splice(indice, 1);
          pai.filhos.push(no);
          controle.estatisticas.nos++;
        }
        for (const ancestral of caminho) {
          ancestral.visitas++;
          ancestral.soma += resposta.recompensa;
        }
        controle.estatisticas.iteracoes++;
        controle.estatisticas.simulacoes++;
        controle.estatisticas.truncadas += Number(resposta.truncada);
        controle.estatisticas.profundidade = Math.max(controle.estatisticas.profundidade, no.profundidade);
        if (debug) yield { etapa: "Retropropagação", no: no.id, lideres: lideresMcts(raiz),
          atualizacoes: caminho.map(item => ({ no: item.id, visitas: item.visitas, valor: mediaDeRecompensa(item) })) };
      }
    } catch (erro) {
      if (erro !== PRAZO_ESGOTADO) throw erro;
      controle.estatisticas.interrompido = true;
    }
    if (!raiz.filhos.length) return terminar(escolher(acoes, controle.sortear), controle);
    const visitas = Math.max(...raiz.filhos.map(f => f.visitas));
    const candidatos = raiz.filhos.filter(f => f.visitas === visitas);
    return terminar(escolherMelhor(candidatos, mediaDeRecompensa, controle.sortear).acao, controle);
  }

  function escolherAleatorio(estado, opcoes = {}) {
    const controle = preparar(opcoes);
    const acoes = Motor.gerarAcoes(estado);
    return terminar(acoes.length ? escolher(acoes, controle.sortear) : null, controle);
  }

  const buscas = { mcts: escolherMcts, minimax: escolherMinimax, monteCarlo: escolherMonteCarlo };

  function agente(busca) {
    return Object.freeze({ escolherAcao(estado, opcoes) {
      const passos = busca(estado, opcoes);
      let passo = passos.next();
      while (!passo.done) passo = passos.next();
      return passo.value;
    } });
  }

  function depurar(nome, estado, opcoes) {
    return buscas[nome](estado, { ...opcoes, limiteMs: undefined, debug: true });
  }

  return Object.freeze({ avaliar, selecionar, depurar,
    mcts: agente(escolherMcts), minimax: agente(escolherMinimax), monteCarlo: agente(escolherMonteCarlo),
    aleatorio: Object.freeze({ escolherAcao: escolherAleatorio }) });
})();
