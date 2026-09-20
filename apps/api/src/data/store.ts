import { PrismaClient } from "@prisma/client";
import { config } from "../config.js";
import { id } from "../utils/ids.js";

type UserRecord = {
  id: string;
  email: string;
  passwordHash?: string | null;
  googleId?: string | null;
  name?: string | null;
  degree?: string | null;
  college?: string | null;
  targetRole?: string | null;
  languages: string[];
  onboarded: boolean;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ResumeRecord = {
  id: string;
  userId: string;
  fileName: string;
  fileUrl?: string | null;
  mimeType: string;
  rawText: string;
  createdAt: Date;
};

type AnyRecord = Record<string, unknown> & { id?: string; userId?: string; createdAt?: Date };

const prisma = config.databaseUrl ? new PrismaClient() : null;

const memory = {
  users: [] as UserRecord[],
  resumes: [] as ResumeRecord[],
  analyses: [] as AnyRecord[],
  chats: [] as AnyRecord[],
  interviews: [] as AnyRecord[],
  coding: [] as AnyRecord[],
  roadmaps: [] as AnyRecord[]
};

export const hasDatabase = Boolean(prisma);

function safeUser(user: UserRecord) {
  const { passwordHash: _passwordHash, googleId: _googleId, ...safe } = user;
  return safe;
}

export const store = {
  async findUserByEmail(email: string) {
    if (prisma) return prisma.user.findUnique({ where: { email } });
    return memory.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
  },

  async findUserById(userId: string) {
    if (prisma) return prisma.user.findUnique({ where: { id: userId } });
    return memory.users.find((user) => user.id === userId) ?? null;
  },

  safeUser,

  async createUser(input: { email: string; passwordHash?: string | null; googleId?: string | null; name?: string | null; avatarUrl?: string | null }) {
    if (prisma) return prisma.user.create({ data: { ...input, languages: [] } });
    const now = new Date();
    const user: UserRecord = { id: id("usr"), languages: [], onboarded: false, targetRole: "Software Engineer", createdAt: now, updatedAt: now, ...input };
    memory.users.push(user);
    return user;
  },

  async updateUser(userId: string, data: Partial<UserRecord>) {
    if (prisma) return prisma.user.update({ where: { id: userId }, data });
    const user = memory.users.find((item) => item.id === userId);
    if (!user) return null;
    Object.assign(user, data, { updatedAt: new Date() });
    return user;
  },

  async createResume(input: Omit<ResumeRecord, "id" | "createdAt">) {
    if (prisma) return prisma.resume.create({ data: input });
    const resume = { id: id("res"), createdAt: new Date(), ...input };
    memory.resumes.unshift(resume);
    return resume;
  },

  async latestResume(userId: string) {
    if (prisma) return prisma.resume.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
    return memory.resumes.find((resume) => resume.userId === userId) ?? null;
  },

  async createAnalysis(input: AnyRecord) {
    if (prisma) {
      const { id: _id, ...data } = input;
      return prisma.resumeAnalysis.create({ data: data as never });
    }
    const analysis = { ...input, id: id("ana"), createdAt: new Date() };
    memory.analyses.unshift(analysis);
    return analysis;
  },

  async latestAnalysis(userId: string) {
    if (prisma) return prisma.resumeAnalysis.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
    return memory.analyses.find((analysis) => analysis.userId === userId) ?? null;
  },

  async createChat(input: AnyRecord) {
    if (prisma) {
      const { id: _id, ...data } = input;
      return prisma.chatMessage.create({ data: data as never });
    }
    const message = { ...input, id: id("msg"), createdAt: new Date() };
    memory.chats.push(message);
    return message;
  },

  async chatHistory(userId: string) {
    if (prisma) return prisma.chatMessage.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, take: 80 });
    return memory.chats.filter((message) => message.userId === userId);
  },

  async createCoding(input: AnyRecord) {
    if (prisma) {
      const { id: _id, ...data } = input;
      return prisma.codingQuestion.create({ data: data as never });
    }
    const question = { ...input, id: id("code"), createdAt: new Date() };
    memory.coding.unshift(question);
    return question;
  },

  async codingHistory(userId: string) {
    if (prisma) return prisma.codingQuestion.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 });
    return memory.coding.filter((question) => question.userId === userId);
  },

  async createInterview(input: AnyRecord) {
    if (prisma) {
      const { id: _id, ...data } = input;
      return prisma.interview.create({ data: data as never });
    }
    const interview = { ...input, id: id("int"), createdAt: new Date() };
    memory.interviews.unshift(interview);
    return interview;
  },

  async interviewHistory(userId: string) {
    if (prisma) return prisma.interview.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 });
    return memory.interviews.filter((interview) => interview.userId === userId);
  },

  async upsertRoadmap(input: AnyRecord) {
    if (prisma) {
      return prisma.careerRoadmap.upsert({
        where: { userId: input.userId as string },
        update: { role: input.role as string, milestones: input.milestones as never },
        create: { userId: input.userId as string, role: input.role as string, milestones: input.milestones as never }
      });
    }
    const existing = memory.roadmaps.find((roadmap) => roadmap.userId === input.userId);
    if (existing) {
      Object.assign(existing, input, { updatedAt: new Date() });
      return existing;
    }
    const roadmap = { ...input, id: id("road"), createdAt: new Date(), updatedAt: new Date() };
    memory.roadmaps.unshift(roadmap);
    return roadmap;
  },

  async roadmap(userId: string) {
    if (prisma) return prisma.careerRoadmap.findUnique({ where: { userId } });
    return memory.roadmaps.find((roadmap) => roadmap.userId === userId) ?? null;
  }
};
