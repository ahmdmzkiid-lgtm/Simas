const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'simas-jwt-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi' });
    }

    const user = await prisma.users.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, nama_lengkap: user.nama_lengkap },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, nama_lengkap: true, role: true },
    });

    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json(user);
  } catch (err) {
    return res.status(403).json({ message: 'Token tidak valid' });
  }
}

async function register(req, res, next) {
  try {
    const { username, password, nama_lengkap } = req.body;

    if (!username || !password || !nama_lengkap) {
      return res.status(400).json({ message: 'Username, password, dan nama lengkap wajib diisi' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    const existing = await prisma.users.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ message: 'Username sudah digunakan' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: { username, password_hash, nama_lengkap, role: 'pengurus' },
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, nama_lengkap: user.nama_lengkap },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, register, getMe };
