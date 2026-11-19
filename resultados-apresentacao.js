"use strict";

(() => {
  const arquivo = document.getElementById("resultados-arquivo");
  const cenario = document.getElementById("resultados-cenario");
  const campo = document.getElementById("resultados-cenario-campo");
  const status = document.getElementById("resultados-status");
  const tabela = document.getElementById("resultados-tabela");
  const nota = document.getElementById("resultados-nota");
  const tituloConclusao = document.getElementById("conclusao-cenario");
  const veredito = document.getElementById("conclusao-veredito");
  const confrontos = document.getElementById("conclusao-confrontos");
  const limite = document.getElementById("conclusao-limite");
  let grupos = [];
  let testes = new Map();
  let fonte = "";
  let leitura = 0;

  function exibir() {
    const linhas = [["Confronto", "Agente", "Pares", "V / E / D", "Pontos por partida", "IC 95%", "ms por jogada"]];
    const filtrados = grupos.filter(grupo => grupo.cenario === cenario.value);
    for (const grupo of filtrados) {
      for (const lado of grupo.lados) {
        linhas.push([grupo.confronto, Relatorio.NOMES[lado.agente], grupo.pares,
          [lado.vitorias, lado.empates, lado.derrotas].join(" / "), lado.pontuacao,
          lado.ic ? lado.ic.map(valor => Relatorio.numero(valor)).join(" a ") : "—",
          Relatorio.numero(lado.tempo, 2)]);
      }
    }
    nota.hidden = linhas.length < 2;
    tabela.innerHTML = nota.hidden ? "" : Relatorio.tabelaHtml(linhas);
    concluir(filtrados);
  }

  function concluir(filtrados) {
    confrontos.replaceChildren();
    limite.hidden = !filtrados.length;
    tituloConclusao.textContent = filtrados.length ? filtrados[0].nome + " · " + fonte : "";
    if (!filtrados.length) {
      veredito.textContent = "Carregue uma exportação com pares completos no slide anterior para apurar os confrontos.";
      return;
    }
    const vitorias = new Map();
    for (const grupo of filtrados) {
      const [a, b] = grupo.lados;
      const lider = a.pontuacao === b.pontuacao ? null : a.pontuacao > b.pontuacao ? a : b;
      if (lider) vitorias.set(lider.agente, (vitorias.get(lider.agente) ?? 0) + 1);
      const teste = grupo.etapa === "principal" ? testes.get(grupo.confronto) : null;
      const cartao = document.createElement("div");
      cartao.className = "cartao";
      const confronto = document.createElement("span");
      confronto.className = "rotulo";
      confronto.textContent = grupo.confronto;
      const placar = document.createElement("p");
      placar.textContent = (lider ? Relatorio.NOMES[lider.agente] + " pontuou mais" : "Pontuação empatada") +
        " · " + Relatorio.numero(a.pontuacao) + " a " + Relatorio.numero(b.pontuacao) +
        " em " + grupo.pares + (grupo.pares === 1 ? " par." : " pares.");
      const evidencia = document.createElement("p");
      evidencia.textContent = teste
        ? (teste.significativo ? "Diferença detectada" : "O teste não detectou diferença") +
          " após ajuste de Holm (p = " + teste.ajustado.toPrecision(3).replace(".", ",") + ")."
        : "Comparação descritiva neste cenário.";
      cartao.append(confronto, placar, evidencia);
      confrontos.append(cartao);
    }
    const dominante = [...vitorias].find(([, quantidade]) => quantidade === 2);
    if (filtrados.length === 1) {
      const lider = vitorias.keys().next().value;
      veredito.textContent = lider ? Relatorio.NOMES[lider] + " teve a maior pontuação observada neste confronto."
        : "Os dois agentes tiveram a mesma pontuação observada neste confronto.";
    } else {
      veredito.textContent = filtrados.length === 3 && dominante
        ? Relatorio.NOMES[dominante[0]] + " pontuou mais contra os dois adversários neste cenário."
        : filtrados.length === 3
          ? "Nenhum agente pontuou mais nos seus dois confrontos neste cenário."
          : "A exportação contém dois confrontos analisáveis. Veja a pontuação de cada um.";
    }
    limite.textContent = "Veredito restrito a este cenário, aos pares disponíveis e ao orçamento escolhido.";

  }

  arquivo.addEventListener("change", async () => {
    const selecionado = [...arquivo.files].sort((a, b) => b.lastModified - a.lastModified)[0];
    if (!selecionado) return;
    const atual = ++leitura;
    status.textContent = "Lendo " + selecionado.name + "…";
    campo.hidden = true;
    cenario.replaceChildren();
    grupos = [];
    testes = new Map();
    fonte = selecionado.name;
    exibir();
    try {
      const texto = await selecionado.text();
      if (atual !== leitura) return;
      const registros = /\.json$/i.test(selecionado.name)
        ? Relatorio.validarRegistros(JSON.parse(texto).registros)
        : Relatorio.importarCsv(texto);
      const avaliadas = registros.filter(r => r.etapa !== "aquecimento");
      grupos = Relatorio.resumir(avaliadas);
      const agentes = [...new Set(avaliadas.filter(r => r.etapa === "principal").flatMap(r => [r.agenteA, r.agenteB]))];
      if (agentes.length >= 2) {
        testes = new Map(Protocolo.significancia(avaliadas, agentes).map(teste => [teste.confronto, teste]));
      }
      const cenarios = new Map(grupos.map(g => [g.cenario, g.nome]));
      for (const [id, nome] of cenarios) cenario.add(new Option(nome, id));
      if (cenarios.has("principal")) cenario.value = "principal";
      campo.hidden = !cenarios.size;
      const partidas = grupos.reduce((total, g) => total + g.partidas, 0);
      status.textContent = selecionado.name + " · " + (partidas
        ? partidas + " partidas analisáveis em pares completos no arquivo. O aquecimento fica fora."
        : "O arquivo ainda não contém pares completos para análise.");
      exibir();
    } catch (erro) {
      status.textContent = "Não foi possível carregar " + selecionado.name + ". " + erro.message;
    }
  });
  cenario.addEventListener("change", exibir);
})();
