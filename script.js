// ---------------------------------------------------------------
// Northstar Support Bot — Support Deflection MVP
// Handles: order status, returns & refunds, stock availability
// ---------------------------------------------------------------

const messagesEl = document.getElementById('messages');
const composer = document.getElementById('composer');
const input = document.getElementById('userInput');
const quickReplies = document.getElementById('quickReplies');

// Tracks what the bot is waiting for (e.g. "awaiting order number")
let context = { awaiting: null };

// Mock "backend" data — swap these for real API calls when Northstar
// connects this to their order/inventory systems.
const MOCK_ORDERS = {
  '1001': { status: 'Shipped', eta: 'Aug 18' },
  '1002': { status: 'Processing', eta: 'Aug 20' },
  '1003': { status: 'Delivered', eta: 'Aug 12' },
};

const MOCK_STOCK = {
  'blue hoodie': { inStock: true, qty: 14 },
  'running shoes': { inStock: false, restock: 'Aug 22' },
  'canvas tote': { inStock: true, qty: 3 },
};

function addMessage(text, sender = 'bot') {
  const bubble = document.createElement('div');
  bubble.className = `msg ${sender}`;
  bubble.textContent = text;
  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showTyping() {
  const bubble = document.createElement('div');
  bubble.className = 'msg typing';
  bubble.id = 'typingBubble';
  bubble.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function hideTyping() {
  const bubble = document.getElementById('typingBubble');
  if (bubble) bubble.remove();
}

// Simulates network/thinking delay so replies feel real, then runs callback.
function botReply(text, delay = 600) {
  showTyping();
  setTimeout(() => {
    hideTyping();
    addMessage(text, 'bot');
  }, delay);
}

// ---- Intent detection from free text ----
function detectIntent(text) {
  const t = text.toLowerCase();
  if (/order|track|shipped|shipping|where is my|delivery/.test(t)) return 'order_status';
  if (/return|refund|exchange|money back/.test(t)) return 'returns';
  if (/stock|available|size|in store|do you have/.test(t)) return 'stock';
  return 'unknown';
}

// ---- Flow handlers ----
function startFlow(intent) {
  if (intent === 'order_status') {
    context.awaiting = 'order_number';
    botReply("Sure — what's your order number? (Try 1001, 1002, or 1003 to test.)");
  } else if (intent === 'returns') {
    context.awaiting = 'return_reason';
    botReply(
      "No problem. Returns are free within 30 days of delivery.\n\nWhat's the reason — wrong size, changed your mind, or item arrived damaged?"
    );
  } else if (intent === 'stock') {
    context.awaiting = 'stock_item';
    botReply("What item are you looking for? (Try 'blue hoodie' or 'running shoes' to test.)");
  } else {
    botReply(
      "I can help with order status, returns & refunds, or stock checks. Could you tell me a bit more, or tap one of the buttons below?"
    );
  }
}

function handleAwaiting(text) {
  const t = text.toLowerCase().trim();

  if (context.awaiting === 'order_number') {
    const order = MOCK_ORDERS[t.replace(/\D/g, '')];
    if (order) {
      botReply(`Order #${t} is currently: ${order.status}.\nEstimated arrival: ${order.eta}.`);
    } else {
      botReply("I couldn't find that order number in our test data. In production this would query Northstar's live order system. Want to try a return or stock check instead?");
    }
    context.awaiting = null;
    return;
  }

  if (context.awaiting === 'return_reason') {
    botReply(
      `Got it — noted as "${text}". Here's how to start your return:\n\n1. Go to Orders → select the item\n2. Choose "Start return"\n3. Print the prepaid label\n4. Drop it at any courier point\n\nRefunds land back on your original payment method in 5–7 business days.`
    );
    context.awaiting = null;
    return;
  }

  if (context.awaiting === 'stock_item') {
    const item = MOCK_STOCK[t];
    if (item) {
      botReply(
        item.inStock
          ? `Good news — "${text}" is in stock (${item.qty} left).`
          : `"${text}" is currently out of stock. Next restock: ${item.restock}.`
      );
    } else {
      botReply(`I don't have "${text}" in our test catalog. In production this would check Northstar's live inventory feed.`);
    }
    context.awaiting = null;
    return;
  }
}

function handleUserMessage(text) {
  addMessage(text, 'user');

  if (context.awaiting) {
    handleAwaiting(text);
    return;
  }

  const intent = detectIntent(text);
  startFlow(intent);
}

// ---- Wire up UI ----
composer.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  handleUserMessage(text);
});

quickReplies.addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  const label = btn.textContent.trim();
  addMessage(label, 'user');
  startFlow(btn.dataset.intent);
});

// ---- Greeting ----
window.addEventListener('DOMContentLoaded', () => {
  botReply(
    "Hi, I'm the Northstar support bot 👋\nI can check an order, start a return, or look up stock — no waiting for an agent.",
    300
  );
});