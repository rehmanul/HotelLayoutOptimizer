import { pgTable, text, serial, integer, boolean, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id),
  dxfData: jsonb("dxf_data"),
  floorPlanImage: text("floor_plan_image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const configurations = pgTable("configurations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  name: text("name").notNull(),
  ilotDistribution: jsonb("ilot_distribution").notNull(), // {size0to1: 10, size1to3: 25, size3to5: 30, size5to10: 35}
  corridorWidth: real("corridor_width").notNull().default(1.5),
  minClearance: real("min_clearance").notNull().default(0.5),
  autoGenerateCorridors: boolean("auto_generate_corridors").notNull().default(true),
  spaceOptimization: boolean("space_optimization").notNull().default(true),
  avoidOverlaps: boolean("avoid_overlaps").notNull().default(true),
  respectConstraints: boolean("respect_constraints").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  configurationId: integer("configuration_id").references(() => configurations.id),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  zonesDetected: jsonb("zones_detected"), // walls, restricted, entrances
  ilotsPlaced: jsonb("ilots_placed"), // array of ilot objects with position, size
  corridorsGenerated: jsonb("corridors_generated"), // array of corridor objects
  totalIlots: integer("total_ilots").default(0),
  coverage: real("coverage").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
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
