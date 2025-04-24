import { comparePassword, hashPassword } from "../libs/hash.js";
import { PrismaClient } from "@prisma/client";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../libs/jwt.js";

const prisma = new PrismaClient();

// TODO 회원가입 시 email, password의 유효성 검사
export const signup = async (req, res) => {
  const { email, password } = req.body;

  try {
    const isExistUser = await prisma.user.findUnique({ where: { email } });
    if (isExistUser) {
      return res.status(400).json({ message: "이미 존재하는 이메일입니다." });
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
    res.status(500).json({ message: err.message });
  }
};

export const signin = async (req, res) => {
  console.log("============ signin ============");
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res
        .status(400)
        .json({ message: "이메일 또는 비밀번호가 잘못되었습니다." });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
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
    res.status(500).json({ message: err.message });
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
    return res.status(403).json({ message: "Refresh token이 유효하지 않음" });
  }
};

// 	accessToken이 없거나 잘못됨 → auth 미들웨어에서 401 응답 처리되므로 getMe까지 도달하지 못함
// export const getMe = async (req, res) => {
//   const { userId } = req; // 나중에 auth 미들웨어에서 넣어줄 값
//
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { id: true, email: true },
//     });
//
//     if (!user) {
//       return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
//     }
//
//     const accessToken = generateAccessToken({ userId });
//
//     res.status(200).json({ user, accessToken });
//   } catch (err) {
//     console.error("사용자 조회 오류:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

export const getMe = async (req, res) => {
  // 1) HTTP Only 쿠키에서 리프레시 토큰 꺼내기
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "인증된 토큰이 없습니다." });
  }

  let payload;
  try {
    // 2) 리프레시 토큰 검증 (만료·위조 검사)
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    console.error("리프레시 토큰 검증 실패:", err);
    return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }

  const userId = payload.userId;
  try {
    // 3) 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // 4) 새 액세스 토큰 발급
    const newAccessToken = generateAccessToken({ userId });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS 환경에서만 전송
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    // 5) 본문에 유저 정보와 새 토큰 반환
    return res.status(200).json({ user, accessToken: newAccessToken });
  } catch (err) {
    console.error("사용자 조회 오류:", err);
    return res.status(500).json({ message: "서버 오류가 발생했습니다." });
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
