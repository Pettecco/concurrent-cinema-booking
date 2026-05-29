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

Cada reserva usa uma chave:

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

#### 3. Redis Lock Distribuído

```ts
async book(booking: Booking): Promise<Booking> {
  const lockKey = `lock:${booking.movieId}:${booking.seatId}`;

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
SET lock:screen-1:A1 user-123 PX 300000 NX
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

```txt
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

Agora todas as instâncias respeitam o mesmo lock.

## Arquitetura Atual

### Visão Geral

```
┌─────────────────────────────────────────────────────┐
│              FRONTEND (Browser)                     │
│         HTTP Requests + WebSocket Connection        │
└─────────────────────────────────────────────────────┘
           │                        │
           │ HTTP                   │ WebSocket
           ↓                        ↑
┌─────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express)            │
│  ┌───────────────┐  ┌─────────────────────────────┐ │
│  │ HTTP Routes   │  │ WebSocket Server            │ │
│  │ POST /locks   │  │ - Broadcast events          │ │
│  │ POST /bookings│  │ - Redis Keyspace Events     │ │
│  └───────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
           │                        │
           ↓                        ↓
┌──────────────────┐     ┌──────────────────┐
│   PostgreSQL     │     │     Redis        │
│   (Bookings)     │     │ (Locks + Events) │
└──────────────────┘     └──────────────────┘
```

---

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

| Tecnologia                                                                                                                  | Descrição                      |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="16"/> Node.js               | Runtime JavaScript no servidor |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="16"/> TypeScript    | Linguagem com tipagem estática |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pnpm/pnpm-original.svg" width="16"/> pnpm                      | Package manager rápido         |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="16"/> Express 5           | Framework HTTP                 |
| <img src="https://raw.githubusercontent.com/colinhacks/zod/main/logo.svg" width="16"/> Zod                                  | Validação de schemas           |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="16"/> PostgreSQL 16 | Banco relacional               |
| <img src="https://knexjs.org/favicon.svg" width="16"/> Knex                                                                 | Query builder e migrations     |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" width="16"/> Redis 7                 | Cache e locks distribuídos     |
| <img src="https://upload.wikimedia.org/wikipedia/commons/9/96/Socket-io.svg" width="16"/> WebSocket 8                       | Conexão persistente            |
| <img src="https://raw.githubusercontent.com/pinojs/pino/main/favicon.ico" width="16"/> Pino 10                              | Logger estruturado             |
| <img src="https://raw.githubusercontent.com/pinojs/pino/main/favicon.ico" width="16"/> pino-http 11                         | Middleware de log HTTP         |
| <img src="https://raw.githubusercontent.com/vitest-dev/vitest/main/docs/public/logo.svg" width="16"/> Vitest 4              | Framework de testes            |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="16"/> Docker                | Containers                     |

## Setup

### Pré-requisitos

- Node.js v22+
- pnpm v11+
- Docker + Docker Compose

### Instalação

```bash
# Clonar repositório
git clone <repo-url>
cd concurrent-cinema-booking

# Instalar dependências
pnpm install

# Rodar containers (PostgreSQL + Redis)
docker-compose up -d

# Rodar migrations
pnpm migrate:latest

# Iniciar servidor (dev mode)
pnpm dev
```

O servidor estará disponível em `http://localhost:3000`

## API

### HTTP Endpoints

| Método   | Endpoint             | Descrição                | Status Codes               |
| -------- | -------------------- | ------------------------ | -------------------------- |
| `POST`   | `/locks`             | Adquire lock             | `200`, `400`, `409`        |
| `DELETE` | `/locks`             | Libera lock              | `204`, `400`, `403`        |
| `POST`   | `/bookings`          | Cria reserva             | `201`, `400`, `403`, `409` |
| `GET`    | `/bookings/:movieId` | Lista reservas por filme | `200`                      |
| `GET`    | `/health`            | Health check             | `200`                      |

---

### POST /locks

Adquire lock em um assento por 5 minutos.

**Request:**

```json
{
  "movieId": "550e8400-e29b-41d4-a716-446655440001",
  "seatId": "A1",
  "userId": "550e8400-e29b-41d4-a716-446655440100"
}
```

**Response (200):**

```json
{
  "success": true,
  "lockKey": "lock:550e8400-e29b-41d4-a716-446655440001:A1",
  "expiresAt": "2026-05-27T15:05:00.000Z"
}
```

**Response (409):**

```json
{
  "error": {
    "code": "SEAT_LOCKED",
    "message": "Seat A1 is already locked"
  }
}
```

---

### DELETE /locks

Libera lock de um assento.

**Request:**

```json
{
  "movieId": "550e8400-e29b-41d4-a716-446655440001",
  "seatId": "A1",
  "userId": "550e8400-e29b-41d4-a716-446655440100"
}
```

**Response (204):** `No Content`

**Response (403):**

```json
{
  "error": {
    "code": "LOCK_NOT_OWNED",
    "message": "Lock lock:... is not owned by user ..."
  }
}
```

---

### POST /bookings

Cria reserva de assento (requer lock válido).

**Request:**

```json
{
  "movieId": "550e8400-e29b-41d4-a716-446655440001",
  "seatId": "A1",
  "userId": "550e8400-e29b-41d4-a716-446655440100",
  "status": "CONFIRMED"
}
```

**Response (201):**

```json
{
  "id": "...",
  "movieId": "...",
  "seatId": "A1",
  "userId": "...",
  "status": "CONFIRMED"
}
```

**Response (403):**

```json
{
  "error": {
    "code": "SEAT_NOT_LOCKED",
    "message": "Seat A1 is not locked for movie ..."
  }
}
```

**Response (409):**

```json
{
  "error": {
    "code": "SEAT_ALREADY_BOOKED",
    "message": "Seat A1 is already booked for movie ..."
  }
}
```

---

### WebSocket Events

**Conexão:** `ws://localhost:3000`

| Evento          | Direção         | Payload                                | Descrição      |
| --------------- | --------------- | -------------------------------------- | -------------- |
| `SEAT_SELECTED` | Server → Client | `{movieId, seatId, userId, expiresAt}` | Lock adquirido |
| `SEAT_BOOKED`   | Server → Client | `{movieId, seatId, bookingId}`         | Reserva criada |
| `SEAT_RELEASED` | Server → Client | `{movieId, seatId}`                    | Lock liberado  |

**Exemplo de evento:**

```json
{
  "type": "SEAT_BOOKED",
  "occurredAt": "2026-05-27T14:00:00.000Z",
  "movieId": "550e8400-e29b-41d4-a716-446655440001",
  "seatId": "A1",
  "bookingId": "uuid-123"
}
```

## 🧪 Testes

```bash
# Rodar todos os testes
pnpm test

# Limpar banco e Redis (útil entre testes manuais)
pnpm cleanup
```

### Arquivos de Teste HTTP

Use a extensão **REST Client** no VSCode:

- `http/locks.http` - Testes de lock (acquire/release)
- `http/booking-with-lock.http` - Fluxo completo de booking com lock

## Decisões de Design

### Por que Lock Obrigatório?

- Garante que nenhum booking seja criado sem exclusividade
- Previne race conditions em multi-instância
- Frontend tem feedback imediato (assento selecionado)
- UX melhor (usuário sabe na hora se está disponível)

### Por que TTL de 5 Minutos?

- Tempo razoável pra usuário completar o booking
- Previne locks órfãos (usuário abandona fluxo)
- Redis expira automaticamente (sem cleanup manual)
- Balanceia entre UX e throughput do sistema

### Por que Liberação Automática?

- Frontend não precisa chamar `DELETE /locks` manualmente
- Garante que lock sempre é liberado (finally)

### Por que Validar Ownership?

- Previne que usuário A libere lock do usuário B
- Segurança básica (sem autenticação completa)
- Nível adicional de proteção contra bugs maliciosos
- Audit trail (sabe quem tinha o lock)

### Por que WebSocket + Redis Keyspace Events?

- Notificação em tempo real pra todos os clientes
- TTL expiry é detectado automaticamente
- Frontend não precisa fazer polling
- Menos tráfego de rede

## Pub/Sub vs Keyspace Events

### Qual a diferença?

**Redis Pub/Sub** (Publish/Subscribe):

- Você **publica** mensagens em um canal
- Clients **inscritos** recebem a mensagem
- **Use case:** broadcast manual de eventos

```typescript
// Publish
await redis.publish(
  'seat-events',
  JSON.stringify({ type: 'BOOKED', seat: 'A1' })
);

// Subscribe
const subscriber = redis.duplicate();
await subscriber.subscribe('seat-events', message => {
  console.log('Received:', message);
});
```

**Redis Keyspace Events** (notificação automática):

- Redis **notifica automaticamente** quando chaves mudam
- **Use case:** TTL expiry, deletes, modificações

```typescript
// Habilitar keyspace events (redis.conf)
notify-keyspace-events Ex  // Ex = events de expire

// Ouvir eventos de expiração
const sub = redis.duplicate();
await sub.psubscribe('__keyevent@0__:expired', (key) => {
  console.log('Key expired:', key);
  // Broadcast WebSocket: "lock released"
});
```

### O que usamos no projeto?

**Ambos!**

| Funcionalidade           | Implementação         | Por quê                                  |
| ------------------------ | --------------------- | ---------------------------------------- |
| Broadcast de eventos     | WebSocket Server      | Clients conectados recebem em tempo real |
| TTL expiry detection     | Redis Keyspace Events | Lock expira → WebSocket avisa clients    |
| Lock acquisition/release | Manual (código)       | Controle fino sobre quando broadcast     |

### Fluxo Completo

```
1. User adquire lock → Redis SET
2. Backend → WebSocket broadcast "SEAT_SELECTED"
3. TTL expira (5 min) → Redis Keyspace Event
4. Keyspace Listener → WebSocket broadcast "SEAT_RELEASED"
5. Todos os clients atualizam UI
```

**Por que não só Pub/Sub?**

- Pub/Sub não notifica TTL expiry automaticamente
- Keyspace Events é mais confiável para locks
- WebSocket é melhor pra comunicação com frontend (browser)

---

## Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor em watch mode

# Build
pnpm build            # Compila TypeScript
pnpm start            # Roda build em produção

# Database
pnpm migrate:make     # Cria nova migration
pnpm migrate:latest   # Roda migrations pendentes
pnpm migrate:rollback # Desfaz última migration
pnpm migrate:status   # Mostra status das migrations

# Utilitários
pnpm cleanup          # Limpa banco e Redis
pnpm test             # Roda testes
```
