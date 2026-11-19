"use strict";

(() => {
  const obter = id => document.getElementById("debug-" + id);
  const turno = obter("turno");
  const historico = obter("historico");
  const partidas = [];
  const arvore = obter("arvore");
  const tabuleiro = obter("tabuleiro");
  const resumo = obter("resumo");
  const tooltip = obter("tooltip");
  const expandirTudo = obter("expandir-tudo");
  let cursorArvore = null;

  function atualizarTooltip() {
    const botao = cursorArvore
      ? document.elementFromPoint(cursorArvore.x, cursorArvore.y)?.closest("[data-no]")
      : document.activeElement?.closest("[data-no]");
    tooltip.hidden = !botao || !arvore.contains(botao) || !!arraste?.movendo;
    if (tooltip.hidden) return;
    tooltip.textContent = botao.getAttribute("aria-label");
    const limites = botao.getBoundingClientRect();
    const x = cursorArvore?.x ?? limites.left;
    const y = cursorArvore?.y ?? limites.bottom;
    tooltip.style.left = Math.max(8, Math.min(x + 12, window.innerWidth - tooltip.offsetWidth - 8)) + "px";
    tooltip.style.top = (y + tooltip.offsetHeight + 20 <= window.innerHeight
      ? y + 12 : Math.max(8, y - tooltip.offsetHeight - 12)) + "px";
  }
  const pontos = [55, 145, 235].flatMap(m => [
    [m, m], [320, m], [640 - m, m], [640 - m, 320],
    [640 - m, 640 - m], [320, 640 - m], [m, 640 - m], [m, 320]
  ]);
  const quantidadePorQuadro = 12;
  let partida;
  let selecionado = 0;
  let seguir = true;
  let automatico = false;
  let quadro = null;
  let ateJogada = false;
  let seguirCamera = true;
  let zoom = 1;
  let arraste = null;
  let suprimirClique = false;

  const zoomMinimo = 0.25;
  const zoomMaximo = 2;

  function atualizarZoom() {
    const area = arvore.firstElementChild;
    obter("zoom").textContent = Math.round(zoom * 100) + "%";
    obter("menos").disabled = !area || zoom <= zoomMinimo;
    obter("mais").disabled = !area || zoom >= zoomMaximo;
    obter("repor").disabled = !area;
    if (!area) return;
    const quadro = area.firstElementChild;
    area.style.width = parseInt(quadro.style.width, 10) * zoom + "px";
    area.style.height = parseInt(quadro.style.height, 10) * zoom + "px";
    quadro.style.transform = "scale(" + zoom + ")";
  }

  function ajustarZoom(novo, x, y) {
    const area = arvore.firstElementChild;
    if (!area) return;
    const escala = Math.min(zoomMaximo, Math.max(zoomMinimo, novo));
    if (escala === zoom) return;
    const limites = arvore.getBoundingClientRect();
    const ancoraX = x ?? limites.left + arvore.clientLeft + arvore.clientWidth / 2;
    const ancoraY = y ?? limites.top + arvore.clientTop + arvore.clientHeight / 2;
    const antes = area.getBoundingClientRect();
    const localX = (ancoraX - antes.left) / zoom;
    const localY = (ancoraY - antes.top) / zoom;
    zoom = escala;
    seguirCamera = false;
    obter("vivo").disabled = false;
    atualizarZoom();
    const depois = area.getBoundingClientRect();
    arvore.scrollLeft += depois.left + localX * zoom - ancoraX;
    arvore.scrollTop += depois.top + localY * zoom - ancoraY;
  }

  function restaurarVisao() {
    zoom = 1;
    seguirCamera = true;
    arvore.scrollLeft = 0;
    arvore.scrollTop = 0;
    desenhar();
  }

  for (const nome of Protocolo.ALGORITMOS) {
    obter("j1").add(new Option(Relatorio.NOMES[nome], nome));
    obter("j2").add(new Option(Relatorio.NOMES[nome], nome));
  }
  obter("j2").value = "minimax";

  function descrever(acao) {
    if (!acao) return "Raiz";
    const movimento = acao.origem === null ? "Colocar em " + (acao.destino + 1)
      : (acao.origem + 1) + " → " + (acao.destino + 1);
    return movimento + (acao.remocao === null ? "" : " · retirar " + (acao.remocao + 1));
  }

  function svg(nome, atributos, conteudo) {
    const elemento = document.createElementNS("http://www.w3.org/2000/svg", nome);
    for (const [chave, valor] of Object.entries(atributos)) elemento.setAttribute(chave, valor);
    if (conteudo !== undefined) elemento.textContent = conteudo;
    tabuleiro.append(elemento);
    return elemento;
  }

  Motor.ADJACENCIAS.forEach((vizinhos, i) => {
    const [x1, y1] = pontos[i];
    for (const vizinho of vizinhos) {
      if (vizinho <= i) continue;
      const [x2, y2] = pontos[vizinho];
      svg("line", { x1, y1, x2, y2, class: "linha-tabuleiro" });
    }
  });
  const casas = pontos.map(([x, y], i) => {
    const circulo = svg("circle", { cx: x, cy: y, r: 24 });
    const numero = svg("text", { x, y, "text-anchor": "middle", "dominant-baseline": "central" }, i + 1);
    return { circulo, numero };
  });

  function novaBusca() {
    const estado = partida.estado;
    const jogador = estado.jogador;
    const agente = partida.agentes[jogador];
    const busca = AgentesJavaScript.depurar(agente, estado,
      { ...partida.opcoes, rng: partida.geradores[jogador] });
    const registro = { estado, jogador, agente, passos: 0, lideres: [],
      nos: new Map([[0, { no: 0, pai: null, filhos: [] }]]), abertos: new Set([0]) };
    partida.busca = busca;
    partida.turnos.push(registro);
    adicionarTurno(registro, partida.turnos.length - 1);
    if (seguir) {
      if (seguirCamera) arvore.scrollTop = 0;
      turno.value = partida.turnos.length - 1;
      selecionado = 0;
    }
  }

  function adicionarTurno(registro, indice) {
    turno.add(new Option("Turno " + (registro.estado.turnos + 1) + " · J" + registro.jogador +
      " · " + Relatorio.NOMES[registro.agente], indice));
  }

  function atualizarNo(registro, dados) {
    const { no, pai, acao, valor, visitas, alfa, beta } = dados;
    let item = registro.nos.get(no);
    if (!item) {
      item = { no, pai, acao, filhos: [] };
      registro.nos.set(no, item);
      registro.nos.get(pai).filhos.push(no);
    }
    if (valor !== undefined) item.valor = valor;
    if (visitas !== undefined) item.visitas = visitas;
    if (alfa !== undefined) Object.assign(item, { alfa, beta });
    if (dados.melhorFilho !== undefined) item.melhorFilho = dados.melhorFilho;
    if (dados.etapa === "Poda alfa-beta") item.cortados = dados.cortados;
  }

  function avancar() {
    const registro = partida.turnos.at(-1);
    const passo = partida.busca.next();
    if (!passo.done) {
      const evento = passo.value;
      atualizarNo(registro, evento);
      for (const dados of evento.atualizacoes ?? []) atualizarNo(registro, dados);
      if (evento.lideres) registro.lideres = evento.lideres;
      registro.evento = evento;
      registro.passos++;
      return;
    }
    registro.resposta = passo.value;
  }

  function aplicarJogada() {
    const registro = partida.turnos.at(-1);
    partida.estado = Motor.aplicarAcao(partida.estado, registro.resposta.acao);
    partida.fim = Motor.resultado(partida.estado);
    if (partida.fim) turno.add(new Option("Posição final", "final"));
    else novaBusca();
  }

  function passoDaPartida() {
    if (partida.turnos.at(-1).resposta) aplicarJogada();
    else avancar();
  }

  const formatar = valor => Number.isFinite(valor) ? valor.toFixed(3).replace(".", ",")
    : valor === Infinity ? "+∞" : "−∞";

  function descreverNo(item) {
    const dados = [];
    if (item.visitas !== undefined) dados.push(item.visitas + " visitas");
    if (item.valor !== undefined) dados.push("valor " + formatar(item.valor));
    if (item.alfa !== undefined) dados.push("α " + formatar(item.alfa) + " / β " + formatar(item.beta));
    if (item.cortados) dados.push(item.cortados + " ramos cortados");
    return descrever(item.acao) + (dados.length ? " · " + dados.join(" · ") : "");
  }

  function caminhoPreferido(registro) {
    const caminho = [0];
    const { nos, agente, resposta, lideres } = registro;
    const acao = resposta?.acao ?? lideres[0];
    if (!acao) return caminho;
    const primeiro = nos.get(0).filhos.find(id => {
      const atual = nos.get(id).acao;
      return atual.origem === acao.origem && atual.destino === acao.destino && atual.remocao === acao.remocao;
    });
    let id = primeiro;
    while (id !== undefined) {
      caminho.push(id);
      const no = nos.get(id);
      if (agente === "minimax") {
        id = no.melhorFilho;
        continue;
      }
      if (agente !== "mcts") break;
      const adversario = caminho.length % 2 === 0;
      let melhor;
      for (const filho of no.filhos.map(indice => nos.get(indice))) {
        if (!filho.visitas) continue;
        if (!melhor || filho.visitas > melhor.visitas ||
            (filho.visitas === melhor.visitas &&
              (adversario ? filho.valor < melhor.valor : filho.valor > melhor.valor))) melhor = filho;
      }
      id = melhor?.no;
    }
    return caminho;
  }

  function desenharArvore(registro, ativo, caminho) {
    const proximos = caminho ? new Map(caminho.slice(1).map((filho, i) => [caminho[i], filho])) : null;
    const foco = document.activeElement;
    const chaveFoco = arvore.contains(foco) ? foco.dataset.controle : undefined;
    const botoes = new Map();
    const larguraNo = 80;
    const alturaNo = 30;
    const passoX = 92;
    const passoY = 58;
    const margem = 14;
    const posicoes = new Map();
    const ordem = [];
    const pilha = [{ id: 0, nivel: 0 }];
    let folhas = 0;
    let profundidade = 0;
    while (pilha.length) {
      const { id, nivel, fechar } = pilha.pop();
      const item = registro.nos.get(id);
      const filhos = proximos
        ? (proximos.has(id) ? [proximos.get(id)] : [])
        : (registro.abertos.has(id) ? item.filhos : []);
      if (!fechar && filhos.length) {
        pilha.push({ id, nivel, fechar: true });
        for (let i = filhos.length - 1; i >= 0; i--) pilha.push({ id: filhos[i], nivel: nivel + 1 });
        continue;
      }
      const centro = filhos.length
        ? (posicoes.get(filhos[0]).x + posicoes.get(filhos.at(-1)).x) / 2
        : margem + larguraNo / 2 + folhas++ * passoX;
      posicoes.set(id, { x: centro, y: margem + nivel * passoY });
      ordem.push(id);
      profundidade = Math.max(profundidade, nivel);
    }

    const quadro = document.createElement("div");
    quadro.className = "debug-diagrama";
    quadro.style.width = 2 * margem + larguraNo + (folhas - 1) * passoX + "px";
    quadro.style.height = 2 * margem + alturaNo + profundidade * passoY + "px";
    const linhas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    linhas.setAttribute("aria-hidden", "true");
    linhas.classList.add("debug-conexoes");
    const conexoes = [];
    for (const id of ordem.reverse()) {
      const item = registro.nos.get(id);
      const { x, y } = posicoes.get(id);
      if (item.pai !== null) {
        const pai = posicoes.get(item.pai);
        const meio = (pai.y + alturaNo + y) / 2;
        conexoes.push("M " + pai.x + " " + (pai.y + alturaNo) +
          " V " + meio + " H " + x + " V " + y);
      }
      const caixa = document.createElement("div");
      caixa.className = "debug-ramo";
      caixa.style.left = x - larguraNo / 2 + "px";
      caixa.style.top = y + "px";
      caixa.style.width = larguraNo + "px";
      caixa.style.height = alturaNo + "px";
      caixa.classList.toggle("debug-ativo", id === registro.evento?.no);
      const inspecionar = document.createElement("button");
      inspecionar.type = "button";
      inspecionar.className = "debug-inspecionar";
      inspecionar.dataset.no = id;
      inspecionar.dataset.controle = "n" + id;
      inspecionar.setAttribute("aria-pressed", id === ativo);
      const detalhes = ["Nó " + id, descreverNo(item)];
      if (id === 0) detalhes.push(obter("lider").textContent);
      if (id === registro.evento?.no) detalhes.push(obter("etapa").textContent);
      inspecionar.setAttribute("aria-label", detalhes.join(" · "));
      const acao = item.acao;
      inspecionar.textContent = !acao ? "Raiz" : acao.origem === null ? "→ " + (acao.destino + 1)
        : (acao.origem + 1) + "→" + (acao.destino + 1);
      caixa.append(inspecionar);
      botoes.set(inspecionar.dataset.controle, inspecionar);

      if (!caminho && item.filhos.length) {
        const aberto = registro.abertos.has(id);
        const alternar = document.createElement("button");
        alternar.type = "button";
        alternar.className = "debug-expandir";
        alternar.textContent = aberto ? "▴" : "▾";
        alternar.setAttribute("aria-label", (aberto ? "Recolher" : "Expandir") +
          " os " + item.filhos.length + " filhos do nó " + id);
        alternar.title = alternar.getAttribute("aria-label");
        alternar.setAttribute("aria-expanded", aberto);
        alternar.dataset.ramo = id;
        alternar.dataset.controle = "r" + id;
        botoes.set(alternar.dataset.controle, alternar);
        caixa.append(alternar);
      }
      quadro.append(caixa);
    }
    const tracado = document.createElementNS("http://www.w3.org/2000/svg", "path");
    tracado.setAttribute("d", conexoes.join(" "));
    linhas.append(tracado);
    quadro.prepend(linhas);
    const rolagemX = arvore.scrollLeft;
    const rolagemY = arvore.scrollTop;
    const area = document.createElement("div");
    area.className = "debug-area-diagrama";
    area.append(quadro);
    arvore.replaceChildren(area);
    atualizarZoom();
    arvore.scrollLeft = rolagemX;
    arvore.scrollTop = rolagemY;
    botoes.get(chaveFoco)?.focus({ preventScroll: true });
    if (seguirCamera && !arraste && !chaveFoco && posicoes.has(ativo)) {
      const { x, y } = posicoes.get(ativo);
      arvore.scrollLeft = area.offsetLeft + x * zoom - arvore.clientWidth / 2;
      const topo = y * zoom;
      const base = (y + alturaNo) * zoom;
      if (topo < rolagemY) arvore.scrollTop = topo - margem;
      else if (base > rolagemY + arvore.clientHeight) arvore.scrollTop = base + margem - arvore.clientHeight;
    }
    atualizarTooltip();
  }

  function desenharTabuleiro(estado, item) {
    casas.forEach(({ circulo, numero }, posicao) => {
      const dono = estado.tabuleiro[posicao];
      circulo.setAttribute("class", "debug-casa debug-dono-" + dono);
      if (item?.acao?.destino === posicao) circulo.classList.add("debug-destino");
      if (item?.acao?.remocao === posicao) circulo.classList.add("debug-remocao");
      numero.classList.toggle("debug-numero-claro", dono !== 0);
    });
    const ocupadas = [...estado.tabuleiro].flatMap((dono, i) => dono ? [(i + 1) + " J" + dono] : []);
    tabuleiro.setAttribute("aria-label", "Tabuleiro numerado de 1 a 24. " +
      (ocupadas.length ? "Casas ocupadas: " + ocupadas.join(", ") : "Tabuleiro vazio."));
  }

  function desenhar() {
    const atual = partida.turnos.at(-1);
    const registro = partida.turnos[Number(turno.value)];
    obter("passo").disabled = !!partida.fim || automatico || ateJogada;
    obter("jogada").disabled = !!partida.fim || automatico || ateJogada;
    obter("auto").disabled = !!partida.fim;
    obter("auto").textContent = automatico || ateJogada ? "Pausar debug" : "Executar automaticamente";
    obter("passo").textContent = atual.resposta ? "Aplicar jogada" : "Próximo passo";
    obter("vivo").disabled = seguir && seguirCamera;
    const situacao = partida.fim
      ? (partida.fim.vencedor ? "Jogador " + partida.fim.vencedor + " venceu" : "Empate") + " · " + partida.fim.motivo
      : "Partida no turno " + (atual.estado.turnos + 1) + " · Jogador " + atual.jogador +
        (atual.resposta ? " · jogada pronta" : " · busca em andamento");
    if (obter("status").textContent !== situacao) obter("status").textContent = situacao;
    expandirTudo.disabled = !registro || !registro.nos.get(0).filhos.length;
    if (!registro) {
      desenharTabuleiro(partida.estado);
      obter("lider").textContent = "";
      obter("etapa").textContent = "";
      obter("linha").textContent = "";
      arvore.replaceChildren();
      atualizarZoom();
      atualizarTooltip();
      return;
    }
    const linha = resumo.checked ? caminhoPreferido(registro) : null;
    const candidato = seguir ? (registro.evento?.no ?? 0) : selecionado;
    const ativo = linha && (seguir || !linha.includes(candidato)) ? linha.at(-1) : candidato;
    obter("linha").textContent = linha
      ? registro.resposta
        ? "Linha final" + (registro.agente === "mcts" ? " · continua pelos nós mais visitados" : "")
        : "Linha provisória · atualizada a cada avaliação"
      : "Árvore completa · use as setas para abrir ou recolher ramos";
    const item = registro.nos.get(ativo);
    const caminho = [];
    for (let ancestral = item; ancestral.pai !== null; ancestral = registro.nos.get(ancestral.pai)) {
      caminho.push(ancestral);
      if (seguir) registro.abertos.add(ancestral.pai);
    }
    let estado = registro.estado;
    for (const ancestral of caminho.reverse()) estado = Motor.aplicarAcao(estado, ancestral.acao, false);
    desenharTabuleiro(estado, item);
    const { resposta, lideres, evento } = registro;
    obter("lider").textContent = resposta
      ? "Jogada escolhida · " + descrever(resposta.acao) +
        (resposta.estatisticas.coberturaInsuficiente ? " · sorteio por cobertura incompleta" : "")
      : lideres.length ? "Melhor até agora · " + lideres.slice(0, 3).map(descrever).join(" / ") +
        (lideres.length > 3 ? " · +" + (lideres.length - 3) + " empatadas" : "")
        : "Aguardando a primeira avaliação";
    obter("etapa").textContent = "Passo " + registro.passos +
      (evento ? " · " + evento.etapa : "") +
      (evento?.uct !== undefined ? " · UCT " + formatar(evento.uct) : "") +
      (evento?.recompensa !== undefined ? " · recompensa " + formatar(evento.recompensa) +
        (evento.truncada ? " (horizonte atingido)" : "") : "") +
      (evento?.cobertura !== undefined ? " · cobertura " + Math.round(evento.cobertura * 100) + "%" : "");
    desenharArvore(registro, ativo, linha);
  }

  function parar() {
    automatico = ateJogada = false;
    if (quadro !== null) cancelAnimationFrame(quadro);
    quadro = null;
  }

  function seguirAoVivo() {
    seguir = true;
    turno.value = partida.turnos.length - 1;
  }

  function ciclo() {
    quadro = null;
    const registro = partida.turnos.at(-1);
    for (let i = 0; i < quantidadePorQuadro && !partida.fim; i++) {
      passoDaPartida();
      if (ateJogada && registro !== partida.turnos.at(-1)) break;
    }
    if (partida.fim || (ateJogada && registro !== partida.turnos.at(-1))) parar();
    desenhar();
    if (automatico || ateJogada) quadro = requestAnimationFrame(ciclo);
  }

  obter("config").addEventListener("submit", evento => {
    evento.preventDefault();
    parar();
    const semente = Protocolo.SEMENTE_BASE;
    const estado = Torneio.estadoInicial(obter("posicao").value, semente);
    partida = { estado, agentes: [null, obter("j1").value, obter("j2").value],
      geradores: [null, Motor.criarGerador(semente), Motor.criarGerador(semente + 1)],
      opcoes: { iteracoes: obter("iteracoes").valueAsNumber, profundidade: obter("profundidade").valueAsNumber },
      turnos: [] };
    partidas.push(partida);
    historico.add(new Option("Partida " + partidas.length + " · " +
      partida.agentes.slice(1).map(nome => Relatorio.NOMES[nome]).join(" × "), partidas.length - 1));
    historico.value = partidas.length - 1;
    zoom = 1;
    seguirCamera = true;
    seguir = true;
    turno.replaceChildren();
    novaBusca();
    obter("partida").hidden = false;
    desenhar();
  });

  obter("passo").addEventListener("click", () => { seguirAoVivo(); passoDaPartida(); desenhar(); });
  obter("jogada").addEventListener("click", () => {
    seguirAoVivo();
    ateJogada = true;
    desenhar();
    quadro = requestAnimationFrame(ciclo);
  });
  obter("auto").addEventListener("click", () => {
    if (automatico || ateJogada) parar();
    else {
      seguirAoVivo();
      automatico = true;
      quadro = requestAnimationFrame(ciclo);
    }
    desenhar();
  });
  obter("vivo").addEventListener("click", () => {
    seguirCamera = true;
    seguirAoVivo();
    desenhar();
  });
  historico.addEventListener("change", () => {
    parar();
    partida = partidas[Number(historico.value)];
    turno.replaceChildren();
    partida.turnos.forEach(adicionarTurno);
    if (partida.fim) turno.add(new Option("Posição final", "final"));
    seguirAoVivo();
    desenhar();
  });
  turno.addEventListener("change", () => { seguir = false; selecionado = 0; desenhar(); });
  obter("menos").addEventListener("click", () => ajustarZoom(zoom / 1.25));
  obter("mais").addEventListener("click", () => ajustarZoom(zoom * 1.25));
  obter("repor").addEventListener("click", restaurarVisao);
  arvore.addEventListener("wheel", evento => {
    if (!arvore.firstElementChild) return;
    evento.preventDefault();
    const delta = evento.deltaY * (evento.deltaMode === 1 ? 16 : evento.deltaMode === 2 ? 100 : 1);
    ajustarZoom(zoom * Math.exp(-delta * 0.002), evento.clientX, evento.clientY);
  }, { passive: false });

  arvore.addEventListener("pointerdown", evento => {
    if (evento.button !== 0 || !evento.isPrimary) return;
    suprimirClique = false;
    arraste = { id: evento.pointerId, x: evento.clientX, y: evento.clientY,
      esquerda: arvore.scrollLeft, topo: arvore.scrollTop, movendo: false };
  });
  arvore.addEventListener("pointermove", evento => {
    if (!arraste || arraste.id !== evento.pointerId) return;
    const dx = evento.clientX - arraste.x;
    const dy = evento.clientY - arraste.y;
    if (!arraste.movendo) {
      if (Math.hypot(dx, dy) < 5) return;
      arraste.movendo = true;
      seguirCamera = false;
      obter("vivo").disabled = false;
      arvore.setPointerCapture(evento.pointerId);
      arvore.classList.add("debug-arrastando");
    }
    arvore.scrollLeft = arraste.esquerda - dx;
    arvore.scrollTop = arraste.topo - dy;
  });

  function encerrarArraste(evento) {
    if (!arraste || arraste.id !== evento.pointerId) return;
    suprimirClique = arraste.movendo;
    arraste = null;
    arvore.classList.remove("debug-arrastando");
  }

  arvore.addEventListener("pointerup", encerrarArraste);
  arvore.addEventListener("pointercancel", encerrarArraste);
  arvore.addEventListener("lostpointercapture", encerrarArraste);
  arvore.addEventListener("pointerleave", evento => {
    if (!arraste?.movendo) encerrarArraste(evento);
  });
  arvore.addEventListener("click", evento => {
    if (suprimirClique && evento.detail > 0) {
      suprimirClique = false;
      return;
    }
    const botao = evento.target.closest("button");
    if (!botao) return;
    if (botao.dataset.no !== undefined) {
      seguir = false;
      selecionado = Number(botao.dataset.no);
    } else {
      const registro = partida.turnos[Number(turno.value)];
      const id = Number(botao.dataset.ramo);
      if (registro.abertos.has(id)) registro.abertos.delete(id);
      else registro.abertos.add(id);
      if (seguir) selecionado = registro.evento?.no ?? 0;
      seguir = false;
    }
    desenhar();
  });
  const painel = obter("partida");
  const telaCheia = obter("tela-cheia");

  function definirTelaCheia(ativa) {
    document.body.classList.toggle("debug-em-tela-cheia", ativa);
    telaCheia.setAttribute("aria-pressed", String(ativa));
    telaCheia.textContent = ativa ? "Sair da tela cheia" : "Tela cheia";
    desenhar();
  }

  telaCheia.addEventListener("click", async () => {
    if (document.fullscreenElement === painel) {
      await document.exitFullscreen();
    } else if (document.body.classList.contains("debug-em-tela-cheia")) {
      definirTelaCheia(false);
    } else {
      if (painel.requestFullscreen) {
        try {
          await painel.requestFullscreen();
          return;
        } catch {
          // O painel também pode ocupar a janela quando o navegador restringe a tela cheia.
        }
      }
      definirTelaCheia(true);
    }
  });

  document.addEventListener("fullscreenchange", () => {
    const ativa = document.fullscreenElement === painel;
    if (ativa || document.body.classList.contains("debug-em-tela-cheia")) definirTelaCheia(ativa);
  });
  document.addEventListener("keydown", evento => {
    if (evento.key === "Escape" && !document.fullscreenElement &&
        document.body.classList.contains("debug-em-tela-cheia")) definirTelaCheia(false);
  });

  expandirTudo.addEventListener("click", () => {
    const registro = partida.turnos[Number(turno.value)];
    resumo.checked = false;
    for (const item of registro.nos.values()) {
      if (item.filhos.length) registro.abertos.add(item.no);
    }
    seguirCamera = true;
    desenhar();
  });

  arvore.addEventListener("pointermove", evento => {
    cursorArvore = evento.pointerType === "touch" ? null : { x: evento.clientX, y: evento.clientY };
    atualizarTooltip();
  });
  arvore.addEventListener("pointerleave", () => {
    cursorArvore = null;
    atualizarTooltip();
  });
  arvore.addEventListener("focusin", atualizarTooltip);
  arvore.addEventListener("focusout", () => { tooltip.hidden = true; });
  arvore.addEventListener("scroll", atualizarTooltip);
  resumo.addEventListener("change", () => {
    seguirCamera = true;
    desenhar();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden || !partida) return;
    parar();
    desenhar();
  });
})();
