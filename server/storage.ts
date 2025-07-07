import { 
  users, projects, configurations, analyses,
  type User, type InsertUser,
  type Project, type InsertProject,
  type Configuration, type InsertConfiguration,
  type Analysis, type InsertAnalysis
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  
  // Configuration operations
  getConfiguration(id: number): Promise<Configuration | undefined>;
  getConfigurationsByProject(projectId: number): Promise<Configuration[]>;
  createConfiguration(config: InsertConfiguration): Promise<Configuration>;
  updateConfiguration(id: number, config: Partial<InsertConfiguration>): Promise<Configuration>;
  deleteConfiguration(id: number): Promise<void>;
  
  // Analysis operations
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAnalysesByProject(projectId: number): Promise<Analysis[]>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  updateAnalysis(id: number, analysis: Partial<InsertAnalysis>): Promise<Analysis>;
  deleteAnalysis(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: number, updateProject: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updateProject, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Configuration operations
  async getConfiguration(id: number): Promise<Configuration | undefined> {
    const [config] = await db.select().from(configurations).where(eq(configurations.id, id));
    return config || undefined;
  }

  async getConfigurationsByProject(projectId: number): Promise<Configuration[]> {
    return await db.select().from(configurations).where(eq(configurations.projectId, projectId));
  }

  async createConfiguration(insertConfig: InsertConfiguration): Promise<Configuration> {
    const [config] = await db
      .insert(configurations)
      .values(insertConfig)
      .returning();
    return config;
  }

  async updateConfiguration(id: number, updateConfig: Partial<InsertConfiguration>): Promise<Configuration> {
    const [config] = await db
      .update(configurations)
      .set(updateConfig)
      .where(eq(configurations.id, id))
      .returning();
    return config;
  }

  async deleteConfiguration(id: number): Promise<void> {
    await db.delete(configurations).where(eq(configurations.id, id));
  }

  // Analysis operations
  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id));
    return analysis || undefined;
  }

  async getAnalysesByProject(projectId: number): Promise<Analysis[]> {
    return await db.select().from(analyses).where(eq(analyses.projectId, projectId)).orderBy(desc(analyses.createdAt));
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const [analysis] = await db
      .insert(analyses)
      .values(insertAnalysis)
      .returning();
    return analysis;
  }

  async updateAnalysis(id: number, updateAnalysis: Partial<InsertAnalysis>): Promise<Analysis> {
    const [analysis] = await db
      .update(analyses)
      .set(updateAnalysis)
      .where(eq(analyses.id, id))
      .returning();
    return analysis;
  }

  async deleteAnalysis(id: number): Promise<void> {
    await db.delete(analyses).where(eq(analyses.id, id));
  }
}

export const storage = new DatabaseStorage();
