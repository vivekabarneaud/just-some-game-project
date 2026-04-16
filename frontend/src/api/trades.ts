import type {
  CreateTradeOfferRequest,
  AcceptTradeOfferRequest,
  TradeListResponse,
  OwnTradeListResponse,
  TradeOfferResponse,
} from "@medieval-realm/shared";
import { apiFetch } from "./client";

export async function fetchTradeOffers(settlementId: string): Promise<TradeListResponse> {
  return apiFetch<TradeListResponse>(`/trades?settlementId=${settlementId}`);
}

export async function fetchOwnTrades(settlementId: string): Promise<OwnTradeListResponse> {
  return apiFetch<OwnTradeListResponse>(`/trades/mine?settlementId=${settlementId}`);
}

export async function createTradeOffer(req: CreateTradeOfferRequest): Promise<TradeOfferResponse> {
  return apiFetch<TradeOfferResponse>("/trades", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function acceptTradeOffer(tradeId: string, req: AcceptTradeOfferRequest): Promise<TradeOfferResponse> {
  return apiFetch<TradeOfferResponse>(`/trades/${tradeId}/accept`, {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function cancelTradeOffer(tradeId: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/trades/${tradeId}/cancel`, {
    method: "POST",
  });
}
