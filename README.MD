# Cinema Booking - Concorrência & Race Conditions

## Objetivo

O objetivo desse projeto é simular um sistema de reserva de assentos de cinema e estudar problemas reais de concorrência.

A ideia principal:

```txt
Múltiplos usuários tentando reservar o mesmo assento ao mesmo tempo.
```

---

### A Primeira Implementação

Começamos com um store in-memory usando `Map`.

```ts
private bookings = new Map<string, Booking>();
```

Cada reserva usa uma chave:

```ts
const key = `${booking.movieId}:${booking.seatId}`;
```

Exemplo:

```txt
screen-1:A1
```

---

### Implementação Inicial

```ts
async book(booking: Booking): Promise<Booking> {
  const key = `${booking.movieId}:${booking.seatId}`;

  const alreadyBooked = this.bookings.has(key);

  if (alreadyBooked) {
    throw new Error('seat already booked');
  }

  await sleep(1);

  this.bookings.set(key, booking);

  return booking;
}
```

---

### O Problema: Race Condition

Essa implementação parece correta.

Mas existe um problema crítico:

```txt
READ -> await -> WRITE
```

O `await` cria uma janela onde outras requests podem entrar.

### Exemplo do Problema

Imagine 3 requests tentando reservar o assento `A1`.

### Fluxo

```txt
REQ1 -> has() => false
REQ1 -> await

REQ2 -> has() => false
REQ2 -> await

REQ3 -> has() => false
REQ3 -> await
```

Todas passaram pela validação.

Depois:

```txt
REQ1 -> set()
REQ2 -> set()
REQ3 -> set()
```

Resultado:

```txt
3 reservas "venceram"
```

Mesmo que o `Map` termine com apenas 1 valor.

---

### Por Que Isso Acontece no Node?

Muita gente acredita que Node não sofre race conditions porque Node é `single-threaded`. Mas isso só vale para `código sícrono`.

#### Código síncrono é seguro

```ts
if (!map.has(key)) {
  map.set(key, value);
}
```

Tudo executa sem interrupção.

#### Código assíncrono NÃO é seguro

```ts
if (!map.has(key)) {
  await sleep(1);

  map.set(key, value);
}
```

Agora existe interleaving.

---

### O Papel do sleep( )

O `sleep()` não cria thread.

Node continua usando `Event Loop`

O objetivo do `sleep()` é apenas:

```txt
simular latência assíncrona
```

Assim conseguimos reproduzir o comportamento real de:

- banco de dados
- redis
- HTTP
- filas
- APIs externas

---

## O que o await faz?

Quando o código encontra:

```ts
await sleep(1);
```

A execução pausa temporariamente.

Enquanto isso:

```txt
outras requests continuam executando
```

Isso permite a race condition.

---

### O Teste de Concorrência

Criamos um teste onde milhares de usuários tentam reservar o mesmo assento.

```ts
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    try {
      await service.book(...);
      success++;
    } catch {
      failure++;
    }
  })
);
```

Objetivo esperado:

```txt
1 sucesso
N-1 falhas
```

### Resultado Inicial

Sem proteção:

```txt
Expected: 1
Received: 347
```

A race condition apareceu.

---

### A Primeira Solução: Mutex Global

Instalamos:

```bash
pnpm add async-mutex
```

Depois:

```ts
private mutex = new Mutex();
```

### Implementação

```ts
async book(booking: Booking): Promise<Booking> {
  return this.mutex.runExclusive(async () => {
    const key = `${booking.movieId}:${booking.seatId}`;

    const alreadyBooked = this.bookings.has(key);

    if (alreadyBooked) {
      throw new Error('seat already booked');
    }

    await sleep(1);

    this.bookings.set(key, booking);

    return booking;
  });
}
```

---

### O Que é Mutex?

Mutex significa `Mutual Exclusion`

A ideia é:

```txt
Somente uma execução pode entrar na região crítica por vez.
```

### Sem Mutex

```txt
REQ1 -> entra
REQ2 -> entra
REQ3 -> entra
```

Todas executam simultaneamente.

### Com Mutex

```txt
REQ1 -> entra
REQ2 -> espera
REQ3 -> espera
```

Depois:

```txt
REQ1 -> termina

REQ2 -> entra
REQ2 -> erro
```

Agora o teste passa.

---

### O Problema do Mutex Global

O mutex global resolve a race condition.

Mas cria outro problema:

```txt
Todo o sistema fica serializado.
```

### Exemplo

Mesmo reservas independentes:

```txt
A1
B2
C3
```

Precisam esperar.

### Resultado

```txt
A1 bloqueia B2
A1 bloqueia C3
```

Isso reduz:

- throughput
- paralelismo
- escalabilidade

---

### Melhorando: Mutex por Seat

Em vez de um mutex global:

```txt
1 lock para o sistema inteiro
```

Criamos:

```txt
1 lock por assento
```

---

### Estrutura

```ts
private seatMutexes = new Map<string, Mutex>();
```

### Funcionamento

```txt
screen-1:A1 -> mutex A
screen-1:B2 -> mutex B
screen-1:C3 -> mutex C
```

Agora:

```txt
A1 e B2 podem reservar ao mesmo tempo.
```

Mas:

```txt
A1 vs A1 continua protegido.
```

---

### Problemas do Mutex por Seat

Apesar de melhor, ainda existem problemas.

### Problema 1: Memory Leak

O Map de mutexes cresce para sempre.

```txt
100k seats = 100k mutexes
```

Mesmo que nunca mais sejam usados.

### Problema 2: Funciona apenas em uma instância

O mutex existe apenas na memória do processo.

### Exemplo

```txt
Load Balancer
  ├── Node A
  ├── Node B
  └── Node C
```

Agora:

```txt
REQ1 -> Node A
REQ2 -> Node B
```

Cada instância possui:

- seu próprio Map
- seu próprio mutex

Então o lock não é compartilhado.

A race condition volta.
