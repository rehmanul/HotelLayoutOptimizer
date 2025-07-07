import { pgTable, text, serial, integer, boolean, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("createdat").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("userid").references(() => users.id),
  dxfData: jsonb("dxfdata"),
  floorPlanImage: text("floorplanimage"),
  createdAt: timestamp("createdat").defaultNow(),
  updatedAt: timestamp("updatedat").defaultNow(),
});

export const configurations = pgTable("configurations", {
  id: serial("id").primaryKey(),
  projectId: integer("projectid").references(() => projects.id),
  name: text("name").notNull(),
  ilotDistribution: jsonb("ilotdistribution").notNull(), // {size0to1: 10, size1to3: 25, size3to5: 30, size5to10: 35}
  corridorWidth: real("corridorwidth").notNull().default(1.5),
  minClearance: real("minclearance").notNull().default(0.5),
  autoGenerateCorridors: boolean("autogeneratecorridors").notNull().default(true),
  spaceOptimization: boolean("spaceoptimization").notNull().default(true),
  avoidOverlaps: boolean("avoidoverlaps").notNull().default(true),
  respectConstraints: boolean("respectconstraints").notNull().default(true),
  createdAt: timestamp("createdat").defaultNow(),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  projectId: integer("projectid").references(() => projects.id),
  configurationId: integer("configurationid").references(() => configurations.id),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  zonesDetected: jsonb("zonesdetected"), // walls, restricted, entrances
  ilotsPlaced: jsonb("ilotsplaced"), // array of ilot objects with position, size
  corridorsGenerated: jsonb("corridorsgenerated"), // array of corridor objects
  totalIlots: integer("totalilots").default(0),
  coverage: real("coverage").default(0),
  createdAt: timestamp("createdat").defaultNow(),
  completedAt: timestamp("completedat"),
});

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  configurations: many(configurations),
  analyses: many(analyses),
}));

export const configurationsRelations = relations(configurations, ({ one, many }) => ({
  project: one(projects, {
    fields: [configurations.projectId],
    references: [projects.id],
  }),
  analyses: many(analyses),
}));

export const analysesRelations = relations(analyses, ({ one }) => ({
  project: one(projects, {
    fields: [analyses.projectId],
    references: [projects.id],
  }),
  configuration: one(configurations, {
    fields: [analyses.configurationId],
    references: [configurations.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  dxfData: true,
  floorPlanImage: true,
  userId: true,
});

export const insertConfigurationSchema = createInsertSchema(configurations).pick({
  projectId: true,
  name: true,
  ilotDistribution: true,
  corridorWidth: true,
  minClearance: true,
  autoGenerateCorridors: true,
  spaceOptimization: true,
  avoidOverlaps: true,
  respectConstraints: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).pick({
  projectId: true,
  configurationId: true,
  status: true,
  zonesDetected: true,
  ilotsPlaced: true,
  corridorsGenerated: true,
  totalIlots: true,
  coverage: true,
  completedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;
export type Configuration = typeof configurations.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;
