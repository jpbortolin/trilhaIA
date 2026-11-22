"use strict";

const Relatorio = (() => {
  const REAMOSTRAGENS = 10000;
  const NOMES = { mcts: "MCTS", minimax: "Minimax", monteCarlo: "Monte Carlo" };
  const COLUNAS = ["versao", "execucao", "confronto", "bloco", "cenario", "posicao", "agenteA", "agenteB",
    "par", "perna", "semente", "corA", "quemComecou", "resultado", "motivo", "chaveInicial", "turnosIniciais", "turnos",
    "limiteMs", "iteracoesMcts", "iteracoesMonteCarlo", "profundidadeMinimax",
    "jogadasA", "jogadasB", "tempoTotalA", "tempoTotalB", "tempoMedioA", "tempoMedioB", "nosA", "nosB",
    "simulacoesA", "simulacoesB", "profundidadeMediaA", "profundidadeMediaB", "truncadasA", "truncadasB",
    "coberturaInsuficienteA", "coberturaInsuficienteB"];
  const CAMPOS_PRAZO = ["acimaDoPrazoA", "acimaDoPrazoB"];
  const COLUNAS_COLETA = Object.freeze([...COLUNAS, "motor", "etapa", "rotulo", "ordem", "sementeA", "sementeB",
    "exploracao", "horizonte", ...CAMPOS_PRAZO]);
  const TEXTOS_COLETA = new Set(["motor", "etapa", "rotulo"]);
  const TEXTOS = new Set(["execucao", "confronto", "bloco", "cenario", "posicao", "agenteA", "agenteB",
    "quemComecou", "resultado", "motivo", "chaveInicial"]);
  const MOTIVOS = ["menos de três peças", "sem movimentos", "terceira repetição", "100 turnos sem captura", "limite de 400 turnos"];
  const escapar = valor => String(valor).replace(/[&<>"']/g, sinal => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[sinal]));
  const numero = (valor, casas = 3) => valor === null ? "—" : valor.toLocaleString("pt-BR", { maximumFractionDigits: casas });
  const media = valores => valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
  const pontuacao = registro => registro.resultado === "empate" ? 0.5 : Number(registro.resultado === "A");
  const identificador = registro => [registro.cenario, registro.agenteA, registro.agenteB, registro.par, registro.perna].join("|");

  function sementeDoTexto(texto) {
    let valor = 2166136261;
    for (const letra of texto) valor = Math.imul(valor ^ letra.charCodeAt(0), 16777619);
    return valor >>> 0;
  }

  function paraCsv(linhas) {
    return "\uFEFF" + linhas.map(linha => linha.map(valor => '"' + String(valor ?? "").replace(/"/g, '""') + '"').join(",")).join("\r\n");
  }

  function lerLinhasCsv(texto) {
    const linhas = [];
    let linha = [], campo = "", entreAspas = false;
    texto = texto.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
    for (let i = 0; i < texto.length; i++) {
      const letra = texto[i];
      if (letra === '"') {
        if (entreAspas && texto[i + 1] === '"') { campo += '"'; i++; }
        else entreAspas = !entreAspas;
      } else if (!entreAspas && (letra === "," || letra === "\n")) {
        linha.push(campo); campo = "";
        if (letra === "\n") { linhas.push(linha); linha = []; }
      } else campo += letra;
    }
    if (entreAspas) throw new Error("CSV com aspas não fechadas.");
    if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
    return linhas;
  }

  function exportarCsv(registros) {
    const colunas = [...COLUNAS, ...CAMPOS_PRAZO];
    return paraCsv([colunas, ...registros.map(r => colunas.map(c => r[c]))]);
  }

  function importarCsv(texto) {
    const linhas = lerLinhasCsv(texto);
    const [colunas, ...dados] = linhas;
    const cabecalho = JSON.stringify(colunas);
    if (cabecalho !== JSON.stringify(COLUNAS) && cabecalho !== JSON.stringify([...COLUNAS, ...CAMPOS_PRAZO]) &&
        cabecalho !== JSON.stringify(COLUNAS_COLETA)) {
      throw new Error("Use o CSV de partidas exportado por esta versão do projeto.");
    }
    const registros = dados.map(linha => {
      if (linha.length !== colunas.length) throw new Error("Linha CSV incompleta.");
      return Object.fromEntries(colunas.map((coluna, i) => [coluna,
        (TEXTOS.has(coluna) || TEXTOS_COLETA.has(coluna)) ? linha[i] : linha[i] === "" ? null : Number(linha[i])]));
    });
    return validarRegistros(registros);
  }

  function validarRegistros(registros) {
    if (!Array.isArray(registros) || registros.length > 12000) throw new Error("Lista de partidas inválida ou muito grande.");
    const vistos = new Set();
    const pares = new Map();
    const inteiros = COLUNAS.filter(c => !TEXTOS.has(c) && !c.startsWith("tempo") && !c.startsWith("profundidadeMedia"));
    for (const r of registros) {
      if (!r || COLUNAS.some(c => !(c in r))) throw new Error("Partida com campos ausentes.");
      if ([...TEXTOS].some(c => typeof r[c] !== "string" || r[c].length > 200)) throw new Error("Texto inválido no arquivo.");
      if (registros[0].execucao !== r.execucao || !r.execucao) throw new Error("O arquivo deve conter somente uma execução.");
      if (COLUNAS.some(c => !TEXTOS.has(c) && (!Number.isFinite(r[c]) || r[c] < 0))) throw new Error("Estatística numérica inválida.");
      if (inteiros.some(c => !Number.isSafeInteger(r[c]))) throw new Error("Contagem não inteira.");
      if (r.versao !== 1 || !NOMES[r.agenteA] || !NOMES[r.agenteB] || r.agenteA === r.agenteB ||
          ![1, 2].includes(r.perna) || r.corA !== r.perna || r.par < 1 || r.par > 200 || r.semente > 4294967295 ||
          !["tempo", "posicoes", "fixo", "ablacao"].includes(r.bloco) || !["vazio", "abertura", "meio", "final"].includes(r.posicao) ||
          !["A", "B", "empate"].includes(r.resultado) || !MOTIVOS.includes(r.motivo) ||
          r.quemComecou !== (r.corA === 1 ? r.agenteA : r.agenteB) ||
          r.confronto !== NOMES[r.agenteA] + " × " + NOMES[r.agenteB] || !/^[012]{24}:1:[0-9]:[0-9]$/.test(r.chaveInicial)) {
        throw new Error("Metadados da partida inválidos.");
      }
      if (r.turnos < 1 || r.turnos + r.turnosIniciais > 400 || r.jogadasA + r.jogadasB !== r.turnos ||
          r.jogadasA !== (r.corA === 1 ? Math.ceil(r.turnos / 2) : Math.floor(r.turnos / 2))) {
        throw new Error("Turnos e jogadas inconsistentes.");
      }
      if ((r.resultado === "empate") !== !["menos de três peças", "sem movimentos"].includes(r.motivo)) throw new Error("Resultado incompatível com o motivo.");
      if (r.motivo === "limite de 400 turnos" && r.turnos + r.turnosIniciais !== 400) throw new Error("Limite de turnos inconsistente.");
      for (const lado of ["A", "B"]) {
        const acima = r["acimaDoPrazo" + lado];
        if (acima != null && (!Number.isSafeInteger(acima) || acima < 0 ||
            acima > (r.limiteMs ? r["jogadas" + lado] : 0))) throw new Error("Contagem acima do prazo inválida.");
        const esperado = r["jogadas" + lado] ? r["tempoTotal" + lado] / r["jogadas" + lado] : 0;
        if (Math.abs(esperado - r["tempoMedio" + lado]) > 0.00001 ||
            r["truncadas" + lado] > r["simulacoes" + lado] || r["coberturaInsuficiente" + lado] > r["jogadas" + lado]) {
          throw new Error("Métricas por agente inconsistentes.");
        }
      }
      const id = identificador(r);
      if (vistos.has(id)) throw new Error("Partida duplicada: " + id);
      vistos.add(id);
      const chavePar = [r.cenario, r.agenteA, r.agenteB, r.par].join("|");
      const anterior = pares.get(chavePar);
      const comuns = ["semente", "chaveInicial", "turnosIniciais", "bloco", "posicao", "limiteMs", "iteracoesMcts", "iteracoesMonteCarlo", "profundidadeMinimax"];
      if (anterior && comuns.some(c => anterior[c] !== r[c])) throw new Error("As duas partidas do par têm condições diferentes.");
      pares.set(chavePar, r);
    }
    return registros;
  }

  function intervalo(valores, semente) {
    if (valores.length < 2) return null;
    const sortear = Motor.criarGerador(semente);
    const medias = [];
    for (let repeticao = 0; repeticao < REAMOSTRAGENS; repeticao++) {
      let soma = 0;
      for (let i = 0; i < valores.length; i++) soma += valores[Math.floor(sortear() * valores.length)];
      medias.push(soma / valores.length);
    }
    medias.sort((a, b) => a - b);
    function percentil(proporcao) {
      const indice = proporcao * (medias.length - 1), inferior = Math.floor(indice);
      return medias[inferior] + (medias[Math.ceil(indice)] - medias[inferior]) * (indice - inferior);
    }
    return [percentil(0.025), percentil(0.975)];
  }

  function nomeCenario(r) {
    if (r.rotulo) return r.rotulo;
    const posicoes = { vazio: "Vazio", abertura: "Abertura com semente", meio: "Meio-jogo", final: "Final 3 × 4" };
    if (r.bloco === "ablacao") return "MCTS " + r.iteracoesMcts + " × Minimax 4 · meio-jogo";
    if (r.bloco === "fixo") return "Esforço fixo · meio-jogo";
    return posicoes[r.posicao] + " · " + r.limiteMs + " ms · " + (r.bloco === "tempo" ? "tempo" : "posições");
  }

  function resumir(registros) {
    const grupos = new Map();
    for (const r of registros) {
      const chave = [r.cenario, r.agenteA, r.agenteB].join("|");
      if (!grupos.has(chave)) grupos.set(chave, { chave, referencia: r, pares: new Map() });
      const grupo = grupos.get(chave);
      if (!grupo.pares.has(r.par)) grupo.pares.set(r.par, []);
      grupo.pares.get(r.par).push(r);
    }
    const saida = [];
    for (const grupo of grupos.values()) {
      const pares = [...grupo.pares.entries()].sort((a, b) => a[0] - b[0]).map(p => p[1]).filter(p => p.length === 2);
      if (!pares.length) continue;
      const partidas = pares.flat();
      const valores = pares.map(par => media(par.map(pontuacao)));
      const ic = intervalo(valores, sementeDoTexto(grupo.chave));
      const empates = partidas.filter(r => r.resultado === "empate").length;
      const lados = ["A", "B"].map(lado => {
        const soma = campo => partidas.reduce((total, r) => total + r[campo + lado], 0);
        const jogadas = soma("jogadas");
        const vitorias = partidas.filter(r => r.resultado === lado).length;
        const prazoMedido = partidas.every(r => r["acimaDoPrazo" + lado] != null);
        const acimaDoPrazo = grupo.referencia.limiteMs && prazoMedido ? soma("acimaDoPrazo") : null;
        return { agente: grupo.referencia["agente" + lado], vitorias, empates, derrotas: partidas.length - vitorias - empates,
          pontuacao: lado === "A" ? media(valores) : 1 - media(valores),
          ic: !ic ? null : lado === "A" ? ic : [1 - ic[1], 1 - ic[0]], jogadas,
          tempo: jogadas ? soma("tempoTotal") / jogadas : null,
          nos: jogadas ? soma("nos") / jogadas : null,
          simulacoes: jogadas ? soma("simulacoes") / jogadas : null,
          profundidade: jogadas ? partidas.reduce((s, r) => s + r["profundidadeMedia" + lado] * r["jogadas" + lado], 0) / jogadas : null,
          truncadas: soma("truncadas"), semCobertura: soma("coberturaInsuficiente"), acimaDoPrazo };
      });
      saida.push({ ...grupo.referencia, chave: grupo.chave, nome: nomeCenario(grupo.referencia),
        pares: pares.length, partidas: partidas.length, lados });
    }
    return saida.sort((a, b) => a.cenario.localeCompare(b.cenario) || a.confronto.localeCompare(b.confronto));
  }

  function linhasTabela(grupos) {
    return [["Confronto", "Cenário", "Agente", "Pares", "Partidas", "Vitórias", "Empates", "Derrotas", "Taxa V", "Taxa E", "Taxa D",
      "Pontuação", "IC95 inferior", "IC95 superior", "Jogadas", "Tempo médio (ms)", "Nós/jogada", "Simulações/jogada", "Profundidade média", "Simulações truncadas", "Jogadas sem cobertura", "Jogadas acima do prazo"],
    ...grupos.flatMap(g => g.lados.map(l => [g.confronto, g.nome, NOMES[l.agente], g.pares, g.partidas, l.vitorias, l.empates, l.derrotas,
      l.vitorias / g.partidas, l.empates / g.partidas, l.derrotas / g.partidas, l.pontuacao,
      l.ic ? l.ic[0] : "", l.ic ? l.ic[1] : "", l.jogadas, l.tempo ?? "", l.nos ?? "", l.simulacoes ?? "", l.profundidade ?? "", l.truncadas, l.semCobertura, l.acimaDoPrazo ?? ""]))];
  }

  function tabelaHtml(linhas) {
    return '<div class="tabela-rolavel"><table><thead><tr>' + linhas[0].map(c => "<th>" + escapar(c) + "</th>").join("") +
      "</tr></thead><tbody>" + linhas.slice(1).map(l => "<tr>" + l.map(c => "<td>" + escapar(typeof c === "number" ? numero(c) : c) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>";
  }

  function tabelasHtml(grupos) {
    const linhas = linhasTabela(grupos);
    const selecionar = indices => linhas.map(linha => indices.map(i => linha[i]));
    return "<h3>Desempenho competitivo</h3><p class='nota'>Taxas e pontuação entre 0 e 1. Células vazias de IC indicam menos de dois pares.</p>" +
      tabelaHtml(selecionar([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])) +
      "<h3>Custo por jogada e diagnósticos</h3><p class='nota'>Médias ponderadas pelo número de jogadas; partidas sem jogadas daquele agente não recebem peso. Truncadas, sem cobertura e acima do prazo são contagens totais. Até um pequeno excedente conta como acima do prazo.</p>" +
      tabelaHtml(selecionar([0, 1, 2, 14, 15, 16, 17, 18, 19, 20, 21]));
  }

  function markdown(grupos) {
    const linhas = linhasTabela(grupos).map(l => l.map(v => String(typeof v === "number" ? numero(v) : v).replace(/\|/g, "\\|").replace(/\n/g, " ")));
    return [linhas[0], linhas[0].map(() => "---"), ...linhas.slice(1)].map(l => "| " + l.join(" | ") + " |").join("\n");
  }

  function texto(x, y, valor, tamanho = 12, ancora = "start") {
    return '<text x="' + x + '" y="' + y + '" font-size="' + tamanho + '" text-anchor="' + ancora + '">' + escapar(valor) + "</text>";
  }
  function linha(x1, y1, x2, y2, cor = "#cbd5cf", largura = 1) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + cor + '" stroke-width="' + largura + '"/>';
  }
  function retangulo(x, y, largura, altura, cor) {
    return '<rect x="' + x + '" y="' + y + '" width="' + largura + '" height="' + altura + '" fill="' + cor + '"/>';
  }
  function circulo(x, y, raio = 5) { return '<circle cx="' + x + '" cy="' + y + '" r="' + raio + '" fill="#245d4a"/>'; }
  function svg(titulo, altura, conteudo) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 ' + altura + '" width="1000" height="' + altura +
      '" role="img" aria-label="' + escapar(titulo) + '"><title>' + escapar(titulo) + '</title><rect width="100%" height="100%" fill="white"/>' +
      '<g font-family="Arial, sans-serif" fill="#263d34">' + texto(24, 32, titulo, 19) + conteudo + "</g></svg>";
  }

  function criarGraficos(grupos) {
    if (!grupos.length) return [];
    const altura = 140 + grupos.length * 66;
    const inicio = 380, largura = 540;
    const rotulo = (g, y) => texto(24, y, g.confronto, 13) + texto(24, y + 18, g.nome, 11);
    let barras = texto(24, 57, "Perspectiva do primeiro agente · taxas sobre partidas de pares completos", 12);
    let pontos = texto(24, 57, "Pontuação média do primeiro agente · IC 95% por bootstrap de pares", 12);
    let tempos = texto(24, 57, "Tempo total dividido pelas jogadas de cada agente · inclui preparação e seleção final", 12);
    const maximo = Math.max(1, ...grupos.flatMap(g => g.lados.map(l => l.tempo ?? 0))) * 1.18;
    for (let passo = 0; passo <= 4; passo++) {
      const x = inicio + largura * passo / 4;
      for (const tipo of ["barras", "pontos", "tempos"]) {
        const eixo = linha(x, 85, x, altura - 40) + texto(x, altura - 22,
          tipo === "barras" ? passo * 25 + "%" : numero((tipo === "pontos" ? 1 : maximo) * passo / 4, 2), 11, "middle");
        if (tipo === "barras") barras += eixo;
        else if (tipo === "pontos") pontos += eixo;
        else tempos += eixo;
      }
    }
    grupos.forEach((g, i) => {
      const y = 104 + i * 66;
      const a = g.lados[0];
      barras += rotulo(g, y); pontos += rotulo(g, y); tempos += rotulo(g, y);
      let x = inicio;
      [a.vitorias, a.empates, a.derrotas].forEach((quantidade, indice) => {
        const tamanho = largura * quantidade / g.partidas;
        barras += retangulo(x, y - 10, tamanho, 24, ["#2c7156", "#c7c9b3", "#be6455"][indice]);
        if (tamanho > 35) barras += '<g fill="' + (indice === 1 ? "#263d34" : "white") + '">' + texto(x + tamanho / 2, y + 6, numero(100 * quantidade / g.partidas, 0) + "%", 11, "middle") + "</g>";
        x += tamanho;
      });
      if (a.ic) {
        const menor = inicio + largura * a.ic[0], maior = inicio + largura * a.ic[1];
        pontos += linha(menor, y, maior, y, "#245d4a", 3) + linha(menor, y - 7, menor, y + 7, "#245d4a", 2) + linha(maior, y - 7, maior, y + 7, "#245d4a", 2);
      }
      pontos += circulo(inicio + largura * a.pontuacao, y) + texto(935, y + 5, numero(a.pontuacao), 12);
      if (!a.ic) pontos += texto(inicio, y + 23, "IC indisponível: somente 1 par", 10);
      g.lados.forEach((l, lado) => {
        const yy = y - 14 + lado * 21;
        tempos += retangulo(inicio, yy, largura * (l.tempo ?? 0) / maximo, 16, lado ? "#c17645" : "#325e83") +
          texto(inicio + largura * (l.tempo ?? 0) / maximo + 6, yy + 12, numero(l.tempo, 1), 11);
      });
    });
    barras += texto(380, 76, "Verde: vitória · cinza: empate · vermelho: derrota", 11);
    tempos += texto(380, 76, "Azul: primeiro agente · laranja: segundo agente", 11);
    const graficos = [
      { nome: "vitorias_empates_derrotas", svg: svg("Vitórias, empates e derrotas", altura, barras + texto(650, altura - 3, "Taxa de resultados", 11, "middle")) },
      { nome: "pontuacao_intervalo", svg: svg("Pontuação média e intervalo de confiança", altura, pontos + texto(650, altura - 3, "Pontuação (vitória 1; empate 0,5; derrota 0)", 11, "middle")) },
      { nome: "tempo_por_jogada", svg: svg("Tempo médio por jogada", altura, tempos + texto(650, altura - 3, "Tempo (ms)", 11, "middle")) }
    ];
    const ablacao = grupos.filter(g => g.bloco === "ablacao" && !g.etapa).sort((a, b) => a.iteracoesMcts - b.iteracoesMcts);
    if (ablacao.length) {
      const x = iteracoes => 100 + (iteracoes - 100) / 1900 * 790;
      const y = valor => 350 - valor * 240;
      let curva = texto(24, 58, "MCTS contra Minimax de profundidade 4 · mesmo meio-jogo · pontos e IC 95%", 12);
      for (let i = 0; i <= 4; i++) curva += linha(100, y(i / 4), 890, y(i / 4)) + texto(80, y(i / 4) + 4, numero(i / 4), 12, "end");
      curva += '<polyline fill="none" stroke="#245d4a" stroke-width="2" points="' + ablacao.map(g => x(g.iteracoesMcts) + "," + y(g.lados[0].pontuacao)).join(" ") + '"/>';
      for (const g of ablacao) {
        const a = g.lados[0], xx = x(g.iteracoesMcts);
        if (a.ic) curva += linha(xx, y(a.ic[0]), xx, y(a.ic[1]), "#245d4a", 2) + linha(xx - 7, y(a.ic[0]), xx + 7, y(a.ic[0]), "#245d4a", 2) + linha(xx - 7, y(a.ic[1]), xx + 7, y(a.ic[1]), "#245d4a", 2);
        curva += circulo(xx, y(a.pontuacao)) + texto(xx, 374, g.iteracoesMcts, 12, "middle");
      }
      curva += texto(495, 406, "Iterações do MCTS", 13, "middle") + texto(24, 85, "Pontuação média do MCTS (0 a 1)", 12);
      graficos.push({ nome: "ablacao_mcts", svg: svg("Sensibilidade ao esforço do MCTS", 425, curva) });
    }
    return graficos;
  }

  function baixar(nome, conteudo, tipo) {
    const endereco = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    const link = document.createElement("a");
    link.href = endereco; link.download = nome; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(endereco), 1000);
  }

  return Object.freeze({ REAMOSTRAGENS, NOMES, COLUNAS, COLUNAS_COLETA, escapar, numero, identificador, sementeDoTexto,
    exportarCsv, importarCsv, validarRegistros, intervalo, nomeCenario, resumir, linhasTabela,
    paraCsv, tabelaHtml, tabelasHtml, markdown, criarGraficos, baixar });
})();
