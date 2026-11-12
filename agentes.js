"use strict";

const Agentes = (() => {
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

  function buscar(estado, profundidade, alfa, beta, jogador, controle) {
    conferirPrazo(controle);
    controle.estatisticas.nos++;
    if (Motor.resultado(estado) || profundidade === 0) {
      return { valor: avaliar(estado, jogador), acao: null };
    }
    const maximizar = estado.jogador === jogador;
    let valor = maximizar ? -Infinity : Infinity;
    let melhor = null;
    for (const sucessor of ordenar(estado, controle)) {
      const resposta = buscar(sucessor.estado, profundidade - 1, alfa, beta, jogador, controle);
      if (melhor === null || (maximizar ? resposta.valor > valor : resposta.valor < valor)) {
        valor = resposta.valor;
        melhor = sucessor.acao;
      }
      if (maximizar) alfa = Math.max(alfa, valor);
      else beta = Math.min(beta, valor);
      if (alfa >= beta) break;
    }
    return { valor, acao: melhor };
  }

  function escolherMinimax(estado, opcoes = {}) {
    const controle = preparar(opcoes);
    const acoes = Motor.gerarAcoes(estado);
    if (!acoes.length) return terminar(null, controle);
    let melhor = acoes[0];
    controle.estatisticas.valor = null;
    const primeira = controle.temporizado ? 1 : controle.profundidade;
    try {
      for (let profundidade = primeira; profundidade <= controle.profundidade; profundidade++) {
        const resposta = buscar(estado, profundidade, -Infinity, Infinity, estado.jogador, controle);
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

  function escolherMonteCarlo(estado, opcoes = {}) {
    const controle = preparar(opcoes);
    const acoes = Motor.gerarAcoes(estado);
    if (!acoes.length) return terminar(null, controle);
    const registros = acoes.map(acao => ({ acao, visitas: 0, soma: 0 }));
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

  function escolherMelhor(lista, pontuar, sortear) {
    let maior = -Infinity;
    let candidatos = [];
    for (const item of lista) {
      const valor = pontuar(item);
      if (valor > maior) {
        maior = valor;
        candidatos = [item];
      } else if (valor === maior) candidatos.push(item);
    }
    return escolher(candidatos, sortear);
  }

  function selecionar(no, jogador, sortear, exploracao = EXPLORACAO) {
    // No turno adversário, uma recompensa alta para a raiz é ruim para ele.
    return escolherMelhor(no.filhos, filho => {
      const media = mediaDeRecompensa(filho);
      const recompensa = no.estado.jogador === jogador ? media : 1 - media;
      return recompensa + exploracao * Math.sqrt(Math.log(no.visitas) / filho.visitas);
    }, sortear);
  }

  function escolherMcts(estado, opcoes = {}) {
    const controle = preparar(opcoes);
    const raiz = criarNo(estado);
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
          no = selecionar(no, estado.jogador, controle.sortear, controle.exploracao);
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
        }
        // 3. Simulação: jogar ao acaso a partir do nó alcançado.
        const resposta = simular(no.estado, estado.jogador, controle);
        conferirPrazo(controle);
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

  return Object.freeze({ avaliar, selecionar,
    mcts: Object.freeze({ escolherAcao: escolherMcts }),
    minimax: Object.freeze({ escolherAcao: escolherMinimax }),
    monteCarlo: Object.freeze({ escolherAcao: escolherMonteCarlo }),
    aleatorio: Object.freeze({ escolherAcao: escolherAleatorio }) });
})();
