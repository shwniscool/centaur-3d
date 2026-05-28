"use client";
import { useSyncExternalStore } from "react";

export type SelectionPayload = {
  id: string;
  label: string;
  kind: string;
  scope: "internal" | "external" | "deployment";
  path?: string;
  purpose?: string;
  imports?: readonly string[];
  imported_by?: readonly string[];
  consumed_by?: readonly string[];
  sourceUrl?: string;
};

type Listener = () => void;
let current: SelectionPayload | null = null;
const listeners = new Set<Listener>();

export function select(p: SelectionPayload | null): void {
  current = p;
  for (const l of listeners) l();
}

function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot(): SelectionPayload | null {
  return current;
}

export function useSelection(): SelectionPayload | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
