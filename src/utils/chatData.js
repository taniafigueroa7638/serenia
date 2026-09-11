const { encryptJson, decryptJson } = require('./encryption');

const messageContext = (conversationId, userId) => (
  `chat:conversation:${conversationId}:user:${userId}`
);

const encryptChatMessage = (content, conversationId, userId) => encryptJson(
  { content },
  messageContext(conversationId, userId)
);

const decryptChatMessageRow = (row, userId) => {
  const value = decryptJson(
    row.encrypted_data,
    messageContext(row.conversation_id, userId)
  );
  const { encrypted_data, ...publicRow } = row;
  return { ...publicRow, content: value.content };
};

module.exports = {
  encryptChatMessage,
  decryptChatMessageRow,
};
