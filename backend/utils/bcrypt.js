const bcrypt = require("bcryptjs");

const hashPassword = async (password) => {
  const rounds = Number(process.env.SALT_ROUND) || 10;
  return await bcrypt.hash(password, rounds);
};

const comparePasswords = async (plainTextPassword, hashedPassword) => {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};

module.exports = { hashPassword, comparePasswords };
