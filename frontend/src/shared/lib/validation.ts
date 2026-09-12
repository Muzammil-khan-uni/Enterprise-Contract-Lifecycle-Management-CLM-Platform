

export const EMAIL_VALIDATION = {
  pattern: {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    message: 'Enter a valid email address (e.g. name@company.com)',
  },
};

export const OPTIONAL_EMAIL_VALIDATION = {
  validate: (value: string | undefined) =>
    !value || EMAIL_VALIDATION.pattern.value.test(value) || EMAIL_VALIDATION.pattern.message,
};
