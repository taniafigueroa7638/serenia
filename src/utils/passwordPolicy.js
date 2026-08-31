const PASSWORD_MIN_LENGTH = 8;

const evaluatePassword = (password = '') => ({
  minLength: password.length >= PASSWORD_MIN_LENGTH,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /[0-9]/.test(password),
});

const passwordMeetsPolicy = (password = '') => (
  Object.values(evaluatePassword(password)).every(Boolean)
);

module.exports = {
  PASSWORD_MIN_LENGTH,
  evaluatePassword,
  passwordMeetsPolicy,
};
