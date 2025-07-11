import { comparePassword, hashPassword } from "../libs/hash.js";
import { PrismaClient } from "@prisma/client";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../libs/jwt.js";

const prisma = new PrismaClient();

// 회원가입 시 email, password의 유효성 검사해야함
export const signup = async (req, res) => {
  const { email, password } = req.body;

  try {
    const isExistUser = await prisma.user.findUnique({ where: { email } });
    if (isExistUser) {
      return res.status(401).json({ message: "이미 존재하는 이메일입니다." });
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return res.status(201).json({ message: "회원가입이 완료되었습니다." });
  } catch (err) {
    console.error("회원가입 오류:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

export const signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res
        .status(401) // 401 Unauthorized
        .json({ message: "이메일 또는 비밀번호가 잘못되었습니다." });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "이메일 또는 비밀번호가 잘못되었습니다." });
    }

    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS 환경에서만 전송
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    return res.status(200).json({
      accessToken,
      email: user.email,
    });
  } catch (err) {
    console.error("로그인 오류:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
};

export const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "Refresh token 없음" });
  }

  try {
    const decoded = verifyRefreshToken(token);
    const newAccessToken = generateAccessToken({ userId: decoded.userId });

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("토큰 재발급 오류:", err);
    return res.status(401).json({ message: "Refresh token이 유효하지 않음" });
  }
};

export const getMe = async (req, res) => {
  const { userId } = req;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error("사용자 조회 오류:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getSession = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) return res.json({ isLoggedIn: false });

  try {
    const payload = verifyRefreshToken(token);
    const newAccessToken = generateAccessToken({ userId: payload.userId });

    return res.status(200).json({
      isLoggedIn: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.log("error : ", error);
    return res.json({ isLoggedIn: false });
  }
};

export const signout = async (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({ message: "로그아웃 성공" });
  } catch (err) {
    console.error("로그아웃 오류:", err);
    res.status(500).json({ message: err.message });
  }
};
