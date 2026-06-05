const db = require('./db'); // Make sure this file exports your MySQL connection

// Find user by email (used for login)
const findUserByEmail = async (email) => {
  const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0]; // return the first user found
};

// Find user by ID (used in auth middleware, etc.)
const findUserById = async (id) => {
  const [rows] = await db.promise().query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0];
};

// Register new user
const createUser = async (name, email, hashedPassword) => {
  const [result] = await db.promise().query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hashedPassword]
  );
  return result.insertId; // return the newly inserted user ID
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser
};
