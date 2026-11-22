// As posições e a ordem das ações seguem o motor JavaScript.
const VIZINHOS: [&[usize]; 24] = [
    &[1, 7],
    &[0, 2, 9],
    &[1, 3],
    &[2, 4, 11],
    &[3, 5],
    &[4, 6, 13],
    &[5, 7],
    &[6, 0, 15],
    &[9, 15],
    &[8, 10, 1, 17],
    &[9, 11],
    &[10, 12, 3, 19],
    &[11, 13],
    &[12, 14, 5, 21],
    &[13, 15],
    &[14, 8, 7, 23],
    &[17, 23],
    &[16, 18, 9],
    &[17, 19],
    &[18, 20, 11],
    &[19, 21],
    &[20, 22, 13],
    &[21, 23],
    &[22, 16, 15],
];
const MOINHOS: [[usize; 3]; 16] = [
    [0, 1, 2],
    [2, 3, 4],
    [4, 5, 6],
    [6, 7, 0],
    [8, 9, 10],
    [10, 11, 12],
    [12, 13, 14],
    [14, 15, 8],
    [16, 17, 18],
    [18, 19, 20],
    [20, 21, 22],
    [22, 23, 16],
    [1, 9, 17],
    [3, 11, 19],
    [5, 13, 21],
    [7, 15, 23],
];

#[link(wasm_import_module = "ambiente")]
extern "C" {
    fn agora() -> f64;
    fn sortear() -> f64;
}
fn tempo() -> f64 {
    unsafe { agora() }
}

// Buffer compartilhado com a ponte JavaScript. O acesso é síncrono.
static mut ENTRADA: [u32; 8192] = [0; 8192];
static mut SAIDA: [f64; 1024] = [0.0; 1024];
#[no_mangle]
pub extern "C" fn entrada() -> *mut u32 {
    std::ptr::addr_of_mut!(ENTRADA).cast()
}
#[no_mangle]
pub extern "C" fn saida() -> *mut f64 {
    std::ptr::addr_of_mut!(SAIDA).cast()
}

#[derive(Clone)]
struct Estado {
    tabuleiro: [u8; 24],
    reservas: [u8; 3],
    jogador: u8,
    turnos: u32,
    sem_captura: u32,
    historico: Vec<(u64, u32)>,
}
#[derive(Clone, Copy, Debug, PartialEq)]
struct Acao {
    origem: Option<usize>,
    destino: usize,
    remocao: Option<usize>,
}
impl Acao {
    fn codigo(self) -> u32 {
        self.origem.map_or(0, |p| p as u32 + 1)
            | ((self.destino as u32 + 1) << 5)
            | (self.remocao.map_or(0, |p| p as u32 + 1) << 10)
    }
}
impl Estado {
    fn ler() -> Self {
        let dados = unsafe { &*std::ptr::addr_of!(ENTRADA) };
        let mut tabuleiro = [0; 24];
        for p in 0..24 {
            tabuleiro[p] = dados[p] as u8;
        }
        let mut historico = Vec::new();
        for i in 0..dados[30] as usize {
            let base = 31 + i * 3;
            historico.push((
                dados[base] as u64 | ((dados[base + 1] as u64) << 32),
                dados[base + 2],
            ));
        }
        Self {
            tabuleiro,
            reservas: [0, dados[24] as u8, dados[25] as u8],
            jogador: dados[26] as u8,
            turnos: dados[27],
            sem_captura: dados[28],
            historico,
        }
    }
    fn chave(&self) -> u64 {
        let mut chave = 0u64;
        for p in 0..24 {
            chave |= (self.tabuleiro[p] as u64) << (p * 2);
        }
        chave
            | ((self.jogador as u64) << 48)
            | ((self.reservas[1] as u64) << 50)
            | ((self.reservas[2] as u64) << 54)
    }
    fn quantidade(&self, jogador: u8) -> usize {
        self.tabuleiro.iter().filter(|&&p| p == jogador).count()
    }
    fn colocando(&self) -> bool {
        self.reservas[1] + self.reservas[2] > 0
    }
    fn moinho(&self, posicao: usize, jogador: u8) -> bool {
        MOINHOS.iter().any(|trinca| {
            trinca.contains(&posicao) && trinca.iter().all(|&p| self.tabuleiro[p] == jogador)
        })
    }
    fn basicas(&self, jogador: u8) -> Vec<Acao> {
        let vazias: Vec<_> = (0..24).filter(|&p| self.tabuleiro[p] == 0).collect();
        if self.reservas[jogador as usize] > 0 {
            return vazias
                .iter()
                .map(|&destino| Acao {
                    origem: None,
                    destino,
                    remocao: None,
                })
                .collect();
        }
        if self.colocando() {
            return vec![];
        }
        let voo = self.quantidade(jogador) == 3;
        let mut acoes = Vec::new();
        for origem in 0..24 {
            if self.tabuleiro[origem] != jogador {
                continue;
            }
            let destinos = if voo {
                vazias.as_slice()
            } else {
                VIZINHOS[origem]
            };
            for &destino in destinos {
                if self.tabuleiro[destino] == 0 {
                    acoes.push(Acao {
                        origem: Some(origem),
                        destino,
                        remocao: None,
                    });
                }
            }
        }
        acoes
    }
    // Código do motivo: 1 peças, 2 bloqueio, 3 repetição, 4 sem captura, 5 limite.
    fn resultado(&self) -> Option<(u8, u8)> {
        for jogador in [self.jogador, 3 - self.jogador] {
            if self.reservas[jogador as usize] == 0 && self.quantidade(jogador) < 3 {
                return Some((3 - jogador, 1));
            }
        }
        if !self.colocando() && self.basicas(self.jogador).is_empty() {
            return Some((3 - self.jogador, 2));
        }
        let chave = self.chave();
        if self.historico.iter().any(|&(c, n)| c == chave && n >= 3) {
            return Some((0, 3));
        }
        if !self.colocando() && self.sem_captura >= 100 {
            return Some((0, 4));
        }
        if self.turnos >= 400 {
            return Some((0, 5));
        }
        None
    }
    fn acoes(&self) -> Vec<Acao> {
        if self.resultado().is_some() {
            return vec![];
        }
        let mut acoes = Vec::new();
        for acao in self.basicas(self.jogador) {
            let mut novo = self.clone();
            if let Some(p) = acao.origem {
                novo.tabuleiro[p] = 0;
            }
            novo.tabuleiro[acao.destino] = self.jogador;
            let mut capturas = vec![];
            if novo.moinho(acao.destino, self.jogador) {
                let pecas: Vec<_> = (0..24)
                    .filter(|&p| novo.tabuleiro[p] == 3 - self.jogador)
                    .collect();
                capturas = pecas
                    .iter()
                    .copied()
                    .filter(|&p| !novo.moinho(p, 3 - self.jogador))
                    .collect();
                if capturas.is_empty() {
                    capturas = pecas;
                }
            }
            if capturas.is_empty() {
                acoes.push(acao);
            } else {
                for remocao in capturas {
                    acoes.push(Acao {
                        remocao: Some(remocao),
                        ..acao
                    });
                }
            }
        }
        acoes
    }
    fn aplicar(&self, acao: Acao) -> Self {
        let mut novo = self.clone();
        if let Some(p) = acao.origem {
            novo.tabuleiro[p] = 0;
        } else {
            novo.reservas[self.jogador as usize] -= 1;
        }
        novo.tabuleiro[acao.destino] = self.jogador;
        if let Some(p) = acao.remocao {
            novo.tabuleiro[p] = 0;
        }
        novo.sem_captura = if acao.remocao.is_some() || self.colocando() {
            0
        } else {
            self.sem_captura + 1
        };
        novo.turnos += 1;
        novo.jogador = 3 - self.jogador;
        let chave = novo.chave();
        if let Some((_, n)) = novo.historico.iter_mut().find(|(c, _)| *c == chave) {
            *n += 1;
        } else {
            novo.historico.push((chave, 1));
        }
        novo
    }
    fn avaliar(&self, jogador: u8) -> f64 {
        if let Some((vencedor, _)) = self.resultado() {
            return if vencedor == 0 {
                0.0
            } else if vencedor == jogador {
                10000.0
            } else {
                -10000.0
            };
        }
        let pontuar = |dono: u8| {
            let mut moinhos = 0;
            let mut ameacas = 0;
            for trinca in MOINHOS {
                let pecas = trinca
                    .iter()
                    .filter(|&&p| self.tabuleiro[p] == dono)
                    .count();
                let vazias = trinca.iter().filter(|&&p| self.tabuleiro[p] == 0).count();
                if pecas == 3 {
                    moinhos += 1;
                }
                if pecas == 2 && vazias == 1 {
                    ameacas += 1;
                }
            }
            10.0 * (self.quantidade(dono) as f64 + self.reservas[dono as usize] as f64) / 9.0
                + 3.0 * moinhos as f64 / 16.0
                + 2.0 * ameacas as f64 / 16.0
                + self.basicas(dono).len() as f64 / 63.0
        };
        pontuar(jogador) - pontuar(3 - jogador)
    }
}

struct Controle {
    prazo: f64,
    horizonte: u32,
    exploracao: f64,
    semente: Option<u32>,
    nos: u32,
    simulacoes: u32,
    truncadas: u32,
    iteracoes: u32,
    profundidade: u32,
}
impl Controle {
    fn conferir(&self) -> Result<(), ()> {
        if self.prazo.is_finite() && tempo() >= self.prazo {
            Err(())
        } else {
            Ok(())
        }
    }
    fn indice(&mut self, tamanho: usize) -> usize {
        let valor = if let Some(mut x) = self.semente {
            x ^= x << 13;
            x ^= x >> 17;
            x ^= x << 5;
            self.semente = Some(x);
            x as f64 / 4294967296.0
        } else {
            unsafe { sortear() }
        };
        (valor * tamanho as f64).floor() as usize
    }
    fn simular(&mut self, estado: &Estado, jogador: u8) -> Result<(f64, bool), ()> {
        let mut atual = estado.clone();
        for _ in 0..self.horizonte {
            self.conferir()?;
            if let Some((v, _)) = atual.resultado() {
                return Ok((recompensa(v, jogador), false));
            }
            let acoes = atual.acoes();
            atual = atual.aplicar(acoes[self.indice(acoes.len())]);
        }
        self.conferir()?;
        Ok(atual
            .resultado()
            .map_or((0.5, true), |(v, _)| (recompensa(v, jogador), false)))
    }
}
fn recompensa(vencedor: u8, jogador: u8) -> f64 {
    if vencedor == 0 {
        0.5
    } else if vencedor == jogador {
        1.0
    } else {
        0.0
    }
}
fn melhores(valores: &[f64], controle: &mut Controle) -> usize {
    let mut maior = f64::NEG_INFINITY;
    let mut candidatos = vec![];
    for (i, &valor) in valores.iter().enumerate() {
        if valor > maior {
            maior = valor;
            candidatos.clear();
            candidatos.push(i);
        } else if valor == maior {
            candidatos.push(i);
        }
    }
    candidatos[controle.indice(candidatos.len())]
}

fn buscar(
    estado: &Estado,
    profundidade: u32,
    mut alfa: f64,
    mut beta: f64,
    jogador: u8,
    controle: &mut Controle,
) -> Result<(f64, Option<Acao>), ()> {
    controle.conferir()?;
    controle.nos += 1;
    if profundidade == 0 || estado.resultado().is_some() {
        return Ok((estado.avaliar(jogador), None));
    }
    let maximizar = estado.jogador == jogador;
    let mut valor = if maximizar {
        f64::NEG_INFINITY
    } else {
        f64::INFINITY
    };
    let mut melhor = None;
    let mut sucessores = vec![];
    for acao in estado.acoes() {
        controle.conferir()?;
        let novo = estado.aplicar(acao);
        let nota = novo.avaliar(estado.jogador);
        sucessores.push((acao, novo, nota));
    }
    sucessores.sort_by(|a, b| b.2.total_cmp(&a.2));
    for (acao, novo, _) in sucessores {
        let resposta = buscar(&novo, profundidade - 1, alfa, beta, jogador, controle)?.0;
        if melhor.is_none()
            || (if maximizar {
                resposta > valor
            } else {
                resposta < valor
            })
        {
            valor = resposta;
            melhor = Some(acao);
        }
        if maximizar {
            alfa = alfa.max(valor);
        } else {
            beta = beta.min(valor);
        }
        if alfa >= beta {
            break;
        }
    }
    Ok((valor, melhor))
}

struct No {
    estado: Estado,
    acao: Option<Acao>,
    profundidade: u32,
    visitas: u32,
    soma: f64,
    pendentes: Vec<Acao>,
    filhos: Vec<usize>,
}
impl No {
    fn criar(estado: Estado, acao: Option<Acao>, profundidade: u32) -> Self {
        let pendentes = estado.acoes();
        Self {
            estado,
            acao,
            profundidade,
            visitas: 0,
            soma: 0.0,
            pendentes,
            filhos: vec![],
        }
    }
}

fn monte_carlo(
    estado: &Estado,
    acoes: &[Acao],
    limite: u32,
    c: &mut Controle,
) -> (Acao, bool, Vec<u32>) {
    let mut visitas = vec![0u32; acoes.len()];
    let mut somas = vec![0.0; acoes.len()];
    let mut interrompido = false;
    'busca: while c.simulacoes < limite {
        let mut ordem: Vec<_> = (0..acoes.len()).collect();
        for i in (1..ordem.len()).rev() {
            let j = c.indice(i + 1);
            ordem.swap(i, j);
        }
        for i in ordem {
            if c.simulacoes >= limite {
                break;
            }
            let resposta = (|| {
                c.conferir()?;
                let novo = estado.aplicar(acoes[i]);
                let resposta = c.simular(&novo, estado.jogador)?;
                c.conferir()?;
                Ok::<_, ()>(resposta)
            })();
            let Ok((recompensa, truncada)) = resposta else {
                interrompido = true;
                break 'busca;
            };
            visitas[i] += 1;
            somas[i] += recompensa;
            c.simulacoes += 1;
            c.iteracoes += 1;
            c.truncadas += truncada as u32;
        }
    }
    let escolhido = if visitas.contains(&0) {
        c.indice(acoes.len())
    } else {
        melhores(
            &somas
                .iter()
                .zip(&visitas)
                .map(|(s, n)| s / (*n as f64))
                .collect::<Vec<_>>(),
            c,
        )
    };
    (acoes[escolhido], interrompido, visitas)
}

fn mcts(estado: &Estado, acoes: &[Acao], limite: u32, c: &mut Controle) -> (Acao, bool) {
    let mut arvore = vec![No::criar(estado.clone(), None, 0)];
    c.nos = 1;
    let mut interrompido = false;
    while c.iteracoes < limite {
        let passo = (|| {
            c.conferir()?;
            let mut indice = 0;
            let mut caminho = vec![0];
            // Seleção com perspectiva adversarial.
            while arvore[indice].pendentes.is_empty() && !arvore[indice].filhos.is_empty() {
                c.conferir()?;
                let no = &arvore[indice];
                let valores: Vec<_> = no
                    .filhos
                    .iter()
                    .map(|&i| {
                        let filho = &arvore[i];
                        let media = filho.soma / filho.visitas as f64;
                        let valor = if no.estado.jogador == estado.jogador {
                            media
                        } else {
                            1.0 - media
                        };
                        valor
                            + c.exploracao
                                * ((no.visitas as f64).ln() / filho.visitas as f64).sqrt()
                    })
                    .collect();
                indice = no.filhos[melhores(&valores, c)];
                caminho.push(indice);
            }
            // Prepara expansão, mas só a confirma após terminar a simulação.
            let mut expansao = None;
            if !arvore[indice].pendentes.is_empty() {
                let escolha = c.indice(arvore[indice].pendentes.len());
                let acao = arvore[indice].pendentes[escolha];
                let no = No::criar(
                    arvore[indice].estado.aplicar(acao),
                    Some(acao),
                    arvore[indice].profundidade + 1,
                );
                expansao = Some((escolha, no));
            }
            let simulacao = expansao
                .as_ref()
                .map_or(&arvore[indice].estado, |(_, no)| &no.estado);
            let (recompensa, truncada) = c.simular(simulacao, estado.jogador)?;
            c.conferir()?;
            if let Some((escolha, no)) = expansao {
                let filho = arvore.len();
                arvore[indice].pendentes.remove(escolha);
                arvore[indice].filhos.push(filho);
                arvore.push(no);
                caminho.push(filho);
                c.nos += 1;
            }
            // Retropropagação da recompensa para a raiz.
            c.profundidade = c
                .profundidade
                .max(arvore[*caminho.last().unwrap()].profundidade);
            for i in caminho {
                arvore[i].visitas += 1;
                arvore[i].soma += recompensa;
            }
            c.iteracoes += 1;
            c.simulacoes += 1;
            c.truncadas += truncada as u32;
            Ok::<_, ()>(())
        })();
        if passo.is_err() {
            interrompido = true;
            break;
        }
    }
    if arvore[0].filhos.is_empty() {
        return (acoes[c.indice(acoes.len())], interrompido);
    }
    let visitas = arvore[0]
        .filhos
        .iter()
        .map(|&i| arvore[i].visitas)
        .max()
        .unwrap();
    let candidatos: Vec<_> = arvore[0]
        .filhos
        .iter()
        .copied()
        .filter(|&i| arvore[i].visitas == visitas)
        .collect();
    let medias: Vec<_> = candidatos
        .iter()
        .map(|&i| arvore[i].soma / arvore[i].visitas as f64)
        .collect();
    let escolhido = candidatos[melhores(&medias, c)];
    (arvore[escolhido].acao.unwrap(), interrompido)
}

#[no_mangle]
pub extern "C" fn decidir(
    algoritmo: u32,
    limite_ms: f64,
    inicio: f64,
    iteracoes: u32,
    profundidade: u32,
    horizonte: u32,
    exploracao: f64,
    aleatorio_local: u32,
    semente: u32,
) {
    let estado = Estado::ler();
    let mut c = Controle {
        prazo: if limite_ms < 0.0 {
            f64::INFINITY
        } else {
            inicio + limite_ms
        },
        horizonte,
        exploracao,
        semente: if aleatorio_local == 1 {
            Some(semente)
        } else {
            None
        },
        nos: 0,
        simulacoes: 0,
        truncadas: 0,
        iteracoes: 0,
        profundidade: 0,
    };
    let acoes = estado.acoes();
    if algoritmo == 0 {
        c.nos = 1;
    }
    let limite = if limite_ms < 0.0 { iteracoes } else { u32::MAX };
    let mut interrompido = false;
    let mut amostras = vec![];
    let mut valor = f64::NAN;
    let mut melhor = acoes.first().copied();
    if !acoes.is_empty() {
        match algoritmo {
            0 => {
                let (acao, parou) = mcts(&estado, &acoes, limite, &mut c);
                melhor = Some(acao);
                interrompido = parou;
            }
            1 => {
                let primeira = if limite_ms < 0.0 { profundidade } else { 1 };
                for nivel in primeira..=profundidade {
                    match buscar(
                        &estado,
                        nivel,
                        f64::NEG_INFINITY,
                        f64::INFINITY,
                        estado.jogador,
                        &mut c,
                    ) {
                        Ok((nota, acao)) if c.conferir().is_ok() => {
                            melhor = acao;
                            valor = nota;
                            c.profundidade = nivel;
                            c.iteracoes += 1;
                            if nota.abs() == 10000.0 {
                                break;
                            }
                        }
                        _ => {
                            interrompido = true;
                            break;
                        }
                    }
                }
            }
            2 => {
                let (acao, parou, visitas) = monte_carlo(&estado, &acoes, limite, &mut c);
                melhor = Some(acao);
                interrompido = parou;
                amostras = visitas;
            }
            _ => {
                melhor = Some(acoes[c.indice(acoes.len())]);
            }
        }
    }
    let saida = unsafe { &mut *std::ptr::addr_of_mut!(SAIDA) };
    saida.fill(0.0);
    saida[0] = melhor.map_or(0, Acao::codigo) as f64;
    saida[1] = tempo() - inicio;
    saida[2] = c.nos as f64;
    saida[3] = c.simulacoes as f64;
    saida[4] = c.iteracoes as f64;
    saida[5] = c.profundidade as f64;
    saida[6] = c.truncadas as f64;
    saida[7] = interrompido as u8 as f64;
    saida[8] = valor;
    saida[9] = c.semente.unwrap_or(0) as f64;
    saida[10] = amostras.len() as f64;
    for (i, n) in amostras.iter().enumerate() {
        saida[16 + i] = *n as f64;
    }
}

// Diagnóstico usado para conferir a equivalência das regras com JavaScript.
#[no_mangle]
pub extern "C" fn conferir_estado(jogador: u32) {
    let estado = Estado::ler();
    let acoes = estado.acoes();
    let saida = unsafe { &mut *std::ptr::addr_of_mut!(SAIDA) };
    saida[0] = acoes.len() as f64;
    let fim = estado.resultado();
    saida[1] = fim.map_or(-1.0, |(v, _)| v as f64);
    saida[2] = fim.map_or(0.0, |(_, m)| m as f64);
    saida[3] = estado.avaliar(jogador as u8);
    for (i, acao) in acoes.iter().enumerate() {
        saida[16 + i] = acao.codigo() as f64;
    }
}
