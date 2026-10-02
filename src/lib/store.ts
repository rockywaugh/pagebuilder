import { mkdir, readFile, readdir, rm, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { LIMITS } from "./config";
import type { Entitlements, Project, UserRecord } from "./types";

const ROOT = path.join(process.cwd(), "data");
const USERS = path.join(ROOT, "users.json");
const PROJECTS = path.join(ROOT, "projects");
const UPLOADS = path.join(ROOT, "uploads");

let writeLock: Promise<void> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeLock.then(fn, fn);
  writeLock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function ensureDirs() {
  await mkdir(PROJECTS, { recursive: true });
  await mkdir(UPLOADS, { recursive: true });
}

async function readUsers(): Promise<UserRecord[]> {
  await ensureDirs();
  try {
    const raw = await readFile(USERS, "utf8");
    return JSON.parse(raw) as UserRecord[];
  } catch {
    return [];
  }
}

async function writeUsers(users: UserRecord[]) {
  await ensureDirs();
  await writeFile(USERS, JSON.stringify(users, null, 2));
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const users = await readUsers();
  return users.find((user) => user.email === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const users = await readUsers();
  return users.find((user) => user.id === id) ?? null;
}

export async function saveUser(user: UserRecord): Promise<void> {
  await withLock(async () => {
    const users = await readUsers();
    const index = users.findIndex((item) => item.id === user.id);
    if (index === -1) users.push(user);
    else users[index] = user;
    await writeUsers(users);
  });
}

export function projectPath(id: string) {
  return path.join(PROJECTS, `${id}.json`);
}

export function uploadDir(projectId: string) {
  return path.join(UPLOADS, projectId);
}

export function uploadPath(projectId: string, assetId: string) {
  return path.join(UPLOADS, projectId, `${assetId}.webp`);
}

export async function saveProject(project: Project): Promise<void> {
  await withLock(async () => {
    await ensureDirs();
    project.updatedAt = new Date().toISOString();
    await writeFile(projectPath(project.id), JSON.stringify(project, null, 2));
  });
}

export async function loadProject(id: string): Promise<Project | null> {
  try {
    const raw = await readFile(projectPath(id), "utf8");
    const project = JSON.parse(raw) as Project;
    if (!project.wizard) {
      const started =
        project.messages.some((message) => message.role === "user") || !!project.spec.patternId;
      project.wizard = started ? "done" : "type";
    }
    return project;
  } catch {
    return null;
  }
}

export async function listAllProjects(): Promise<Project[]> {
  await ensureDirs();
  const files = await readdir(PROJECTS);
  const projects: Project[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const project = await loadProject(file.replace(/\.json$/, ""));
    if (project) projects.push(project);
  }
  return projects;
}

export async function listProjectsForOwner(ownerId: string): Promise<Project[]> {
  const projects = await listAllProjects();
  return projects
    .filter((project) => project.ownerId === ownerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteProject(id: string) {
  await withLock(async () => {
    try {
      await unlink(projectPath(id));
    } catch {
      // already gone
    }
    try {
      await rm(uploadDir(id), { recursive: true, force: true });
    } catch {
      // already gone
    }
  });
}

export async function attachProjectToUser(projectId: string, ownerId: string) {
  const project = await loadProject(projectId);
  if (!project) return null;
  project.ownerId = ownerId;
  await saveProject(project);
  return project;
}

export async function saveUpload(
  projectId: string,
  assetId: string,
  bytes: Buffer,
) {
  await mkdir(uploadDir(projectId), { recursive: true });
  await writeFile(uploadPath(projectId, assetId), bytes);
}

export async function readUpload(projectId: string, assetId: string) {
  try {
    return await readFile(uploadPath(projectId, assetId));
  } catch {
    return null;
  }
}

export async function deleteUpload(projectId: string, assetId: string) {
  try {
    await unlink(uploadPath(projectId, assetId));
  } catch {
    // already gone
  }
}

export function entitlementsFor(
  user: UserRecord | null,
  project: Project,
  pageCount = 1,
): Entitlements {
  const membership =
    !!user?.membership &&
    (!user.membershipUntil || new Date(user.membershipUntil) > new Date());
  const hostedLogin =
    !!user?.hostedLogin &&
    (!user.hostedLoginUntil || new Date(user.hostedLoginUntil) > new Date());
  const deployPlan =
    !!user?.deployPlan &&
    (!user.deployPlanUntil || new Date(user.deployPlanUntil) > new Date());

  return {
    exportUnlocked: project.exportUnlocked || membership,
    membership,
    hostedLogin,
    deployPlan,
    deploySlots: membership
      ? deployPlan
        ? LIMITS.deploySlotsPlan
        : LIMITS.deploySlotsDefault
      : 0,
    pageCount,
    pageLimit: membership ? LIMITS.pageLimit : LIMITS.freePageLimit,
  };
}
