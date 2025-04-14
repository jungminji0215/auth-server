import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        id: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({ posts });
  } catch (err) {
    console.error("게시글 조회 오류:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const createPost = async (req, res) => {
  const { content } = req.body;
  const { userId } = req;

  // TODO 유효성 검사 라이브러리
  try {
    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "내용은 필수입니다." });
    }

    const post = await prisma.post.create({
      data: {
        content,
        authorId: userId,
      },
    });

    return res.status(201).json({ post });
  } catch (err) {
    console.error("게시글 등록 오류:", err);
    return res.status(500).json({ message: err.message });
  }
};
