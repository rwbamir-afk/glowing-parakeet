import { createInitialTable, playCard, type TableState } from "./rules";

const tableState = createInitialTable();
const listeners = new Set<(state: TableState) => void>();

export function getTableState(): TableState {
  return tableState;
}

export function playTableCard(playerId: string, cardId: string): TableState {
  const updated = playCard(tableState, playerId, cardId);
  Object.assign(tableState, updated);
  for (const listener of listeners) listener(tableState);
  return tableState;
}

export function subscribeTable(listener: (state: TableState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}