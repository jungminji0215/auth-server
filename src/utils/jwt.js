
import jwt from 'jsonwebtoken';

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;
const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export function generateAccessToken(payload) {
  return jwt.sign(payload, accessSecret, { expiresIn: accessExpiresIn });
}

export function generateRefreshToken(payload) {
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshExpiresIn });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret);
}

