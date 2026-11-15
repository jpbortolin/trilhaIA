"use strict";

const Jogo = (() => {
  const HUMANO = 1;
  const IA = 2;
  const SEMENTE = 2026;
  const ESPACO_SVG = "http://www.w3.org/2000/svg";
  const NOMES = { mcts: "MCTS / UCT", minimax: "Minimax com alfa-beta", monteCarlo: "Monte Carlo plano" };
  const COORDENADAS = [64, 152, 240].flatMap(margem => [
    [margem, margem], [320, margem], [640 - margem, margem], [640 - margem, 320],
    [640 - margem, 640 - margem], [320, 640 - margem], [margem, 640 - margem], [margem, 320]
  ]);
  const elemento = identificador => document.getElementById(identificador);
  const tabuleiro = elemento("tabuleiro");
  const pontos = [];
  let estado;
  let acoes = [];
  let origem = null;
  let pendentes = [];
  let ocupado = false;
  let falhou = false;
  let versao = 0;
  let configuracao;
  let sortear;
  let estatisticas = null;

  function criarSvg(nome, atributos) {
    const criado = document.createElementNS(ESPACO_SVG, nome);
    for (const [chave, valor] of Object.entries(atributos)) criado.setAttribute(chave, valor);
    return criado;
  }

  function montarTabuleiro() {
    // As linhas vêm do motor; a interface define apenas as coordenadas visuais.
    Motor.ADJACENCIAS.forEach((vizinhos, posicao) => {
      for (const vizinho of vizinhos) {
        if (vizinho < posicao) continue;
        tabuleiro.appendChild(criarSvg("line", {
          x1: COORDENADAS[posicao][0], y1: COORDENADAS[posicao][1],
          x2: COORDENADAS[vizinho][0], y2: COORDENADAS[vizinho][1], class: "linha-tabuleiro"
        }));
      }
    });
    COORDENADAS.forEach(([x, y], posicao) => {
      const ponto = criarSvg("g", { id: "ponto-" + posicao, transform: "translate(" + x + " " + y + ")",
        role: "button", tabindex: "0", class: "ponto" });
      ponto.appendChild(criarSvg("circle", { r: 32, class: "area-clique" }));
      ponto.appendChild(criarSvg("circle", { r: 26, class: "realce" }));
      ponto.appendChild(criarSvg("circle", { r: 17, class: "peca" }));
      ponto.addEventListener("click", () => clicar(posicao));
      ponto.addEventListener("keydown", evento => {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          clicar(posicao);
        }
      });
      pontos.push(ponto);
      tabuleiro.appendChild(ponto);
    });
  }

  function ocupacaoVisivel() {
    const ocupacao = estado.tabuleiro.slice();
    // A prévia não altera o motor: o turno só é aplicado após escolher a captura.
    if (pendentes.length) {
      const acao = pendentes[0];
      if (acao.origem !== null) ocupacao[acao.origem] = 0;
      ocupacao[acao.destino] = HUMANO;
    }
    return ocupacao;
  }

  function desenhar() {
    const fim = Motor.resultado(estado);
    const suaVez = !fim && !ocupado && !falhou && estado.jogador === HUMANO;
    const ocupacao = ocupacaoVisivel();
    const fase = Motor.fase(estado);
    const destinos = new Set(suaVez && !pendentes.length
      ? acoes.filter(acao => acao.origem === origem).map(acao => acao.destino) : []);
    const removiveis = new Set(pendentes.map(acao => acao.remocao));
    pontos.forEach((ponto, posicao) => {
      const propria = suaVez && !pendentes.length && acoes.some(acao => acao.origem === posicao);
      const permitido = suaVez && (propria || destinos.has(posicao) || removiveis.has(posicao));
      const classes = ["ponto", ocupacao[posicao] === HUMANO ? "humano" : ocupacao[posicao] === IA ? "ia" : "vazio"];
      if (posicao === origem && !pendentes.length) classes.push("selecionado");
      if (destinos.has(posicao)) classes.push("destino-possivel");
      if (removiveis.has(posicao)) classes.push("removivel");
      if (permitido) classes.push("permitido");
      ponto.setAttribute("class", classes.join(" "));
      ponto.setAttribute("aria-disabled", String(!permitido));
      ponto.setAttribute("aria-pressed", String(posicao === origem && !pendentes.length));
      const descricao = ocupacao[posicao] === HUMANO ? "sua peça" : ocupacao[posicao] === IA ? "peça da IA" : "vazio";
      const acao = removiveis.has(posicao) ? ", remover" : destinos.has(posicao) ? ", destino possível" : propria ? ", selecionar" : "";
      ponto.setAttribute("aria-label", "Ponto " + (posicao + 1) + ": " + descricao + acao);
    });
    tabuleiro.setAttribute("aria-busy", String(ocupado));
    elemento("numero-turno").textContent = fim ? estado.turnos + " turnos concluídos" : "Turno " + (estado.turnos + 1);
    elemento("fase").textContent = "Fase de " + fase + (pendentes.length ? " · escolha a remoção" : "");
    elemento("pecas-humano").textContent = ocupacao.filter(peca => peca === HUMANO).length;
    elemento("pecas-ia").textContent = ocupacao.filter(peca => peca === IA).length;
    elemento("reserva-humano").textContent = estado.reservas[HUMANO] - Number(pendentes.length > 0 && pendentes[0].origem === null);
    elemento("reserva-ia").textContent = estado.reservas[IA];
    elemento("jogador-humano").classList.toggle("ativo", !fim && estado.jogador === HUMANO);
    elemento("jogador-ia").classList.toggle("ativo", !fim && estado.jogador === IA);
    elemento("cancelar").disabled = !suaVez || (origem === null && !pendentes.length);
    elemento("nome-agente").textContent = NOMES[configuracao.algoritmo];
    elemento("orcamento").textContent = "Orçamento: " + configuracao.limiteMs + " ms por jogada";
    elemento("estatistica-tempo").textContent = estatisticas ? estatisticas.tempoMs.toFixed(1).replace(".", ",") + " ms" : "—";
    for (const nome of ["simulacoes", "nos", "profundidade"]) {
      elemento("estatistica-" + nome).textContent = estatisticas ? estatisticas[nome].toLocaleString("pt-BR") : "—";
    }
    elemento("aviso-agente").textContent = !estatisticas ? "As estatísticas aparecem após a primeira jogada da IA." :
      estatisticas.coberturaInsuficiente ? "O tempo não permitiu avaliar todas as ações. A IA usou uma jogada aleatória legal." :
      "Nós e profundidade têm significados diferentes em cada algoritmo.";
    let mensagem;
    if (falhou) {
      elemento("vez").textContent = "Partida interrompida";
      mensagem = "Não foi possível concluir a jogada da IA. Inicie um novo jogo.";
    } else if (fim) {
      elemento("vez").textContent = fim.vencedor === 0 ? "Empate" : fim.vencedor === HUMANO ? "Você venceu!" : "A IA venceu";
      mensagem = elemento("vez").textContent + " — " + fim.motivo + ". Inicie um novo jogo para jogar novamente.";
    } else if (ocupado) {
      elemento("vez").textContent = "Vez da IA";
      mensagem = "IA pensando...";
    } else {
      elemento("vez").textContent = pendentes.length ? "Você formou um moinho!" : "Sua vez";
      mensagem = pendentes.length ? "Escolha uma peça da IA destacada em vermelho para remover." :
        fase === "colocação" ? "Coloque uma peça em um ponto destacado." :
        origem === null ? "Selecione uma das suas peças para mover." :
        fase === "voo" ? "Você pode voar: escolha qualquer ponto vazio destacado." :
        "Escolha um ponto vizinho destacado para mover sua peça.";
    }
    elemento("mensagem").textContent = mensagem;
  }

  function clicar(posicao) {
    if (ocupado || falhou || Motor.resultado(estado) || estado.jogador !== HUMANO) return;
    if (pendentes.length) {
      const acao = pendentes.find(candidata => candidata.remocao === posicao);
      if (acao) concluir(acao);
      return;
    }
    if (estado.tabuleiro[posicao] === HUMANO && Motor.fase(estado) !== "colocação") {
      if (acoes.some(acao => acao.origem === posicao)) origem = origem === posicao ? null : posicao;
      desenhar();
      return;
    }
    const candidatas = acoes.filter(acao => acao.origem === origem && acao.destino === posicao);
    if (!candidatas.length) return;
    if (candidatas[0].remocao !== null) {
      pendentes = candidatas;
      desenhar();
    } else concluir(candidatas[0]);
  }

  function concluir(acao) {
    estado = Motor.aplicarAcao(estado, acao);
    origem = null;
    pendentes = [];
    atualizarVez();
  }

  function atualizarVez() {
    acoes = Motor.gerarAcoes(estado);
    ocupado = acoes.length > 0 && estado.jogador === IA;
    desenhar();
    if (ocupado) pensar(versao);
  }

  async function pensar(versaoDaPartida) {
    // Permite que o navegador mostre "IA pensando..." antes da busca síncrona.
    await new Promise(concluirEspera => setTimeout(concluirEspera, 60));
    if (versaoDaPartida !== versao) return;
    try {
      const resposta = Agentes[configuracao.algoritmo].escolherAcao(estado,
        { limiteMs: configuracao.limiteMs, rng: sortear });
      if (versaoDaPartida !== versao) return;
      estado = Motor.aplicarAcao(estado, resposta.acao);
      estatisticas = resposta.estatisticas;
      atualizarVez();
    } catch (erro) {
      ocupado = false;
      falhou = true;
      console.error("Erro ao executar a IA:", erro);
      desenhar();
    }
  }

  function cancelarEscolha() {
    if (ocupado || falhou || Motor.resultado(estado)) return;
    origem = null;
    pendentes = [];
    desenhar();
  }

  function novoJogo() {
    // Invalida uma resposta agendada para a partida anterior.
    versao++;
    configuracao = { algoritmo: elemento("algoritmo").value, limiteMs: Number(elemento("tempo").value) };
    estado = Motor.criarEstado(undefined, undefined, Number(elemento("comeca").value));
    sortear = Motor.criarGerador(SEMENTE);
    origem = null;
    pendentes = [];
    estatisticas = null;
    falhou = false;
    atualizarVez();
  }

  elemento("configuracao").addEventListener("submit", evento => { evento.preventDefault(); novoJogo(); });
  elemento("cancelar").addEventListener("click", cancelarEscolha);
  document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") cancelarEscolha();
  });
  montarTabuleiro();
  novoJogo();
  return Object.freeze({ novoJogo });
})();
