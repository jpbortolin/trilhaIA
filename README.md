# Trilha | Comparação de algoritmos de busca

Projeto da disciplina de **Inteligência Artificial I** da FHO. Comparamos três algoritmos no jogo de tabuleiro Trilha, também conhecido como *Nine Men's Morris*. A pergunta do trabalho é como os agentes se comportam quando mudamos o orçamento de busca ou a posição inicial da partida.

O projeto reúne jogo, torneio e apresentação. Em **Jogo**, você pode jogar contra a IA. Em **Torneio**, os agentes jogam entre si e o programa reúne os resultados em tabelas e gráficos. O jogo e o torneio usam HTML, CSS e JavaScript, com buscas em Rust compiladas para WebAssembly. As páginas abrem diretamente no navegador.

## Algoritmos comparados

| Algoritmo | Como escolhe a jogada |
| --- | --- |
| **MCTS com UCT** | Constrói uma árvore de jogadas e usa os resultados das simulações para decidir quais ramos explorar. |
| **Minimax com poda alfa-beta** | Considera as respostas dos dois jogadores, avalia as posições e corta ramos que não podem mudar a decisão da busca. |
| **Monte Carlo plano** | Simula partidas a partir das jogadas disponíveis e compara a recompensa média de cada uma. |

Os três agentes usam o mesmo motor de regras. Ele gera as jogadas legais, aplica movimentos e capturas e determina quando a partida termina.

## Como abrir

1. Baixe e extraia os arquivos do projeto. Mantenha os arquivos na mesma pasta.
2. Abra [index.html](index.html) no Chrome ou Edge para jogar contra a IA.
3. Abra [torneio.html](torneio.html) para coletar resultados com Rust/WebAssembly.
4. Abra [apresentacao.html](apresentacao.html) para apresentar o trabalho.
5. Para consultar ou continuar os JSONs JavaScript já coletados, abra [torneio_javascript.html](torneio_javascript.html). As pastas de resultados enviadas acompanham o pacote.

A página de coleta identifica o motor usado. Use os arquivos antigos na página JavaScript e os novos na página Rust/WebAssembly. Detalhes de compilação e validação estão em [LEIA-ME_RUST.md](LEIA-ME_RUST.md).

## Protocolo experimental

Cada par reúne duas partidas com a mesma posição inicial e semente, com os agentes trocando de lado. O torneio usa a semente base **2026** e embaralha a ordem dos pares de forma reproduzível.

| Bloco | O que avaliamos | Partidas previstas |
| --- | --- | ---: |
| Piloto | Funcionamento da execução e da exportação, com tabuleiro vazio e 100 ms por jogada | 60 |
| Principal | Desempenho no tabuleiro vazio com 100 ms por jogada. Inclui 30 partidas de aquecimento fora da análise. | 630 |
| Esforço fixo | Tabuleiro vazio com 1.000 iterações de MCTS, 1.000 simulações de Monte Carlo plano ou profundidade 4 no Minimax | 600 |
| Ablações | Efeito de variar separadamente as iterações do MCTS, a profundidade do Minimax, o coeficiente de exploração ou o horizonte das simulações | 600 |
| Posições iniciais | Comparação entre tabuleiro vazio, abertura, meio-jogo e final, com 100 ms por jogada | 480 |
| **Total** | | **2.370** |

A referência das ablações usa 1.000 iterações no MCTS, 1.000 simulações no Monte Carlo plano, profundidade 4 no Minimax, coeficiente de exploração √2 e horizonte de 80 turnos. Cada variante altera um único parâmetro para 500 iterações, profundidade 3, exploração 1 ou horizonte de 40 turnos, respectivamente.

O relatório apresenta vitórias, empates, derrotas, pontuação média e tempo por jogada. Os intervalos de confiança de 95% usam **10.000 reamostragens de pares completos**. Após a conclusão do torneio principal, o programa calcula o **teste de permutação bilateral por pares** e aplica a **correção de Holm** aos três confrontos.

## Como executar e consultar a coleta

Em **Torneio**, selecione **Piloto** e clique em **Iniciar bloco**. Ao concluir, confira o relatório e exporte os arquivos. Depois execute os demais blocos, um de cada vez, no mesmo computador e navegador. Mantenha a aba visível durante a execução.

- **JSON de progresso** guarda as partidas concluídas. Use **Carregar progresso JSON** para retomar a coleta ou exibir as tabelas e gráficos na apresentação.
- **CSV das partidas** contém os resultados individuais. O **Resumo CSV** reúne as métricas por confronto e cenário.
- **JSONL** registra o histórico detalhado das partidas. O torneio principal também oferece um CSV com os valores-p.

Se precisar interromper, clique em **Pausar** e baixe o JSON de progresso. Ao retomar, a partida interrompida começa de novo e as partidas concluídas são preservadas.
