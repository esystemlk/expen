import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const getFinancialInsights = async (transactions: any[], profile: any) => {
  if (!navigator.onLine) return "You're currently offline. Smart insights will update when your connection is restored!";
  if (!process.env.GEMINI_API_KEY) return "Add your Gemini API key to get personalized financial insights.";

  const prompt = `
    You are a professional financial advisor. Analyze the following transaction data and user profile to provide 3 concise, actionable financial tips.
    
    User Profile:
    - Currency: ${profile?.currency}
    - Monthly Budgets: ${JSON.stringify(profile?.categoryBudgets)}
    
    Recent Transactions (last 20):
    ${JSON.stringify(transactions.slice(0, 20).map(t => ({
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date
    })))}
    
    Provide the tips in a friendly, encouraging tone. Keep each tip under 15 words.
    Return the response as a simple list of 3 bullet points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Keep tracking your expenses to see insights here!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to generate insights at the moment. Keep tracking!";
  }
};
