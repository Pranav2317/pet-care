const { GoogleGenAI } = require("@google/genai");
const Order = require("../models/Order");

const nodeFetch = global.fetch;
const NodeAbortController = global.AbortController;
const nodeSetTimeout = global.setTimeout;
const nodeClearTimeout = global.clearTimeout;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 30000;
const FALLBACK_MESSAGE =
  "I'm a bit busy right now — please wait a few seconds and try again! Or you can browse Gray Pet Shop products directly.";

const SYSTEM_PROMPT = `You are the AI customer service assistant for Gray Pet Shop, a store specializing in food, accessories, and supplies for dogs, cats, and other pets.

Role:
- Advise customers on products.
- Help find suitable products.
- Guide customers through purchasing and payment.
- Answer questions about orders.
- Introduce promotions when clear data is available.

Response style:
- Always polite, friendly, professional, and natural like a real customer service representative.
- Keep answers concise but informative.
- Refer to yourself as "Shop" or "I", and address customers as "Sir/Madam".
- Use emojis moderately.
- Do not respond mechanically or repeat unnecessary content.
- Do not display internal reasoning, <think>, </think>, or system analysis content.

Product advice rules:
- When customers ask about products generally, ask about their needs before making suggestions.
- Prioritize asking: pet type, age, weight, budget, intended use.
- When introducing products, mention product name, main benefits, suitable audience, price if data is available, and reasons to choose it.
- If price or stock data is unavailable, do not make it up. Say the Shop does not have accurate information and suggest Sir/Madam visit the Products page at /product.

Order rules:
- If customers ask about orders, request the order number first.
- You do not have direct access to order data in this conversation, so do not invent status, order date, payment, or delivery estimates.
- When data is missing, respond: "Sir/Madam, please provide your order number so the Shop can check and assist you as quickly as possible."

Complaint rules:
- Always show empathy.
- Ask for necessary information so the Shop can help investigate.

Safety rules:
- Do not invent product, order, promotion, price, or stock information.
- Do not promise to cure pet illnesses.
- Do not provide professional veterinary diagnoses.
- If related to pet health, recommend Sir/Madam consult a veterinarian.

When accurate data is unavailable, respond:
"At the moment the Shop does not have accurate information on this matter. Sir/Madam, please contact customer service for more detailed assistance."`;

const cleanBotMessage = (content) => {
  if (!content || typeof content !== "string") return "";

  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^[\s\S]*?<\/think>/i, "")
    .replace(/<\/?think>/gi, "")
    .replace(/Bạn/g, "Sir/Madam")
    .replace(/bạn/g, "Sir/Madam")
    .trim();
};

const buildMessages = (message, history) => [
  { role: "system", content: SYSTEM_PROMPT },
  ...history
    .filter((msg) => msg && typeof msg.content === "string")
    .map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    })),
  { role: "user", content: message.trim() },
];

const ORDER_STATUS_LABELS = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  shipped: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS = {
  pending: "Awaiting payment",
  unpaid: "Unpaid",
  paid: "Paid",
  failed: "Payment failed",
};

const PAYMENT_METHOD_LABELS = {
  cod: "Cash on delivery",
  banking: "Online payment/VNPay",
};

const extractOrderNumber = (message) => {
  const match = message.match(/#?(ORD[-A-Z0-9]+)/i);
  return match ? match[1].toUpperCase() : null;
};

const isOrderLookupMessage = (message) =>
  /(đơn hàng|don hang|mã đơn|ma don|kiểm tra đơn|kiem tra don|tra cứu đơn|tra cuu don|order|ORD-)/i.test(
    message
  );

const formatDate = (date) => {
  if (!date) return "No information available";
  return new Date(date).toLocaleString("en-US");
};

const formatMoney = (amount) =>
  `${Number(amount || 0).toLocaleString("en-US")} VND`;

const buildOrderLookupResponse = async (message) => {
  if (!isOrderLookupMessage(message)) return null;

  const orderNumber = extractOrderNumber(message);

  if (!orderNumber) {
    return {
      success: true,
      message:
        "Sir/Madam, please provide your order number so the Shop can check and assist you as quickly as possible.",
    };
  }

  const order = await Order.findOne({ orderNumber })
    .select(
      "orderNumber status totalPrice paymentMethod paymentStatus createdAt updatedAt"
    )
    .lean();

  if (!order) {
    return {
      success: true,
      message:
        "The Shop does not have accurate information for this order number. Sir/Madam, please double-check the order number or contact customer service for more detailed assistance.",
    };
  }

  return {
    success: true,
    message: [
      `The Shop has checked order ${order.orderNumber} for you:`,
      `• Order status: ${ORDER_STATUS_LABELS[order.status] || order.status}`,
      `• Order date: ${formatDate(order.createdAt)}`,
      `• Payment method: ${
        PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod
      }`,
      `• Payment status: ${
        PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus
      }`,
      `• Total: ${formatMoney(order.totalPrice)}`,
    ].join("\n"),
  };
};

const callOpenRouter = async (message, history) => {
  const controller = new NodeAbortController();
  const timeout = nodeSetTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  let response;

  try {
    response = await nodeFetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:5000",
          "X-Title": "Gray Pet Shop",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: buildMessages(message, history),
          temperature: 0.7,
          max_tokens: 300,
        }),
        signal: controller.signal,
      }
    );
  } finally {
    nodeClearTimeout(timeout);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `OpenRouter API Error ${response.status}: ${
        data?.error?.message || JSON.stringify(data)
      }`
    );
  }

  return cleanBotMessage(data.choices?.[0]?.message?.content);
};

const callGemini = async (message, history) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const contents = [
    ...history
      .filter((msg) => msg && typeof msg.content === "string")
      .map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    {
      role: "user",
      parts: [{ text: message.trim() }],
    },
  ];

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 400,
    },
  });

  return cleanBotMessage(response.text);
};

exports.handleChat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content cannot be empty",
      });
    }

    const orderLookupResponse = await buildOrderLookupResponse(message.trim());

    if (orderLookupResponse) {
      return res.json(orderLookupResponse);
    }

    if (!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "Chatbot API key is not configured.",
      });
    }

    const safeHistory = Array.isArray(history) ? history : [];
    const botMessage = process.env.OPENROUTER_API_KEY
      ? await callOpenRouter(message, safeHistory)
      : await callGemini(message, safeHistory);

    if (!botMessage) {
      throw new Error("AI provider returned an empty response");
    }

    res.json({
      success: true,
      message: botMessage,
    });
  } catch (error) {
    console.error("AI Chat API Error:", error.message);

    const errMsg = error.message || "";
    if (
      errMsg.includes("402") ||
      errMsg.includes("429") ||
      errMsg.includes("RESOURCE_EXHAUSTED") ||
      errMsg.includes("AbortError") ||
      errMsg.toLowerCase().includes("aborted") ||
      errMsg.toLowerCase().includes("timeout") ||
      errMsg.toLowerCase().includes("quota") ||
      errMsg.toLowerCase().includes("credit")
    ) {
      return res.status(503).json({
        success: false,
        message: FALLBACK_MESSAGE,
      });
    }

    res.status(500).json({
      success: false,
      message: "Sorry, the AI system encountered an error. Please try again later.",
      error: error.message,
    });
  }
};
