// ralph-starter - Ralph Wiggum made easy
export const version = '0.4.1';
export const name = 'ralph-starter';

// Automation
export { createPullRequest, gitCommit, gitPush, isGitRepo } from './automation/git.js';
export type { WorktreeInfo } from './automation/worktree.js';
export {
  cleanupAllWorktrees,
  createWorktree,
  listRalphWorktrees,
  listWorktrees,
  mergeWorktreeBranch,
  removeWorktree,
} from './automation/worktree.js';
export { configCommand } from './commands/config.js';
export { initCommand } from './commands/init.js';
export { planCommand } from './commands/plan.js';
// Commands
export { runCommand } from './commands/run.js';
export { skillCommand } from './commands/skill.js';
export { sourceCommand } from './commands/source.js';
// Config
export { getApiKey, readConfig, writeConfig } from './config/manager.js';
export type { OpenRouterModelInfo } from './llm/openrouter-models.js';
export { fetchOpenRouterModels, getModelPricing } from './llm/openrouter-models.js';
export type { LLMProvider } from './llm/providers.js';
// LLM
export { OPENROUTER_MODEL_ALIASES, resolveOpenRouterModel } from './llm/providers.js';
export type { Agent, AgentType } from './loop/agents.js';
export { detectAvailableAgents, detectBestAgent } from './loop/agents.js';
export type { CircuitBreakerConfig, CircuitBreakerState } from './loop/circuit-breaker.js';
// Loop
export { CircuitBreaker } from './loop/circuit-breaker.js';
export type {
  CostTrackerConfig,
  CostTrackerStats,
  IterationCost,
  ModelPricing,
  PlanBudget,
} from './loop/cost-tracker.js';
export { CostTracker, resolveModelPricing } from './loop/cost-tracker.js';
export type { IterationUpdate, LoopOptions, LoopResult } from './loop/executor.js';
export { runLoop } from './loop/executor.js';
export type { SwarmAgentResult, SwarmConfig, SwarmResult, SwarmStrategy } from './loop/swarm.js';
export { runSwarm } from './loop/swarm.js';
export { detectValidationCommands, runAllValidations, runValidation } from './loop/validation.js';
export type { InitCoreOptions, InitCoreResult } from './mcp/core/init.js';
export { initCore } from './mcp/core/init.js';
export type { PlanCoreOptions, PlanCoreResult } from './mcp/core/plan.js';
export { planCore } from './mcp/core/plan.js';
export type { RunCoreOptions, RunCoreResult } from './mcp/core/run.js';
export { runCore } from './mcp/core/run.js';
// MCP
export { createMcpServer, startMcpServer } from './mcp/server.js';
// Presets (Hat System)
export type { PresetConfig } from './presets/index.js';
export {
  formatPresetsHelp,
  getPreset,
  getPresetNames,
  getPresetsByCategory,
  loadCustomPresets,
  PRESETS,
} from './presets/index.js';
// Sources
export {
  detectSource,
  fetchFromSource,
  getAllSources,
  getSource,
  getSourceHelp,
  getSourcesInfo,
  testSource,
} from './sources/index.js';
export type { InputSource, SourceInfo, SourceOptions, SourceResult } from './sources/types.js';
// Wizard
export { runIdeaMode, runWizard } from './wizard/index.js';
export type { IdeaContext, IdeaDiscoveryMethod, IdeaSuggestion } from './wizard/types.js';
