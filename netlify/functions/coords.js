// netlify/functions/coords.js
// Node 18+ on Netlify обычно уже имеет fetch; если нет, можно установить node-fetch
exports.handler = async function(event, context) {
  try {
    const body = JSON.parse(event.body || '{}');

    // Секрет для защиты функции — задайте в Netlify UI как WEBHOOK_SECRET
    const expected = process.env.WEBHOOK_SECRET || '';
    const received = event.headers['x-webhook-secret'] || event.headers['X-Webhook-Secret'] || '';
    if (expected && received !== expected) {
      console.warn('Secret mismatch');
      return { statusCode: 401, body: JSON.stringify({ error: 'unauthorized' }) };
    }

    // TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID задаются в Environment variables на Netlify
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      console.error('Telegram token/chat id not configured');
      return { statusCode: 500, body: JSON.stringify({ error: 'server misconfig' }) };
    }

    const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown';

    const text = [
      '📍 Новая геопозиция',
      `Широта: ${body.latitude}`,
      `Долгота: ${body.longitude}`,
      `Точность (м): ${body.accuracy}`,
      `Высота (м): ${body.altitude}`,
      `Время (ms): ${body.timestamp}`,
      `IP: ${ip}`
    ].join('\n');

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = { chat_id: chatId, text: text };

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await resp.json();
    console.log('Telegram response:', result);

    return { statusCode: 200, body: JSON.stringify({ status: 'ok' }) };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'internal' }) };
  }
};
