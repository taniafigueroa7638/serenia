const test = require('node:test');
const assert = require('node:assert/strict');
const { generateChatResponse } = require('../src/services/ai');

test('modo mock funciona sin una API key', async () => {
  const previous = process.env.AI_PROVIDER;
  process.env.AI_PROVIDER = 'mock';
  try {
    const response = await generateChatResponse({
      systemPrompt: 'test',
      messages: [{ role: 'user', content: 'Hola Serenia' }],
    });
    assert.equal(response.provider, 'mock');
    assert.match(response.text, /Hola Serenia/);
  } finally {
    if (previous === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = previous;
  }
});
