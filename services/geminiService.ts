import { GoogleGenAI } from "@google/genai";

// Tell TypeScript that process might exist globally (injected by Vite)
declare const process: {
  env: {
    API_KEY?: string;
  };
};

export async function getMarketInsight(bondName: string, ytm: number) {
  // Use the API key from environment variables injected by Vite/Netlify
  const apiKey = process.env.API_KEY;
  
  // Safety check: if the user hasn't set the key in Netlify yet, show a status message
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.warn("VEGA: API_KEY is missing in environment variables.");
    return "MARKET LINK PENDING: Terminal awaiting API authentication via Netlify control panel.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional bond trader. Provide a very brief 2-sentence market analysis for ${bondName} yielding ${ytm.toFixed(2)}%. Use professional jargon like 'spreads', 'liquidity', or 'duration'.`,
    });
    
    return response.text || "Market stable. Watching for price action.";
  } catch (error: any) {
    console.error("VEGA API FAILURE:", error);
    return "INTELLIGENCE OFFLINE: Market data stream interrupted. Check terminal connection.";
  }
}