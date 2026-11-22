# O que foi registrado e como ler a análise — slides 11 a 13

## Slide 11 — o que é salvo

Cada registro detalhado corresponde a **uma partida concluída**. O JSON de progresso guarda os registros dentro de uma sessão. O JSONL escreve um objeto por linha. O CSV de partidas guarda as informações e métricas agregadas em uma linha por partida. O CSV de resumo é outro arquivo, com uma linha por agente e confronto em cada cenário.

| Palavra do slide | Campos e conteúdo |
| --- | --- |
| Estados | **chaveInicial** codifica as 24 casas com 0 (vazia), 1 ou 2 (peças), além do jogador da vez e das duas reservas. **posicao** é o cenário, vazio, abertura, meio ou final. **turnosIniciais** indica quantos turnos já ocorreram na posição usada. Os estados seguintes podem ser reconstruídos reaplicando as ações do JSON/JSONL. |
| Ações | **acoes** é a lista ordenada de jogadas reais no JSON/JSONL. Cada uma tem **origem** (nula ao colocar), **destino** e **remocao** (nula sem captura). Os campos de casa usam 0–23 no arquivo. As ações das simulações internas ficam resumidas em métricas. |
| Sementes | **semente** identifica a sequência usada pelo par e pela abertura sorteada. **sementeA** e **sementeB** determinam sequências pseudoaleatórias separadas por agente, reiniciadas na segunda partida. A semente base do plano é 2026. A quantidade de trabalho concluída em tempo fixo também depende da execução e do computador. |
| Configurações | **motor**, **versao**, **execucao**, **etapa**, **bloco**, **cenario**, **rotulo**, **ordem**, **posicao**, **agenteA**, **agenteB**, **confronto**, **par**, **perna**, **corA**, **quemComecou**, **limiteMs**, **iteracoesMcts**, **iteracoesMonteCarlo**, **profundidadeMinimax**, **exploracao** e **horizonte** identificam a implementação, o plano, o confronto e o esforço configurado. O JSON de progresso também guarda o ambiente do navegador. |
| Tempos | **medicoes**, no JSON/JSONL, guarda um vetor por jogada: tempo em ms, nós, simulações concluídas, simulações truncadas, profundidade e indicador de cobertura insuficiente. **tempoTotalA/B**, **tempoMedioA/B** e **acimaDoPrazoA/B** resumem o lado A ou B. A coleta mede a decisão do agente com o relógio do navegador, incluindo preparação e retorno da ação. |
| Desfecho | **resultado** é A, B ou empate. A e B representam os agentes do confronto. **corA** e **quemComecou** informam como eles foram atribuídos aos lados naquela partida. **turnos** conta as jogadas registradas desde o estado inicial do cenário. |
| Motivo | **motivo** registra menos de três peças, sem movimentos, terceira repetição, 100 turnos sem captura ou limite de 400 turnos. |
| Outras métricas | **jogadasA/B**, **nosA/B**, **simulacoesA/B**, **profundidadeMediaA/B**, **truncadasA/B** e **coberturaInsuficienteA/B** ajudam a entender quanto trabalho cada lado realizou. |

### Exemplo de leitura de um registro

Na chave inicial **000000000000000000000000:1:9:9**, todas as 24 casas estão vazias, o jogador 1 começa e os dois têm nove peças na reserva. Uma primeira ação como **{ "origem": null, "destino": 2, "remocao": null }** coloca uma peça na casa que a interface chama de **3**. Uma medição como **[12, 80, 79, 10, 3, 0]** quer dizer 12 ms, 80 nós, 79 simulações, 10 truncadas, profundidade 3 e nenhum aviso de cobertura insuficiente. São valores ilustrativos para explicar os campos.

### O que significa validar o registro

1. Conferimos se o arquivo tem os campos esperados e se cada partida pertence ao plano da sessão.
2. Reconstruímos a abertura quando necessário e conferimos a chave inicial. No JSON detalhado, reaplicamos a primeira ação, depois a segunda e assim por diante, sempre com as regras do motor. Mover uma peça adversária ou colocar numa casa ocupada provoca erro.
3. Ao fim, comparamos o vencedor e o motivo calculados com o que o arquivo diz. Também conferimos as medições individuais contra os totais. O CSV tem totais, então nele é possível conferir campos e consistência dos agregados, mas o replay exige o histórico detalhado.
4. A identidade de uma partida é cenário + agentes + par + partida dentro do par. Se a mesma identidade aparece duas vezes na mesma execução, há duplicação. Um empate vale no relatório. Voltar à mesma posição dentro de uma partida também é válido e pode produzir o empate por repetição.

**Para a fala:** “Conferimos se cada partida existe uma vez no plano e, com o JSON, repetimos as jogadas para verificar se o vencedor e o motivo batem. Depois agrupamos os registros em pares para analisar.”

## Slide 12 — por que fazer pares e mudar a posição inicial

Cada par tem duas partidas do mesmo confronto, com a mesma condição e semente. Na primeira, A começa. Na segunda, B começa. Assim, os dois podem jogar com a vantagem potencial de começar. Os números do slide são do plano completo, com os três algoritmos. Se a coleta usar apenas dois, haverá um confronto.

| Bloco | O que pergunta | Plano completo |
| --- | --- | ---: |
| Piloto | O procedimento de execução e exportação funciona? | 60 |
| Principal | Quem pontua mais no tabuleiro vazio com até 100 ms por decisão? | 600 avaliadas + 30 de aquecimento |
| Esforço fixo | O que acontece com 1.000 iterações de MCTS, profundidade 4 de Minimax e 1.000 simulações de Monte Carlo? | 600 |
| Ablações | O que muda quando variamos apenas um parâmetro da referência de esforço fixo? | 600 |
| Posições iniciais | O resultado muda entre vazio, abertura sorteada, meio-jogo e final, a 100 ms? | 480 |

A abertura é construída com oito ações legais sorteadas. Meio-jogo usa uma posição fixa de 6 contra 6. Final usa 3 contra 4 e pode envolver voo. No bloco de posições são 20 pares por cenário e confronto. Nas ablações, cada variante modifica iterações do MCTS, profundidade do Minimax, bônus de exploração ou horizonte das simulações. Contagens iguais de iterações e simulações não garantem o mesmo tempo.

## Slide 13 — avaliação desde o começo

### 1. Contar o que aconteceu

Veja um confronto do ponto de vista de A. A vitória vale 1 ponto, empate 0,5 e derrota 0. Se em quatro partidas A vence duas, empata uma e perde uma, suas taxas são 50% de vitória, 25% de empate e 25% de derrota. A pontuação média é (1 + 1 + 0,5 + 0) ÷ 4 = **0,625**. A taxa de vitória e a pontuação média medem coisas diferentes: a segunda também valoriza o empate. Em confronto direto, 0,5 significa pontuação equilibrada no conjunto analisado.

### 2. Usar o par como unidade

Imagine que A venceu uma partida e perdeu a outra no primeiro par. Ele obteve (1 + 0) ÷ 2 = 0,5. No segundo par venceu e empatou, obtendo (1 + 0,5) ÷ 2 = 0,75. A média dos dois pares é (0,5 + 0,75) ÷ 2 = **0,625**. Se só uma das duas partidas de um par foi concluída, o relatório espera a outra para incluí-lo. As partidas de aquecimento ficam fora das métricas.

### 3. Medir o custo

Tempo médio por jogada = soma dos tempos das decisões ÷ quantidade de jogadas do agente. Exemplo: uma partida soma 30 ms em 3 jogadas e outra 20 ms em 1 jogada. O total dá 50 ÷ 4 = **12,5 ms por jogada**.

Os nós do Minimax são posições processadas durante a busca. Os nós do MCTS são os da árvore construída, incluindo a raiz. O Monte Carlo plano conta amostras das ações iniciais. As contagens de nós ajudam a entender cada implementação. Para comparar custo diretamente entre algoritmos, use também o tempo. Uma simulação truncada atingiu o horizonte sem fim de partida. Ela está dentro do total de simulações concluídas pelo algoritmo e não muda o resultado da partida real.

### 4. Estimar a incerteza com bootstrap

Se repetíssemos o experimento com outros pares, poderíamos obter outra média. O **bootstrap** estima quanto os resultados podem variar usando os pares disponíveis. Com dois pares de notas 0,5 e 0,75, um sorteio com reposição pode pegar o primeiro duas vezes (média 0,5), um de cada (0,625) ou o segundo duas vezes (0,75). O relatório repete essa amostragem 10.000 vezes, sempre mantendo juntas as duas partidas de cada par sorteado. Ordena as médias e usa os percentis de 2,5% e 97,5% para o **intervalo de confiança de 95%**. Com apenas um par, o relatório deixa o intervalo em branco.

Na apresentação, diga “a média observada foi X, com intervalo de Y a Z”. O intervalo dá uma noção de precisão nas condições analisadas. Ele não é um intervalo em que caem 95% das partidas.

### 5. Perguntar se a diferença observada é incomum sob equilíbrio

O **teste de permutação bilateral por pares** parte de um cenário de referência em que o sentido da vantagem pode ser trocado dentro de cada par. O código soma +1 para vitória de A, −1 para derrota e 0 para empate em cada par. Com contribuições +2 e +1, a soma observada é +3. Ao trocar sinais independentemente, as somas possíveis são +3, +1, −1, −3. Duas das quatro têm magnitude pelo menos 3. O **valor-p bilateral** desse exemplo é 0,5. Bilateral significa que conta tanto uma vantagem grande para A quanto para B. O programa acumula a distribuição dessas somas para o conjunto real de pares.

Um valor-p pequeno indica que um desequilíbrio dessa magnitude seria incomum no cenário de referência do teste. Ele não é a chance de a hipótese estar certa. Um valor-p alto, por si só, também não prova igualdade.

### 6. Ajustar os testes com Holm

Se testarmos três confrontos, aumentam as oportunidades de encontrar uma diferença por sorte. Holm ordena os valores-p e começa pelo menor valor-p e aplica o ajuste mais exigente a ele. Exemplo: valores brutos 0,01, 0,03 e 0,04 viram 0,03, 0,06 e 0,06 após o ajuste. Com limite 0,05, só o primeiro passa. O teste é calculado quando o principal está completo para os confrontos selecionados. As ablações são exploratórias, usadas para descrever padrões e levantar perguntas.

**Para a fala:** “Contamos resultados e convertemos em pontos. Analisamos as duas partidas juntas para equilibrar quem começou. O intervalo mostra a precisão da média. No principal completo, o teste bilateral verifica se a diferença é incomum e Holm ajusta os testes para o número de confrontos.”
