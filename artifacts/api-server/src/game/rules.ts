import { createHash } from "node:crypto";

export const SUITS = ["دل", "خشت", "پیک", "گشنیز"] as const;
export type Suit = (typeof SUITS)[number];

const RANKS = [
  { label: "۲", strength: 2 },
  { label: "۳", strength: 3 },
  { label: "۴", strength: 4 },
  { label: "۵", strength: 5 },
  { label: "۶", strength: 6 },
  { label: "۷", strength: 7 },
  { label: "۸", strength: 8 },
  { label: "۹", strength: 9 },
  { label: "۱۰", strength: 10 },
  { label: "سرباز", strength: 11 },
  { label: "بی‌بی", strength: 12 },
  { label: "شاه", strength: 13 },
  { label: "آس", strength: 14 },
] as const;

export type Card = {
  id: string;
  rank: string;
  suit: Suit;
  color: "red" | "black";
};

export type Player = {
  id: string;
  name: string;
  seat: number;
  team: "blue" | "red";
  connected: boolean;
  isHakem: boolean;
};

export type PlayedCard = {
  card: Card;
  playerId: string;
  playerName: string;
};

export type TableState = {
  id: string;
  roomName: string;
  code: string;
  hand: Card[];
  players: Player[];
  trumpSuit: Suit;
  currentTurn: string;
  trick: number;
  totalTricks: number;
  teamScores: { blue: number; red: number };
  lastPlayed: PlayedCard[];
  status: string;
  seedCommitment: string;
  seedRevealed: boolean;
  leadSuit?: Suit;
  currentTrick: PlayedCard[];
};

export class RuleError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_YOUR_TURN"
      | "CARD_NOT_IN_HAND"
      | "MUST_FOLLOW_SUIT",
  ) {
    super(message);
    this.name = "RuleError";
  }
}

function hashToNumber(seed: string): number {
  return Number.parseInt(createHash("sha256").update(seed).digest("hex").slice(0, 8), 16);
}

function nextRandom(state: number): { value: number; state: number } {
  let next = state | 0;
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  return { value: Math.abs(next) / 2_147_483_647, state: next };
}

export function createSeedCommitment(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}

export function buildDeck(seed: string): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({
        id: `${suit}-${rank.label}`,
        rank: rank.label,
        suit,
        color: suit === "دل" || suit === "خشت" ? "red" : "black",
      });
    }
  }

  let randomState = hashToNumber(seed) || 1;
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const random = nextRandom(randomState);
    randomState = random.state;
    const swapIndex = Math.floor(random.value * (index + 1));
    [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
  }
  return cards;
}

export function createInitialTable(seed = "hokm-arena-phase-3"): TableState {
  const deck = buildDeck(seed);
  return {
    id: "arena-table",
    roomName: "میز شب‌نشینی",
    code: "۸۲۱۴",
    hand: deck.slice(0, 5),
    players: [
      { id: "player-shayda", name: "شیدا کریمی", seat: 0, team: "blue", connected: true, isHakem: true },
      { id: "player-navid", name: "نوید اکبری", seat: 1, team: "red", connected: true, isHakem: false },
      { id: "player-amir", name: "تو", seat: 2, team: "blue", connected: true, isHakem: false },
      { id: "player-sara", name: "سارا نادری", seat: 3, team: "red", connected: true, isHakem: false },
    ],
    trumpSuit: "دل",
    currentTurn: "player-amir",
    trick: 1,
    totalTricks: 7,
    teamScores: { blue: 0, red: 0 },
    lastPlayed: [],
    status: "در جریان",
    seedCommitment: createSeedCommitment(seed),
    seedRevealed: false,
    currentTrick: [],
  };
}

function rankStrength(card: Card): number {
  return RANKS.find((rank) => rank.label === card.rank)?.strength ?? 0;
}

function hasSuit(hand: Card[], suit: Suit): boolean {
  return hand.some((card) => card.suit === suit);
}

export function isLegalCard(state: TableState, card: Card): boolean {
  if (!state.leadSuit) return true;
  return card.suit === state.leadSuit || !hasSuit(state.hand, state.leadSuit);
}

export function getTrickWinner(trick: PlayedCard[], trumpSuit: Suit): PlayedCard {
  if (trick.length === 0) {
    throw new Error("Cannot choose a winner for an empty trick");
  }
  const leadSuit = trick[0].card.suit;
  return trick.reduce((winner, candidate) => {
    const candidateTrump = candidate.card.suit === trumpSuit;
    const winnerTrump = winner.card.suit === trumpSuit;
    if (candidateTrump !== winnerTrump) return candidateTrump ? candidate : winner;
    if (candidate.card.suit !== winner.card.suit) {
      return candidate.card.suit === leadSuit ? candidate : winner;
    }
    return rankStrength(candidate.card) > rankStrength(winner.card) ? candidate : winner;
  });
}

export function playCard(state: TableState, playerId: string, cardId: string): TableState {
  if (state.currentTurn !== playerId) {
    throw new RuleError("It is not your turn.", "NOT_YOUR_TURN");
  }
  const cardIndex = state.hand.findIndex((card) => card.id === cardId);
  if (cardIndex === -1) {
    throw new RuleError("That card is not in your hand.", "CARD_NOT_IN_HAND");
  }
  const card = state.hand[cardIndex];
  if (!isLegalCard(state, card)) {
    throw new RuleError("You must follow the lead suit.", "MUST_FOLLOW_SUIT");
  }

  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error("Player is not seated at this table.");

  const nextHand = state.hand.filter((_candidate, index) => index !== cardIndex);
  const nextTrick = [
    ...state.currentTrick,
    { card, playerId: player.id, playerName: player.name },
  ];
  const nextPlayer = state.players[(player.seat + 1) % state.players.length];
  const nextState: TableState = {
    ...state,
    hand: nextHand,
    currentTurn: nextPlayer.id,
    lastPlayed: [{ card, playerId: player.id, playerName: player.name }],
    leadSuit: state.leadSuit ?? card.suit,
    currentTrick: nextTrick,
  };

  if (nextTrick.length < state.players.length) return nextState;

  const winner = getTrickWinner(nextTrick, state.trumpSuit);
  const winningPlayer = state.players.find((candidate) => candidate.id === winner.playerId);
  if (!winningPlayer) throw new Error("Trick winner is not seated at this table.");
  const teamScores = { ...state.teamScores };
  teamScores[winningPlayer.team] += 1;
  const handFinished = state.trick >= state.totalTricks;
  return {
    ...nextState,
    trick: handFinished ? state.totalTricks : state.trick + 1,
    currentTurn: winner.playerId,
    teamScores,
    leadSuit: undefined,
    currentTrick: [],
    status: handFinished ? "دست تمام شد" : state.status,
  };
}