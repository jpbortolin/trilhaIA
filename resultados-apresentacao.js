"use strict";

(() => {
  const resultados = {
  "principal": [
    {
      "cenario": "principal",
      "posicao": "vazio",
      "confronto": "MCTS × Minimax",
      "pares": 100,
      "partidas": 200,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 13,
          "empates": 10,
          "derrotas": 177,
          "pontuacao": 0.09,
          "ic": [
            0.0575,
            0.1275
          ],
          "tempo": 100.06954221301615,
          "simulacoes": 1412.6853002070393
        },
        {
          "agente": "minimax",
          "vitorias": 177,
          "empates": 10,
          "derrotas": 13,
          "pontuacao": 0.91,
          "ic": [
            0.8725,
            0.9425
          ],
          "tempo": 90.01369275885641,
          "simulacoes": 0
        }
      ]
    },
    {
      "cenario": "principal",
      "posicao": "vazio",
      "confronto": "MCTS × Monte Carlo",
      "pares": 100,
      "partidas": 200,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 125,
          "empates": 0,
          "derrotas": 75,
          "pontuacao": 0.625,
          "ic": [
            0.555,
            0.695
          ],
          "tempo": 100.06572580645837,
          "simulacoes": 1439.5559475806451
        },
        {
          "agente": "monteCarlo",
          "vitorias": 75,
          "empates": 0,
          "derrotas": 125,
          "pontuacao": 0.375,
          "ic": [
            0.30500000000000005,
            0.44499999999999995
          ],
          "tempo": 100.00672077098892,
          "simulacoes": 1496.0502155718996
        }
      ]
    },
    {
      "cenario": "principal",
      "posicao": "vazio",
      "confronto": "Minimax × Monte Carlo",
      "pares": 100,
      "partidas": 200,
      "lados": [
        {
          "agente": "minimax",
          "vitorias": 187,
          "empates": 7,
          "derrotas": 6,
          "pontuacao": 0.9525,
          "ic": [
            0.925,
            0.9775
          ],
          "tempo": 89.00621398145964,
          "simulacoes": 0
        },
        {
          "agente": "monteCarlo",
          "vitorias": 6,
          "empates": 7,
          "derrotas": 187,
          "pontuacao": 0.04749999999999999,
          "ic": [
            0.022499999999999964,
            0.07499999999999996
          ],
          "tempo": 100.00669745958467,
          "simulacoes": 1505.0120605594047
        }
      ]
    }
  ],
  "fixo": [
    {
      "cenario": "fixo",
      "posicao": "vazio",
      "confronto": "MCTS × Minimax",
      "pares": 100,
      "partidas": 200,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 13,
          "empates": 24,
          "derrotas": 163,
          "pontuacao": 0.125,
          "ic": [
            0.085,
            0.17
          ],
          "tempo": 77.63557007126424,
          "simulacoes": 1000
        },
        {
          "agente": "minimax",
          "vitorias": 163,
          "empates": 24,
          "derrotas": 13,
          "pontuacao": 0.875,
          "ic": [
            0.83,
            0.915
          ],
          "tempo": 7.319735305567782,
          "simulacoes": 0
        }
      ]
    },
    {
      "cenario": "fixo",
      "posicao": "vazio",
      "confronto": "MCTS × Monte Carlo",
      "pares": 100,
      "partidas": 200,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 131,
          "empates": 1,
          "derrotas": 68,
          "pontuacao": 0.6575,
          "ic": [
            0.5875,
            0.725
          ],
          "tempo": 77.7447988223851,
          "simulacoes": 1000
        },
        {
          "agente": "monteCarlo",
          "vitorias": 68,
          "empates": 1,
          "derrotas": 131,
          "pontuacao": 0.3425,
          "ic": [
            0.275,
            0.4125
          ],
          "tempo": 72.46609792283667,
          "simulacoes": 1000
        }
      ]
    },
    {
      "cenario": "fixo",
      "posicao": "vazio",
      "confronto": "Minimax × Monte Carlo",
      "pares": 100,
      "partidas": 200,
      "lados": [
        {
          "agente": "minimax",
          "vitorias": 177,
          "empates": 18,
          "derrotas": 5,
          "pontuacao": 0.93,
          "ic": [
            0.9025,
            0.9575
          ],
          "tempo": 6.782207763024675,
          "simulacoes": 0
        },
        {
          "agente": "monteCarlo",
          "vitorias": 5,
          "empates": 18,
          "derrotas": 177,
          "pontuacao": 0.06999999999999995,
          "ic": [
            0.04249999999999998,
            0.09750000000000003
          ],
          "tempo": 71.9748567499021,
          "simulacoes": 1000
        }
      ]
    }
  ],
  "ablacoes": [
    {
      "cenario": "ablacao-base",
      "posicao": "vazio",
      "confronto": "MCTS × Minimax",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 4,
          "empates": 5,
          "derrotas": 31,
          "pontuacao": 0.1625,
          "ic": [
            0.075,
            0.275
          ],
          "tempo": 76.41306765524428,
          "simulacoes": 1000
        },
        {
          "agente": "minimax",
          "vitorias": 31,
          "empates": 5,
          "derrotas": 4,
          "pontuacao": 0.8375,
          "ic": [
            0.725,
            0.925
          ],
          "tempo": 7.6604566209834735,
          "simulacoes": 0
        }
      ]
    },
    {
      "cenario": "ablacao-base",
      "posicao": "vazio",
      "confronto": "MCTS × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 27,
          "empates": 0,
          "derrotas": 13,
          "pontuacao": 0.675,
          "ic": [
            0.525,
            0.825
          ],
          "tempo": 76.83192848018817,
          "simulacoes": 1000
        },
        {
          "agente": "monteCarlo",
          "vitorias": 13,
          "empates": 0,
          "derrotas": 27,
          "pontuacao": 0.32499999999999996,
          "ic": [
            0.17500000000000004,
            0.475
          ],
          "tempo": 72.11881443302474,
          "simulacoes": 1000
        }
      ]
    },
    {
      "cenario": "ablacao-base",
      "posicao": "vazio",
      "confronto": "Minimax × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "minimax",
          "vitorias": 30,
          "empates": 10,
          "derrotas": 0,
          "pontuacao": 0.875,
          "ic": [
            0.8125,
            0.9375
          ],
          "tempo": 7.19788732395603,
          "simulacoes": 0
        },
        {
          "agente": "monteCarlo",
          "vitorias": 0,
          "empates": 10,
          "derrotas": 30,
          "pontuacao": 0.125,
          "ic": [
            0.0625,
            0.1875
          ],
          "tempo": 74.33367556470468,
          "simulacoes": 1000
        }
      ]
    },
    {
      "cenario": "ablacao-exploracao",
      "posicao": "vazio",
      "confronto": "MCTS × Minimax",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 1,
          "empates": 7,
          "derrotas": 32,
          "pontuacao": 0.1125,
          "ic": [
            0.0375,
            0.2
          ],
          "tempo": 84.10097173150207,
          "simulacoes": 1000
        },
        {
          "agente": "minimax",
          "vitorias": 32,
          "empates": 7,
          "derrotas": 1,
          "pontuacao": 0.8875,
          "ic": [
            0.8,
            0.9625
          ],
          "tempo": 7.245351867978465,
          "simulacoes": 0
        }
      ]
    },
    {
      "cenario": "ablacao-exploracao",
      "posicao": "vazio",
      "confronto": "MCTS × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 28,
          "empates": 1,
          "derrotas": 11,
          "pontuacao": 0.7125,
          "ic": [
            0.55,
            0.8625
          ],
          "tempo": 76.13641092326536,
          "simulacoes": 1000
        },
        {
          "agente": "monteCarlo",
          "vitorias": 11,
          "empates": 1,
          "derrotas": 28,
          "pontuacao": 0.2875,
          "ic": [
            0.13749999999999996,
            0.44999999999999996
          ],
          "tempo": 71.3517105262898,
          "simulacoes": 1000
        }
      ]
    },
    {
      "cenario": "ablacao-exploracao",
      "posicao": "vazio",
      "confronto": "Minimax × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "minimax",
          "vitorias": 30,
          "empates": 10,
          "derrotas": 0,
          "pontuacao": 0.875,
          "ic": [
            0.8125,
            0.9375
          ],
          "tempo": 7.297384305862743,
          "simulacoes": 0
        },
        {
          "agente": "monteCarlo",
          "vitorias": 0,
          "empates": 10,
          "derrotas": 30,
          "pontuacao": 0.125,
          "ic": [
            0.0625,
            0.1875
          ],
          "tempo": 74.51242299800934,
          "simulacoes": 1000
        }
      ]
    },
    {
      "cenario": "ablacao-horizonte",
      "posicao": "vazio",
      "confronto": "MCTS × Minimax",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 0,
          "empates": 1,
          "derrotas": 39,
          "pontuacao": 0.0125,
          "ic": [
            0,
            0.0375
          ],
          "tempo": 49.0040243902221,
          "simulacoes": 1000
        },
        {
          "agente": "minimax",
          "vitorias": 39,
          "empates": 1,
          "derrotas": 0,
          "pontuacao": 0.9875,
          "ic": [
            0.9625,
            1
          ],
          "tempo": 4.190476190434059,
          "simulacoes": 0
        }
      ]
    },
    {
      "cenario": "ablacao-horizonte",
      "posicao": "vazio",
      "confronto": "MCTS × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 27,
          "empates": 0,
          "derrotas": 13,
          "pontuacao": 0.675,
          "ic": [
            0.5,
            0.85
          ],
          "tempo": 53.47077114431568,
          "simulacoes": 1000
        },
        {
          "agente": "monteCarlo",
          "vitorias": 13,
          "empates": 0,
          "derrotas": 27,
          "pontuacao": 0.32499999999999996,
          "ic": [
            0.15000000000000002,
            0.5
          ],
          "tempo": 48.03513174410325,
          "simulacoes": 1000
        }
      ]
    },
    {
      "cenario": "ablacao-horizonte",
      "posicao": "vazio",
      "confronto": "Minimax × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "minimax",
          "vitorias": 39,
          "empates": 1,
          "derrotas": 0,
          "pontuacao": 0.9875,
          "ic": [
            0.9625,
            1
          ],
          "tempo": 4.093662864326751,
          "simulacoes": 0
        },
        {
          "agente": "monteCarlo",
          "vitorias": 0,
          "empates": 1,
          "derrotas": 39,
          "pontuacao": 0.012499999999999956,
          "ic": [
            0,
            0.03749999999999998
          ],
          "tempo": 44.48558441556313,
          "simulacoes": 1000
        }
      ]
    },
    {
      "cenario": "ablacao-iteracoes",
      "posicao": "vazio",
      "confronto": "MCTS × Minimax",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 1,
          "empates": 3,
          "derrotas": 36,
          "pontuacao": 0.0625,
          "ic": [
            0,
            0.1375
          ],
          "tempo": 37.23081023456739,
          "simulacoes": 500
        },
        {
          "agente": "minimax",
          "vitorias": 36,
          "empates": 3,
          "derrotas": 1,
          "pontuacao": 0.9375,
          "ic": [
            0.8625,
            1
          ],
          "tempo": 6.189644351508079,
          "simulacoes": 0
        }
      ]
    },
    {
      "cenario": "ablacao-iteracoes",
      "posicao": "vazio",
      "confronto": "MCTS × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 18,
          "empates": 0,
          "derrotas": 22,
          "pontuacao": 0.45,
          "ic": [
            0.275,
            0.625
          ],
          "tempo": 40.335524652329866,
          "simulacoes": 500
        },
        {
          "agente": "monteCarlo",
          "vitorias": 22,
          "empates": 0,
          "derrotas": 18,
          "pontuacao": 0.55,
          "ic": [
            0.375,
            0.725
          ],
          "tempo": 75.38764186638019,
          "simulacoes": 1000
        }
      ]
    },
    {
      "cenario": "ablacao-iteracoes",
      "posicao": "vazio",
      "confronto": "Minimax × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "minimax",
          "vitorias": 30,
          "empates": 10,
          "derrotas": 0,
          "pontuacao": 0.875,
          "ic": [
            0.8125,
            0.9375
          ],
          "tempo": 7.21277665990729,
          "simulacoes": 0
        },
        {
          "agente": "monteCarlo",
          "vitorias": 0,
          "empates": 10,
          "derrotas": 30,
          "pontuacao": 0.125,
          "ic": [
            0.0625,
            0.1875
          ],
          "tempo": 74.2853182751257,
          "simulacoes": 1000
        }
      ]
    },
    {
      "cenario": "ablacao-profundidade",
      "posicao": "vazio",
      "confronto": "MCTS × Minimax",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 1,
          "empates": 0,
          "derrotas": 39,
          "pontuacao": 0.025,
          "ic": [
            0,
            0.075
          ],
          "tempo": 84.38241852484771,
          "simulacoes": 1000
        },
        {
          "agente": "minimax",
          "vitorias": 39,
          "empates": 0,
          "derrotas": 1,
          "pontuacao": 0.975,
          "ic": [
            0.925,
            1
          ],
          "tempo": 1.8972151898240615,
          "simulacoes": 0
        }
      ]
    },
    {
      "cenario": "ablacao-profundidade",
      "posicao": "vazio",
      "confronto": "MCTS × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 27,
          "empates": 0,
          "derrotas": 13,
          "pontuacao": 0.675,
          "ic": [
            0.5,
            0.825
          ],
          "tempo": 77.05581098345571,
          "simulacoes": 1000
        },
        {
          "agente": "monteCarlo",
          "vitorias": 13,
          "empates": 0,
          "derrotas": 27,
          "pontuacao": 0.32499999999999996,
          "ic": [
            0.17500000000000004,
            0.5
          ],
          "tempo": 72.35489690727458,
          "simulacoes": 1000
        }
      ]
    },
    {
      "cenario": "ablacao-profundidade",
      "posicao": "vazio",
      "confronto": "Minimax × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "minimax",
          "vitorias": 36,
          "empates": 1,
          "derrotas": 3,
          "pontuacao": 0.9125,
          "ic": [
            0.825,
            0.9875
          ],
          "tempo": 1.7084158415288324,
          "simulacoes": 0
        },
        {
          "agente": "monteCarlo",
          "vitorias": 3,
          "empates": 1,
          "derrotas": 36,
          "pontuacao": 0.08750000000000002,
          "ic": [
            0.012499999999999956,
            0.17500000000000004
          ],
          "tempo": 77.6868076535694,
          "simulacoes": 1000
        }
      ]
    }
  ],
  "posicoes": [
    {
      "cenario": "posicao-abertura",
      "posicao": "abertura",
      "confronto": "MCTS × Minimax",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 2,
          "empates": 5,
          "derrotas": 33,
          "pontuacao": 0.1125,
          "ic": [
            0.05,
            0.1875
          ],
          "tempo": 100.06823687749247,
          "simulacoes": 1528.9690444145356
        },
        {
          "agente": "minimax",
          "vitorias": 33,
          "empates": 5,
          "derrotas": 2,
          "pontuacao": 0.8875,
          "ic": [
            0.8125,
            0.95
          ],
          "tempo": 88.98961892247974,
          "simulacoes": 0
        }
      ]
    },
    {
      "cenario": "posicao-abertura",
      "posicao": "abertura",
      "confronto": "MCTS × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 27,
          "empates": 0,
          "derrotas": 13,
          "pontuacao": 0.675,
          "ic": [
            0.55,
            0.8
          ],
          "tempo": 100.06626323749185,
          "simulacoes": 1557.712556732224
        },
        {
          "agente": "monteCarlo",
          "vitorias": 13,
          "empates": 0,
          "derrotas": 27,
          "pontuacao": 0.32499999999999996,
          "ic": [
            0.19999999999999996,
            0.44999999999999996
          ],
          "tempo": 100.00733944952819,
          "simulacoes": 1613.7935779816514
        }
      ]
    },
    {
      "cenario": "posicao-abertura",
      "posicao": "abertura",
      "confronto": "Minimax × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "minimax",
          "vitorias": 40,
          "empates": 0,
          "derrotas": 0,
          "pontuacao": 1,
          "ic": [
            1,
            1
          ],
          "tempo": 84.8650582362704,
          "simulacoes": 0
        },
        {
          "agente": "monteCarlo",
          "vitorias": 0,
          "empates": 0,
          "derrotas": 40,
          "pontuacao": 0,
          "ic": [
            0,
            0
          ],
          "tempo": 100.00688468158668,
          "simulacoes": 1611.2839931153185
        }
      ]
    },
    {
      "cenario": "posicao-final",
      "posicao": "final",
      "confronto": "MCTS × Minimax",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 0,
          "empates": 20,
          "derrotas": 20,
          "pontuacao": 0.25,
          "ic": [
            0.25,
            0.25
          ],
          "tempo": 100.02731591446276,
          "simulacoes": 1081.9263657957245
        },
        {
          "agente": "minimax",
          "vitorias": 20,
          "empates": 20,
          "derrotas": 0,
          "pontuacao": 0.75,
          "ic": [
            0.75,
            0.75
          ],
          "tempo": 95.46045454544523,
          "simulacoes": 0
        }
      ]
    },
    {
      "cenario": "posicao-final",
      "posicao": "final",
      "confronto": "MCTS × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 20,
          "empates": 0,
          "derrotas": 20,
          "pontuacao": 0.5,
          "ic": [
            0.5,
            0.5
          ],
          "tempo": 100.01249999999224,
          "simulacoes": 893.8958333333334
        },
        {
          "agente": "monteCarlo",
          "vitorias": 20,
          "empates": 0,
          "derrotas": 20,
          "pontuacao": 0.5,
          "ic": [
            0.5,
            0.5
          ],
          "tempo": 100.01249999999224,
          "simulacoes": 867.6875
        }
      ]
    },
    {
      "cenario": "posicao-final",
      "posicao": "final",
      "confronto": "Minimax × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "minimax",
          "vitorias": 20,
          "empates": 20,
          "derrotas": 0,
          "pontuacao": 0.75,
          "ic": [
            0.75,
            0.75
          ],
          "tempo": 96.20323193917129,
          "simulacoes": 0
        },
        {
          "agente": "monteCarlo",
          "vitorias": 0,
          "empates": 20,
          "derrotas": 20,
          "pontuacao": 0.25,
          "ic": [
            0.25,
            0.25
          ],
          "tempo": 100.00256410256557,
          "simulacoes": 1164.027613412229
        }
      ]
    },
    {
      "cenario": "posicao-meio",
      "posicao": "meio",
      "confronto": "MCTS × Minimax",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 0,
          "empates": 19,
          "derrotas": 21,
          "pontuacao": 0.2375,
          "ic": [
            0.2125,
            0.25
          ],
          "tempo": 100.06750418765898,
          "simulacoes": 1409.286432160804
        },
        {
          "agente": "minimax",
          "vitorias": 21,
          "empates": 19,
          "derrotas": 0,
          "pontuacao": 0.7625,
          "ic": [
            0.75,
            0.7875
          ],
          "tempo": 95.53419773095564,
          "simulacoes": 0
        }
      ]
    },
    {
      "cenario": "posicao-meio",
      "posicao": "meio",
      "confronto": "MCTS × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 21,
          "empates": 0,
          "derrotas": 19,
          "pontuacao": 0.525,
          "ic": [
            0.5,
            0.575
          ],
          "tempo": 100.08717948724741,
          "simulacoes": 2059.7008547008545
        },
        {
          "agente": "monteCarlo",
          "vitorias": 19,
          "empates": 0,
          "derrotas": 21,
          "pontuacao": 0.475,
          "ic": [
            0.42500000000000004,
            0.5
          ],
          "tempo": 100.00885714285607,
          "simulacoes": 2013.6542857142856
        }
      ]
    },
    {
      "cenario": "posicao-meio",
      "posicao": "meio",
      "confronto": "Minimax × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "minimax",
          "vitorias": 20,
          "empates": 20,
          "derrotas": 0,
          "pontuacao": 0.75,
          "ic": [
            0.75,
            0.75
          ],
          "tempo": 96.17713004484305,
          "simulacoes": 0
        },
        {
          "agente": "monteCarlo",
          "vitorias": 0,
          "empates": 20,
          "derrotas": 20,
          "pontuacao": 0.25,
          "ic": [
            0.25,
            0.25
          ],
          "tempo": 100.00554699538554,
          "simulacoes": 1417.5639445300462
        }
      ]
    },
    {
      "cenario": "posicao-vazio",
      "posicao": "vazio",
      "confronto": "MCTS × Minimax",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 2,
          "empates": 4,
          "derrotas": 34,
          "pontuacao": 0.1,
          "ic": [
            0.025,
            0.1875
          ],
          "tempo": 100.06095979251596,
          "simulacoes": 1445.9792477302205
        },
        {
          "agente": "minimax",
          "vitorias": 34,
          "empates": 4,
          "derrotas": 2,
          "pontuacao": 0.9,
          "ic": [
            0.8125,
            0.975
          ],
          "tempo": 88.38770595691739,
          "simulacoes": 0
        }
      ]
    },
    {
      "cenario": "posicao-vazio",
      "posicao": "vazio",
      "confronto": "MCTS × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "mcts",
          "vitorias": 27,
          "empates": 0,
          "derrotas": 13,
          "pontuacao": 0.675,
          "ic": [
            0.525,
            0.825
          ],
          "tempo": 100.0641532756471,
          "simulacoes": 1472.938195302843
        },
        {
          "agente": "monteCarlo",
          "vitorias": 13,
          "empates": 0,
          "derrotas": 27,
          "pontuacao": 0.32499999999999996,
          "ic": [
            0.17500000000000004,
            0.475
          ],
          "tempo": 100.01047381546414,
          "simulacoes": 1552.850374064838
        }
      ]
    },
    {
      "cenario": "posicao-vazio",
      "posicao": "vazio",
      "confronto": "Minimax × Monte Carlo",
      "pares": 20,
      "partidas": 40,
      "lados": [
        {
          "agente": "minimax",
          "vitorias": 38,
          "empates": 1,
          "derrotas": 1,
          "pontuacao": 0.9625,
          "ic": [
            0.9,
            1
          ],
          "tempo": 89.32792452832437,
          "simulacoes": 0
        },
        {
          "agente": "monteCarlo",
          "vitorias": 1,
          "empates": 1,
          "derrotas": 38,
          "pontuacao": 0.03749999999999998,
          "ic": [
            0,
            0.09999999999999998
          ],
          "tempo": 100.01108247424553,
          "simulacoes": 1530.9536082474226
        }
      ]
    }
  ],
  "estatistica": [
    {
      "confronto": "MCTS × Minimax",
      "p": 2.5849394142282115e-26,
      "ajustado": 5.169878828456423e-26,
      "significativo": true
    },
    {
      "confronto": "MCTS × Monte Carlo",
      "p": 0.0010158471941252856,
      "ajustado": 0.0010158471941252856,
      "significativo": true
    },
    {
      "confronto": "Minimax × Monte Carlo",
      "p": 1.0097419586828951e-28,
      "ajustado": 3.0292258760486853e-28,
      "significativo": true
    }
  ]
};
  const nomes = { minimax: "Minimax", mcts: "MCTS", monteCarlo: "Monte Carlo plano" };
  const comparacoes = [["minimax", "mcts"], ["minimax", "monteCarlo"], ["mcts", "monteCarlo"]];
  const numero = (valor, casas = 1) => valor.toLocaleString("pt-BR", {
    minimumFractionDigits: casas, maximumFractionDigits: casas
  });
  const percentual = valor => numero(valor * 100) + "%";

  function obter(bloco, cenario, agente, adversario) {
    const grupo = resultados[bloco].find(item => item.cenario === cenario &&
      item.lados.some(lado => lado.agente === agente) &&
      item.lados.some(lado => lado.agente === adversario));
    return grupo.lados.find(lado => lado.agente === agente);
  }

  function grafico(lado) {
    const x = valor => 10 + valor * 250;
    const intervalo = lado.ic.map(percentual).join(" a ");
    return '<svg viewBox="0 0 270 54" role="img" aria-label="Pontuação ' + percentual(lado.pontuacao) +
      '; intervalo de confiança de 95%: ' + intervalo + '">' +
      '<line x1="10" y1="19" x2="260" y2="19" stroke="#d9ddd2" stroke-width="7" stroke-linecap="round"/>' +
      '<line x1="135" y1="7" x2="135" y2="29" stroke="#839486" stroke-dasharray="3 3"/>' +
      '<line x1="' + x(lado.ic[0]) + '" y1="19" x2="' + x(lado.ic[1]) +
      '" y2="19" stroke="currentColor" stroke-width="3"/>' +
      lado.ic.map(valor => '<line x1="' + x(valor) + '" y1="13" x2="' + x(valor) +
        '" y2="25" stroke="currentColor" stroke-width="2"/>').join("") +
      '<circle cx="' + x(lado.pontuacao) + '" cy="19" r="5" fill="currentColor"/>' +
      '<g fill="#5f7067" font-family="Arial, sans-serif" font-size="12">' +
      '<text x="10" y="48">0%</text><text x="135" y="48" text-anchor="middle">50%</text>' +
      '<text x="260" y="48" text-anchor="end">100%</text></g></svg>';
  }

  function placares(bloco) {
    document.getElementById("placares-" + bloco).innerHTML = comparacoes.map(([agente, adversario]) => {
      const lado = obter(bloco, bloco, agente, adversario);
      const cor = agente === "minimax" ? "var(--azul)" : "var(--verde)";
      return '<article class="placar" style="--cor-agente:' + cor + ';color:' + cor + '">' +
        '<h3>' + nomes[agente] + '<small>contra ' + nomes[adversario] + '</small></h3>' +
        '<strong class="pontos">' + percentual(lado.pontuacao) + '</strong>' +
        grafico(lado) +
        '<p class="intervalo">IC 95%: ' + lado.ic.map(percentual).join(" a ") + '</p>' +
        '<div class="contagem-ved"><div><b>' + lado.vitorias + '</b>vitórias</div>' +
        '<div><b>' + lado.empates + '</b>empates</div><div><b>' + lado.derrotas +
        '</b>derrotas</div></div></article>';
    }).join("");
  }

  function cabecalho() {
    return '<thead><tr><th>Condição</th>' +
      comparacoes.map(([agente, adversario]) =>
        '<th><strong>' + nomes[agente] + '</strong>× ' + nomes[adversario] + '</th>').join("") +
      '</tr></thead>';
  }

  function tabela(bloco, condicoes) {
    return '<table class="tabela-resultados" aria-label="Pontuação do agente destacado em cada coluna">' +
      cabecalho() + '<tbody>' + condicoes.map(([cenario, rotulo, detalhe]) =>
        '<tr' + (cenario === "ablacao-base" ? ' class="referencia"' : "") + '><td>' + rotulo +
        (detalhe ? '<span class="subrotulo">' + detalhe + '</span>' : "") + '</td>' +
        comparacoes.map(([agente, adversario]) =>
          '<td>' + percentual(obter(bloco, cenario, agente, adversario).pontuacao) + '</td>').join("") +
        '</tr>').join("") + '</tbody></table>';
  }

  function testes() {
    document.getElementById("testes-principal").innerHTML = comparacoes.map(([agente, adversario]) => {
      const teste = resultados.estatistica.find(item =>
        item.confronto === resultados.principal.find(grupo =>
          grupo.lados.some(lado => lado.agente === agente) &&
          grupo.lados.some(lado => lado.agente === adversario)).confronto);
      const [mantissa, expoente] = teste.ajustado.toExponential(2).split("e");
      return '<div class="cartao"><span class="rotulo">' + nomes[agente] + ' × ' + nomes[adversario] +
        '</span><span class="resultado-teste">' + mantissa.replace(".", ",") + ' × 10<sup>' +
        expoente.replace("-", "−") + '</sup></span><p>Valor-p após Holm.<br>Diferença detectada a 5%.</p></div>';
    }).join("");
  }

  function faixa(valores, casas = 2) {
    const menor = numero(Math.min(...valores), casas);
    const maior = numero(Math.max(...valores), casas);
    return menor === maior ? menor : menor + "–" + maior;
  }

  function custos() {
    const linhas = ["minimax", "mcts", "monteCarlo"].map(agente => {
      const principal = resultados.principal.flatMap(grupo => grupo.lados).filter(lado => lado.agente === agente);
      const fixo = resultados.fixo.flatMap(grupo => grupo.lados).filter(lado => lado.agente === agente);
      return '<tr><td><strong>' + nomes[agente] + '</strong></td><td>' +
        faixa(principal.map(lado => lado.tempo)) + '</td><td>' +
        faixa(fixo.map(lado => lado.tempo)) + '</td><td>' +
        (agente === "minimax" ? '—' : faixa(principal.map(lado => lado.simulacoes), 0)) + '</td></tr>';
    }).join("");
    document.getElementById("tabela-custos").innerHTML =
      '<table class="tabela-resultados custos"><thead><tr><th>Agente</th>' +
      '<th><strong>Principal</strong>ms por decisão</th><th><strong>Esforço fixo</strong>ms por decisão</th>' +
      '<th><strong>Simulações</strong>por decisão no principal</th></tr></thead><tbody>' + linhas + '</tbody></table>';
  }

  placares("principal");
  placares("fixo");
  document.getElementById("tabela-ablacoes").innerHTML = tabela("ablacoes", [
    ["ablacao-base", "Referência", "MCTS 1.000 · Minimax 4 · c = √2 · horizonte 80"],
    ["ablacao-iteracoes", "MCTS: 500 iterações"],
    ["ablacao-profundidade", "Minimax: profundidade 3"],
    ["ablacao-exploracao", "Exploração: c = 1"],
    ["ablacao-horizonte", "Horizonte: 40 turnos"]
  ]);
  document.getElementById("tabela-posicoes").innerHTML = tabela("posicoes", [
    ["posicao-vazio", "Vazio", "9 peças na reserva por lado"],
    ["posicao-abertura", "Abertura", "8 ações sorteadas, com histórico preservado"],
    ["posicao-meio", "Meio-jogo", "6 peças por lado, sem reservas"],
    ["posicao-final", "Final", "3 contra 4 peças, sem reservas"]
  ]);
  testes();
  custos();
})();
