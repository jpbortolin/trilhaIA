# Trabalhos relacionados — slide 5

Cada referência responde a duas perguntas. O que os autores fizeram? Onde isso aparece no nosso projeto? A segunda resposta é nossa interpretação da relação com a Trilha.

## 1. Ralph Gasser (1996) — *Solving Nine Men’s Morris*

- **Pergunta.** Qual é o resultado a partir do tabuleiro vazio se os dois jogadores sempre fizerem as melhores jogadas?
- **Método.** Calculou posições de meio e fim de jogo de trás para frente, começando por resultados conhecidos. Guardou os valores em tabelas de cerca de dez bilhões de estados. Em seguida, buscou os 18 turnos de colocação com alfa-beta e consultou essas tabelas nas posições alcançadas.
- **Conclusão.** Na variante estudada, o tabuleiro vazio resulta em empate sob jogo perfeito. Erros ainda podem levar a vitórias e derrotas.
- **No projeto.** Uma base de finais guarda o resultado já calculado de posições. Um livro de abertura guarda recomendações para as primeiras jogadas. Nossos agentes calculam a decisão durante o turno, sem consultar esses arquivos. Medimos o que conseguem descobrir com tempo limitado.
- **Para a fala.** “Gasser calculou o que acontece com jogo perfeito. Nós comparamos três formas de decidir em poucos milissegundos.”

[Artigo na Wiley](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1467-8640.1996.tb00251.x) · [Versão integral em Games of No Chance](https://www.cs.brandeis.edu/~storer/JimPuzzles/GAMES/NineMensMorris/INFO/GasserArticle.pdf)

## 2. Cameron Browne e coautores (2012) — *A Survey of Monte Carlo Tree Search Methods*

- **Pergunta.** Como funciona o MCTS e quais versões e aplicações já tinham sido estudadas?
- **Método.** A revisão organiza a literatura da época. Explica seleção, expansão, simulação e atualização dos nós visitados. Discute escolhas como jogar ao acaso na simulação e como escolher a jogada final.
- **Conclusão.** MCTS é uma família de métodos. Escolher o filho mais visitado e escolher a maior recompensa média são duas regras possíveis.
- **No projeto.** Seguimos o ciclo de quatro etapas. Escolhemos o filho mais visitado na raiz, com média como primeiro desempate. MCTS e Monte Carlo plano compartilham a simulação aleatória.
- **Para a fala.** “Essa revisão explica de quais etapas o MCTS é feito e quais escolhas precisamos definir para implementá-lo.”

[Artigo integral do IEEE](https://ics.uci.edu/~dechter/courses/ics-295/fall-2019/papers/mcts-survey.pdf)

## 3. Donald Knuth e Ronald Moore (1975) — *An Analysis of Alpha-Beta Pruning*

- **Pergunta.** Quando dá para ignorar continuações e ainda obter o mesmo valor do Minimax? Quanto trabalho isso economiza?
- **Método.** Os autores formalizaram a árvore de jogo, explicaram como alfa e beta permitem cortar ramos, provaram a correção do procedimento e analisaram seu custo.
- **Conclusão.** A poda mantém o valor que o Minimax obteria na mesma árvore. A ordem das visitas muda o volume de trabalho. Exemplo nosso: se uma jogada garante 5 pontos e o adversário pode reduzir outra a 3, já temos informação suficiente para descartar a segunda.
- **No projeto.** Usamos alfa-beta e visitamos primeiro posições promissoras segundo a avaliação local. A qualidade da decisão também depende da profundidade e da avaliação de posições ainda abertas.
- **Para a fala.** “Os autores mostraram quando o programa pode pular parte da árvore com segurança.”

[Artigo integral de Artificial Intelligence](https://webdocs.cs.ualberta.ca/~mmueller/courses/657-Fall2025/readings/1975-AIJ-Knuth-Moore-alphabeta.pdf)

## 4. Levente Kocsis e Csaba Szepesvári (2006) — *Bandit Based Monte-Carlo Planning*

- **Pergunta.** Como gastar as simulações quando existem muitas alternativas?
- **Método.** Propuseram o UCT. A seleção em cada nó combina desempenho observado e bônus para opções pouco testadas. Analisaram a teoria sob condições definidas e testaram árvores artificiais de jogo e navegação à vela com vento variável.
- **Conclusão.** O método direciona as amostras conforme acumula informação e apresentou resultados favoráveis nos problemas testados.
- **No projeto.** Usamos UCT para decidir qual ramo visitar. O nosso torneio mede seu comportamento na Trilha frente aos outros agentes.
- **Para a fala.** “Esse artigo explica como decidimos qual ramo recebe a próxima simulação.”

[Artigo integral da ECML](https://aima.cs.berkeley.edu/~russell/classes/cs294/s11/readings/Kocsis%2BSzepesvari%3A2006.pdf)

## 5. Maciej Świechowski e coautores (2023) — *Monte Carlo Tree Search: a review of recent modifications and applications*

- **Pergunta.** Como pesquisadores adaptaram o MCTS a problemas difíceis desde a revisão de 2012?
- **Método.** Revisaram alterações nas simulações, ajustes automáticos e combinações com outros métodos, incluindo aprendizado de máquina. Discutiram aplicações em jogos, planejamento e logística.
- **Conclusão.** A utilidade da adaptação depende do problema e dos recursos disponíveis.
- **No projeto.** Definimos uma versão de referência e mudamos um parâmetro por vez. Assim podemos observar, por exemplo, o efeito de reduzir o bônus de exploração ou o tamanho da simulação. São escolhas do nosso experimento.
- **Para a fala.** “A revisão mostra o que pode variar. Nosso experimento muda um fator de cada vez.”

[Artigo integral na Springer](https://link.springer.com/article/10.1007/s10462-022-10228-y)

O [Rustc Book](https://doc.rust-lang.org/rustc/platform-support/wasm32-unknown-unknown.html), citado no slide final, é documentação da ferramenta. Ele descreve o alvo WebAssembly usado para executar a busca Rust a partir do navegador.
