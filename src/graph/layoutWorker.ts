/// <reference lib="webworker" />
import { layoutFamilyGraph, type LayoutOptions, type LayoutResult } from './familyLayout';

// Incoming message mirrors LayoutOptions
export type LayoutWorkerRequest = LayoutOptions;

// Outgoing message returns the full layout result
export type LayoutWorkerResponse = LayoutResult;

self.onmessage = (e: MessageEvent<LayoutWorkerRequest>) => {
  const result = layoutFamilyGraph(e.data);
  (self as unknown as Worker).postMessage(result);
};
