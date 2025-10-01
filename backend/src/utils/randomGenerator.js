export const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const generateNameNum = () => {
  return Math.floor(10 + Math.random() * 90).toString();
};

export const generateUsername = (name) =>
  name
    ? name
        .trim()
        .split(/\s+/)
        .reduce((a, b) => (a.length <= b.length ? a : b))
        .toLowerCase() +
      (Math.floor(Math.random() * 90) + 10)
    : "";
