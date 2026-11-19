# Os três agentes — slides 7 a 10

Imagine uma fotografia da partida: peças, reservas e quem joga. A **raiz** da busca é essa posição. Um **filho** é a posição após uma ação. Em cada filho há novas ações. Essas possibilidades formam uma árvore. Nos exercícios, A, B e C representam alternativas legais e as notas foram escolhidas para as contas à mão.

## Minimax com alfa-beta

Todas as notas são dadas do ponto de vista do agente que está decidindo. Ele procura a maior nota. Quando é a vez do adversário, assume que este escolhe a resposta que deixa **a menor nota para o agente**. Ao encontrar um resultado confirmado, usa +10.000 para vitória, −10.000 para derrota e 0 para empate. Se parar numa posição ainda aberta, estima a vantagem por peças, moinhos, ameaças e mobilidade. Essa estimativa é a **heurística**.

### Teste 1 — o adversário também escolhe

| Minha primeira ação | Notas das respostas adversárias | Pior para mim |
| --- | --- | ---: |
| A | 9 ou 1 | 1 |
| B | 5 ou 4 | 4 |

Leia de baixo para cima. Em A, o adversário escolhe 1. Em B, escolhe 4. Na raiz escolho o maior entre esses valores, **B**. A nota 9 de A depende de um erro do outro lado.

### Teste 2 — quando o algoritmo corta um ramo

1. A primeira opção, A, permite respostas de notas 5 e 7. A vale 5, então alfa na raiz fica 5.
2. Na opção B, examine a primeira resposta adversária. Ela vale 3. Beta nesse ramo passa a 3.
3. B pode garantir no máximo 3, porque o adversário já tem essa resposta. Como alfa ≥ beta, pule as outras respostas de B. A permanece a melhor. Uma eventual resposta de nota 9 em B continuaria sendo evitável pelo adversário.

**No tabuleiro.** As claras têm peças nas casas 1, 2 e 5, as escuras nas casas 9, 11 e 13, com reservas vazias. As claras voam de 5 para 3, fecham 1–2–3 e podem retirar a peça 9. As escuras ficam com duas peças, então a busca devolve +10.000 às claras. Voo e retirada são **uma ação** e gastam **um nível**. Profundidade 4 examina até quatro ações alternadas, por exemplo claras, escuras, claras, escuras. Com prazo, o agente reaproveita a última profundidade concluída.

## Monte Carlo plano

O agente simula partidas aleatórias para estimar a qualidade de cada jogada inicial. Atribui 1 para vitória, 0,5 para empate e 0 para derrota, do ponto de vista de quem está decidindo. Um limite de 80 turnos é usado na configuração padrão. Se o atingir com a partida aberta, a simulação é marcada como truncada e também recebe 0,5. A partida real continua.

### Teste 1 — calcular a média por opção

| Rodada | A | Soma de A | B | Soma de B |
| --- | --- | ---: | --- | ---: |
| 1 | Vitória | 1 | Empate | 0,5 |
| 2 | Derrota | 1 | Vitória | 1,5 |

As ações são embaralhadas a cada rodada. Depois de duas rodadas, A tem média 1 ÷ 2 = 0,50. B tem 1,5 ÷ 2 = 0,75. A decisão é **B**.

### Teste 2 — o relógio toca antes de testar tudo

| Ação | Amostras concluídas | Média observada |
| --- | ---: | ---: |
| A | 1 | 1 |
| B | 1 | 0,5 |
| C | 0 | — |

A cobertura é 2 ÷ 3. C pode ser boa, mas ficou sem amostra. O código registra cobertura insuficiente e sorteia entre todas as ações legais. A jogada real pode ser A, B ou C. Se a amostra de B tivesse atingido o limite de 80 turnos em posição ainda aberta, a nota também seria 0,5 e o contador de truncamentos aumentaria.

## MCTS com UCT

O MCTS também simula partidas. Ele guarda visitas e recompensas em uma árvore, inclusive para respostas posteriores à primeira jogada. As quatro etapas são seleção de um ramo já conhecido, expansão de uma ação pendente quando possível, simulação aleatória e **retropropagação**, que soma uma visita e a recompensa aos nós do caminho.

### Teste 1 — duas expansões e uma atualização

| Iteração | Filho criado | Recompensa | Raiz (visitas; soma) | A (visitas; soma) | B (visitas; soma) |
| --- | --- | ---: | --- | --- | --- |
| 1 | A | 0 | 1; 0 | 1; 0 | pendente |
| 2 | B | 1 | 2; 1 | 1; 0 | 1; 1 |

Se A e B forem os únicos filhos, ambos têm o mesmo bônus de exploração. A média maior leva a busca por B. Se a próxima simulação desse caminho empatar, B passa a 2 visitas e soma 1,5. A raiz passa a 3 visitas e soma 1,5.

### Teste 2 — onde pesquisar e o que jogar

Considere um nó com 20 visitas, na vez do agente. O UCT soma a média a √2 × √(ln(visitas do pai) ÷ visitas do filho).

| Filho | Visitas | Média | Bônus aproximado | UCT aproximado |
| --- | ---: | ---: | ---: | ---: |
| A | 16 | 0,75 | 0,612 | 1,362 |
| B | 4 | 0,50 | 1,224 | 1,724 |

Com mais orçamento, a próxima **busca** desce por B. Se o orçamento terminar nessa raiz, a **jogada real** é A, com 16 visitas. Em igualdade de visitas, o código compara a média e depois sorteia se houver novo empate. Num nó adversário, substitui a média por 1 − média para favorecer respostas boas para o adversário.

## Para dizer em voz alta

O Minimax procura respostas adversárias e estima as posições que ficaram abertas. O Monte Carlo plano compara médias de simulações das opções iniciais. O MCTS também simula, mas usa visitas e recompensas para guiar a busca nos vários níveis da árvore. Para observar as decisões, abra o [modo debug](../debug.html) e use **Próximo passo** nos dois lados.
