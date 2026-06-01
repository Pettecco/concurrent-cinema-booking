# Cinema Booking - Concorrência & Race Conditions

> Estudo prático de concorrência, race conditions e locks distribuídos em Node.js

## Objetivo

O objetivo desse projeto é simular um sistema de reserva de assentos de cinema e estudar problemas reais de concorrência, com foco em:

- **Race conditions** em ambiente assíncrono
- **Locks distribuídos** com Redis
- **Comunicação real-time** com WebSocket
- **Arquitetura em camadas** (Clean Architecture)

A ideia principal:

```txt
Múltiplos usuários tentando reservar o mesmo assento ao mesmo tempo.
```

## A Jornada: Resolvendo Race Conditions

### O Problema Inicial

Começamos com um store in-memory usando `Map`:

```ts
private bookings = new Map<string, Booking>();
```

Cada reserva usa uma chave única:

```ts
const key = `${booking.movieId}:${booking.seatId}`; // ex: "screen-1:A1"
```

### Implementação Ingênua (com race condition)

```ts
async book(booking: Booking): Promise<Booking> {
  const key = `${booking.movieId}:${booking.seatId}`;

  const alreadyBooked = this.bookings.has(key);

  if (alreadyBooked) {
    throw new Error('seat already booked');
  }

  await sleep(1); // ← JANELA DE RACE CONDITION

  this.bookings.set(key, booking);

  return booking;
}
```

### Por Que Isso Acontece no Node?

Muita gente acredita que Node não sofre race conditions porque é `single-threaded`. Mas isso só vale para **código síncrono**.

**Código síncrono é seguro:**

```ts
if (!map.has(key)) {
  map.set(key, value); // Executa sem interrupção
}
```

**Código assíncrono NÃO é seguro:**

```ts
if (!map.has(key)) {
  await sleep(1); // ← Outras requests entram aqui
  map.set(key, value);
}
```

O `await` cria uma janela onde ocorre **interleaving** de execuções.

### O Papel do `sleep()`

O `sleep()` não cria thread. Node continua usando **Event Loop**.

O objetivo do `sleep()` é **simular latência assíncrona** (banco de dados, Redis, HTTP, APIs externas).

---

### Evolução das Soluções

#### 1. Mutex Global

```ts
private mutex = new Mutex();

async book(booking: Booking): Promise<Booking> {
  return this.mutex.runExclusive(async () => {
    // região crítica protegida
  });
}
```

**Prós:**

- Resolve race condition completamente
- Simples de implementar

**Contras:**

- Serializa **todas** as operações
- A1 bloqueia B2, C3, etc.

---

#### 2. Mutex por Seat

```ts
private seatMutexes = new Map<string, Mutex>();

async book(booking: Booking): Promise<Booking> {
  const key = `${booking.movieId}:${booking.seatId}`;
  const mutex = this.getOrCreateMutex(key);

  return mutex.runExclusive(async () => {
    // só este assento é bloqueado
  });
}
```

**Prós:**

- A1 e B2 podem reservar simultaneamente
- Melhor throughput

**Contras:**

- Memory leak (mutexes nunca são removidos)
- **Não funciona multi-instância** (cada Node tem seu próprio Map)

---

#### 3. Redis Lock Distribuído (por showtime)

```ts
async book(booking: Booking): Promise<Booking> {
  // Lock é específico por sala + horário + assento
  const lockKey = `lock:${booking.roomId}:${booking.showtimeId}:${booking.seatId}`;

  const acquired = await redis.set(lockKey, userId, 'PX', 300000, 'NX');
  if (!acquired) {
    throw new Error('seat is locked');
  }

  try {
    // opera com exclusividade
  } finally {
    await redis.del(lockKey);
  }
}
```

**Comando Redis:**

```bash
SET lock:room-1:showtime-14h:A1 user-123 PX 300000 NX
```

**Flags:**

- `NX` → Only if Not eXists (só cria se não existir)
- `PX` → Expiração em milissegundos (TTL de 5 minutos)

**Prós:**

- Funciona com múltiplas instâncias
- Lock é compartilhado via Redis
- TTL previne deadlocks
- Memory-safe (Redis gerencia expiração)

---

### Arquitetura Multi-Instância

```
                     Load Balancer
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
     ┌───▼───┐        ┌───▼───┐        ┌───▼───┐
     │Node A │        │Node B │        │Node C │
     └───┬───┘        └───┬───┘        └───┬───┘
         │                │                │
         └────────────────┼────────────────┘
                          │
                   ┌──────▼──────┐
                   │    Redis    │
                   │(lock shared)│
                   └─────────────┘
```

**Locks são específicos por showtime:**

- `lock:room1:showtime-14h:A1` → Usuário 1 pode travar
- `lock:room1:showtime-17h:A1` → Usuário 2 pode travar **ao mesmo tempo**
- `lock:room1:showtime-14h:A1` → Usuário 3 **não consegue** (já travado)

Todas as instâncias respeitam o mesmo lock.

## Arquitetura

**Camadas:**

- **Presentation:** Controllers, Routes, Schemas (Zod)
- **Application:** BookingService (regras de negócio)
- **Domain:** Interfaces e Entities
- **Infrastructure:** Postgres, Redis, WebSocket, Logger

### Camadas (Clean Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Booking     │  │    Lock      │  │   Health     │   │
│  │  Controller  │  │  Controller  │  │  Controller  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │    Routes    │  │   Schemas    │                     │
│  │              │  │    (Zod)     │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
                        │ uses
                        ↓
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │              BookingService                      │   │
│  │ - book(booking)         → Regra: lock obrigatório│   │
│  │ - listBookings(movieId) → Regra: verifica owner  │   │
│  │ - findBookingBySeat()   → Regra: libera após ok  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                        │ uses
                        ↓
┌─────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                        │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────┐   │
│  │ IBooking       │  │ ILock          │  │  Domain  │   │
│  │ Repository     │  │ Service        │  │  Errors  │   │
│  │ (interface)    │  │ (interface)    │  │          │   │
│  └────────────────┘  └────────────────┘  └──────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Entities                            │   │
│  │  - Booking (id, movieId, seatId, userId, status) │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                        ↑ implements
                        │
┌─────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                   │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────┐   │
│  │ Postgres       │  │ Redis          │  │ WebSocket│   │
│  │ Repository     │  │ Lock Service   │  │ Server   │   │
│  │ (Knex + pg)    │  │ (ioredis)      │  │ (ws)     │   │
│  └────────────────┘  └────────────────┘  └──────────┘   │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────┐   │
│  │ Memory         │  │ Memory         │  │ Redis    │   │
│  │ Repository     │  │ Lock Service   │  │ Keyspace │   │
│  │ (testes)       │  │ (testes)       │  │ Listener │   │
│  └────────────────┘  └────────────────┘  └──────────┘   │
│  ┌────────────────┐  ┌────────────────┐                 │
│  │ Pino           │  │ Error          │                 │
│  │ Logger         │  │ Handler        │                 │
│  └────────────────┘  └────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

## Tecnologias

| Tecnologia                                                                                                               | Versão | Descrição          |
| ------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------ |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="16"/> Node.js            | 22     | Runtime            |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="16"/> TypeScript | -      | Linguagem          |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="16"/> Express          | 5      | Framework HTTP     |
| <img src="https://raw.githubusercontent.com/colinhacks/zod/main/logo.svg" width="16"/> Zod                               | -      | Validação          |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="16"/> PostgreSQL | 16     | Banco relacional   |
| <img src="https://knexjs.org/favicon.svg" width="16"/> Knex                                                              | -      | Query builder      |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" width="16"/> Redis                | 7      | Locks distribuídos |
| <img src="https://upload.wikimedia.org/wikipedia/commons/9/96/Socket-io.svg" width="16"/> Socket.IO                      | 8      | WebSocket          |
| <img src="https://raw.githubusercontent.com/pinojs/pino/main/favicon.ico" width="16"/> Pino                              | 10     | Logger             |
| <img src="https://raw.githubusercontent.com/vitest-dev/vitest/main/docs/public/logo.svg" width="16"/> Vitest             | 4      | Testes             |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="16"/> Docker             | -      | Containers         |

## Setup

### Setup

```bash
git clone <repo-url>

cd concurrent-cinema-booking

cp .env.example .env  # ajustar configuração
pnpm install
docker-compose up -d
pnpm migrate:latest
pnpm dev
```

**Variáveis de ambiente:**

| Variável     | Descrição                          | Exemplo          |
| ------------ | ---------------------------------- | ---------------- |
| `PORT`       | Porta em que a API será iniciada   | `3000`           |
| `DB_HOST`    | Host do banco de dados PostgreSQL  | `localhost`      |
| `DB_PORT`    | Porta do banco de dados PostgreSQL | `5432`           |
| `DB_NAME`    | Nome do banco de dados             | `cinema_booking` |
| `REDIS_HOST` | Host da instância Redis            | `localhost`      |
| `REDIS_PORT` | Porta da instância Redis           | `6379`           |

### WebSocket Events

**Conexão:** `ws://localhost:3000/ws` (mesma porta do HTTP + path `/ws`)

| Evento          | Direção         | Payload                                | Descrição      |
| --------------- | --------------- | -------------------------------------- | -------------- |
| `SEAT_SELECTED` | Server → Client | `{roomId, showtimeId, seatId, userId, expiresAt}` | Lock adquirido |
| `SEAT_BOOKED`   | Server → Client | `{roomId, showtimeId, seatId, bookingId}` | Reserva criada |
| `SEAT_RELEASED` | Server → Client | `{roomId, showtimeId, seatId}`         | Lock liberado  |

**Exemplo de evento:**

```json
{
  "type": "SEAT_BOOKED",
  "occurredAt": "2026-05-27T14:00:00.000Z",
  "roomId": "660e8400-e29b-41d4-a716-446655440001",
  "showtimeId": "8fa5eeb0-3bc4-4182-9cb9-7ba8f55ae873",
  "seatId": "A1",
  "bookingId": "uuid-123"
}
```

## Testes

```bash
pnpm test

pnpm cleanup  # limpa banco e Redis
```

**Testes manuais:** use os arquivos em `http/` com a extensão REST Client (VSCode).

## Decisões de Design

| Decisão                          | Razão                                                                 |
| -------------------------------- | --------------------------------------------------------------------- |
| Lock por showtime                | Mesmo assento pode ser travado em horários diferentes simultaneamente |
| Lock obrigatório                 | Previne race conditions, dá feedback imediato ao usuário              |
| TTL de 5 minutos                 | Tempo razoável para completar booking, previne locks órfãos           |
| Liberação automática pós-booking | Garante cleanup, evita chamadas manuais                               |
| Validação de ownership           | Previne que usuário A libere lock do usuário B                        |
| WebSocket + Keyspace Events      | Notificação em tempo real sem polling                                 |

## Pub/Sub e Keyspace Events

**Pub/Sub (Socket.IO Redis Adapter):** sincroniza múltiplos servidores WebSocket. Quando um servidor faz `io.to(movieId).emit()`, o Redis distribui para todos os servidores com clients na sala `movieId`.

**Keyspace Events:** notificação automática do Redis quando uma chave expira. O listener em `keyspace-listener.ts` escuta `__keyevent@0__:expired`, extrai `movieId` e `seatId` da key `lock:{movie}:{seat}`, e faz broadcast via WebSocket.

**Fluxo:**

1. Usuário seleciona **sala + horário (showtime)** → vê assentos disponíveis
2. `POST /locks` com `{roomId, showtimeId, seatId}` → Redis SET `lock:roomId:showtimeId:seatId` com TTL 5min → broadcast `SEAT_SELECTED`
3. TTL expira → Keyspace Event notifica → broadcast `LOCK_EXPIRED`
4. `POST /bookings` → verifica lock → cria booking no Postgres (FK para showtime) → libera lock → broadcast `SEAT_BOOKED`

**Importante:** O lock é específico por **showtime**, então:
- ✅ Usuário 1 pode travar `A1` às **14:00**
- ✅ Usuário 2 pode travar `A1` às **17:00** (mesmo assento, horário diferente)
- ❌ Usuário 3 **não consegue** travar `A1` às **14:00** (já travado pelo Usuário 1)
