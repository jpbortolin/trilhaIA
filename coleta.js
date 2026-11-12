"use strict";

(() => {
  const obter = id => document.getElementById(id);
  const chave = Relatorio.identificador;
  const PAUSA = Symbol("pausa");
  const memoria = new Map();
  let banco;
  let sessao;
  let ocupado = true;
  let pausa = false;
  let grupos = [];
  let testes = [];

  function abrirBanco() {
    return new Promise((resolver, rejeitar) => {
      const pedido = indexedDB.open("trilha-protocolo-2026", 1);
      pedido.onupgradeneeded = () => {
        const tabela = pedido.result.createObjectStore("dados", { keyPath: ["bloco", "id"] });
        tabela.createIndex("porBloco", "bloco");
      };
      pedido.onsuccess = () => resolver(pedido.result);
      pedido.onerror = () => rejeitar(pedido.error);
      pedido.onblocked = () => rejeitar(new Error("Banco de progresso ocupado."));
    });
  }

  function ler(bloco) {
    if (!banco) return Promise.resolve([]);
    return new Promise((resolver, rejeitar) => {
      const pedido = banco.transaction("dados").objectStore("dados").index("porBloco").getAll(bloco);
      pedido.onsuccess = () => resolver(pedido.result);
      pedido.onerror = () => rejeitar(pedido.error);
    });
  }

  async function gravar(novos, substituir = false) {
    if (!banco) return;
    try {
      await new Promise((resolver, rejeitar) => {
        const transacao = banco.transaction("dados", "readwrite");
        const tabela = transacao.objectStore("dados");
        transacao.oncomplete = resolver;
        transacao.onabort = () => rejeitar(transacao.error);
        if (!substituir) {
          for (const item of novos) tabela.put(item);
          return;
        }
        const cursor = tabela.index("porBloco").openCursor(sessao.bloco);
        cursor.onsuccess = () => {
          const item = cursor.result;
          if (item) { item.delete(); item.continue(); }
          else for (const dado of novos) tabela.put(dado);
        };
      });
    } catch (erro) {
      banco = null;
      avisoArmazenamento();
    }
  }

  function avisoArmazenamento() {
    obter("armazenamento").textContent = banco ?
      "Partidas concluídas são salvas neste navegador. Guarde também o JSON de progresso." :
      "Salvamento local indisponível. Baixe o JSON de progresso antes de fechar a página.";
  }

  function metadados() {
    const { registros, ...dados } = sessao;
    return { bloco: sessao.bloco, id: "", valor: dados };
  }

  function item(registro) {
    return { bloco: sessao.bloco, id: chave(registro), valor: registro };
  }

  function atualizar() {
    const total = Protocolo.criarPlano(sessao?.bloco ?? obter("bloco").value).length;
    const feitas = sessao?.registros.length ?? 0;
    obter("progresso").max = total;
    obter("progresso").value = feitas;
    obter("executar").textContent = feitas ? "Retomar bloco" : "Iniciar bloco";
    obter("executar").disabled = ocupado || feitas === total;
    obter("pausar").disabled = !ocupado || pausa;
    obter("bloco").disabled = ocupado;
    obter("arquivo").disabled = ocupado;
    for (const id of ["json", "jsonl", "csv"]) obter(id).disabled = !feitas;
  }

  function linhasEstatistica() {
    return [["Confronto", "p bilateral", "p ajustado (Holm)", "p ajustado ≤ 0,05"],
      ...testes.map(t => [t.confronto, t.p, t.ajustado, t.significativo ? "Sim" : "Não"])];
  }

  function mostrarResultados() {
    const avaliadas = sessao.registros.filter(r => r.etapa !== "aquecimento");
    grupos = Relatorio.resumir(avaliadas);
    testes = Protocolo.significancia(avaliadas);
    obter("tabelas").innerHTML = grupos.length ? Relatorio.tabelasHtml(grupos) : "";
    obter("significancia").innerHTML = testes.length ?
      "<h3>Permutação bilateral por pares e correção de Holm</h3>" +
      Relatorio.tabelaHtml(linhasEstatistica().map((linha, i) => i ?
        [linha[0], linha[1].toPrecision(5), linha[2].toPrecision(5), linha[3]] : linha)) : "";
    obter("graficos").replaceChildren();
    for (const grafico of Relatorio.criarGraficos(grupos)) {
      const secao = document.createElement("section");
      secao.className = "grafico";
      secao.innerHTML = grafico.svg;
      const botao = document.createElement("button");
      botao.textContent = "Baixar gráfico";
      botao.addEventListener("click", () => Relatorio.baixar(grafico.nome + ".svg", grafico.svg, "image/svg+xml"));
      secao.append(botao);
      obter("graficos").append(secao);
    }
    obter("resumo").disabled = !grupos.length;
    obter("estatistica").disabled = !testes.length;
  }

  async function selecionarBloco() {
    ocupado = true;
    atualizar();
    const bloco = obter("bloco").value;
    try {
      if (!memoria.has(bloco)) {
        const itens = await ler(bloco);
        const dados = itens.find(r => r.id === "")?.valor;
        if (dados) memoria.set(bloco, { ...dados, registros: itens.filter(r => r.id && r.valor.execucao === dados.execucao).map(r => r.valor).sort((a, b) => a.ordem - b.ordem) });
      }
    } catch (erro) {
      banco = null;
      avisoArmazenamento();
    }
    sessao = memoria.get(bloco) ?? {
      protocolo: Protocolo.VERSAO, bloco, execucao: new Date().toISOString(),
      ambiente: navigator.userAgent, registros: []
    };
    memoria.set(bloco, sessao);
    ocupado = false;
    atualizar();
    mostrarResultados();
    obter("situacao").textContent = sessao.registros.length + " partidas concluídas neste bloco.";
  }

  function verificar() {
    if (pausa || document.hidden) throw PAUSA;
  }

  async function executar() {
    if (ocupado) return;
    ocupado = true;
    pausa = false;
    atualizar();
    const plano = Protocolo.criarPlano(sessao.bloco);
    const feitas = new Set(sessao.registros.map(chave));
    try {
      await gravar([metadados()]);
      for (const tarefa of plano) {
        if (feitas.has(chave(tarefa))) continue;
        verificar();
        obter("situacao").textContent = (sessao.registros.length + 1) + " de " + plano.length +
          " · " + tarefa.rotulo + " · " + tarefa.confronto;
        const registro = await Torneio.jogarPartida(tarefa, sessao.execucao, verificar);
        sessao.registros.push(registro);
        await gravar([item(registro)]);
        obter("progresso").value = sessao.registros.length;
        for (const id of ["json", "jsonl", "csv"]) obter(id).disabled = false;
      }
      obter("situacao").textContent = "Bloco concluído. Exporte os arquivos.";
    } catch (erro) {
      obter("situacao").textContent = erro === PAUSA ?
        "Pausado. A próxima retomada reinicia somente a partida interrompida." :
        "Execução interrompida: " + erro.message;
    } finally {
      ocupado = false;
      atualizar();
      mostrarResultados();
    }
  }

  async function importar(evento) {
    const arquivo = evento.target.files[0];
    if (!arquivo || ocupado) return;
    ocupado = true;
    atualizar();
    try {
      const nova = Protocolo.validar(JSON.parse(await arquivo.text()));
      // A importação substitui somente o progresso do bloco indicado no arquivo.
      sessao = nova;
      memoria.set(nova.bloco, nova);
      obter("bloco").value = nova.bloco;
      await gravar([metadados(), ...nova.registros.map(item)], true);
      mostrarResultados();
      obter("situacao").textContent = "Importadas " + nova.registros.length + " partidas.";
    } catch (erro) {
      obter("situacao").textContent = "Importação recusada: " + erro.message;
    } finally {
      ocupado = false;
      evento.target.value = "";
      atualizar();
    }
  }

  function baixar(sufixo, texto, tipo) {
    Relatorio.baixar("trilha-" + sessao.bloco + "-" + sufixo, texto, tipo);
  }

  obter("bloco").addEventListener("change", selecionarBloco);
  obter("executar").addEventListener("click", executar);
  obter("pausar").addEventListener("click", () => { pausa = true; obter("pausar").disabled = true; });
  document.addEventListener("visibilitychange", () => { if (ocupado && document.hidden) pausa = true; });
  obter("arquivo").addEventListener("change", importar);
  obter("json").addEventListener("click", () => baixar("progresso.json", JSON.stringify(sessao), "application/json"));
  obter("jsonl").addEventListener("click", () => baixar("partidas.jsonl",
    sessao.registros.map(r => JSON.stringify(r)).join("\n") + "\n", "application/x-ndjson"));
  obter("csv").addEventListener("click", () => {
    const colunas = [...Relatorio.COLUNAS, "etapa", "rotulo", "ordem", "sementeA", "sementeB",
      "exploracao", "horizonte", "acimaDoPrazoA", "acimaDoPrazoB"];
    baixar("partidas.csv", Relatorio.paraCsv([colunas, ...sessao.registros.map(r => colunas.map(c => r[c]))]), "text/csv;charset=utf-8");
  });
  obter("resumo").addEventListener("click", () =>
    baixar("resumo.csv", Relatorio.paraCsv(Relatorio.linhasTabela(grupos)), "text/csv;charset=utf-8"));
  obter("estatistica").addEventListener("click", () =>
    baixar("estatistica.csv", Relatorio.paraCsv(linhasEstatistica()), "text/csv;charset=utf-8"));

  abrirBanco().then(valor => { banco = valor; }, () => {}).finally(() => {
    avisoArmazenamento();
    selecionarBloco();
  });
})();
