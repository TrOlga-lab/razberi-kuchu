export type Action = "keep" | "sell" | "donate" | "recycle" | "discard";
export type Analysis = {
  mode: "demo" | "ai";
  message: string;
  items: { name: string; action: Action; reason: string; confidence: number | null }[];
};
