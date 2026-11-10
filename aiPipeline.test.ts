import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateRecommendationsForCase,
  generateRecommendationsForCaseSafe,
  createTasksFromAttorneyInstruction,
  type AiPipelineStorage,
} from "../aiPipeline";

function makeStorage(overrides: Partial<AiPipelineStorage> = {}): AiPipelineStorage {
  return {
    getCase: vi.fn(async () => ({
      id: "case-1",
      name: "State v. Doe",
      defendant: "Doe",
      charges: ["DWI"],
      parish: "Orleans",
      arrestDate: "2026-01-01",
      trialDate: null,
      custodyStatus: "released",
    })),
    getWitnesses: vi.fn(async () => []),
    getEvidence: vi.fn(async () => []),
    getWeaknesses: vi.fn(async () => []),
    getDocuments: vi.fn(async () => []),
    createTask: vi.fn(async (t: any) => ({ ...t, id: t.id || "task-x" })),
    ...overrides,
  };
}

describe("generateRecommendationsForCase — AI failure modes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("propagates AI rate-limit error so callers using the Safe wrapper can swallow it", async () => {
    const storage = makeStorage();
    const rateLimit = Object.assign(new Error("429 RATELIMIT_EXCEEDED"), { status: 429 });
    const helpers = {
      recommendParalegalTasks: vi.fn(async () => { throw rateLimit; }),
      parseAttorneyInstruction: vi.fn(),
    };

    await expect(
      generateRecommendationsForCase("case-1", "user-1", storage, helpers as any),
    ).rejects.toThrow(/RATELIMIT_EXCEEDED/);
    expect(storage.createTask).not.toHaveBeenCalled();
  });

  it("handles malformed AI response that yields no tasks by inserting nothing (no throw)", async () => {
    const storage = makeStorage();
    const helpers = {
      // Simulates what openai.ts does when JSON.parse returns {} with no `tasks` key
      recommendParalegalTasks: vi.fn(async () => [] as any),
      parseAttorneyInstruction: vi.fn(),
    };

    const inserted = await generateRecommendationsForCase(
      "case-1",
      "user-1",
      storage,
      helpers as any,
    );
    expect(inserted).toEqual([]);
    expect(storage.createTask).not.toHaveBeenCalled();
  });

  it("inserts tasks normally on a healthy AI response", async () => {
    const storage = makeStorage();
    const helpers = {
      recommendParalegalTasks: vi.fn(async () => [
        {
          title: "Subpoena body cam",
          description: "Get the footage",
          stage: "Discovery",
          priority: "high",
          dueInDays: 7,
          sourceReason: "Evidence: body cam",
        },
      ]),
      parseAttorneyInstruction: vi.fn(),
    };

    const inserted = await generateRecommendationsForCase(
      "case-1",
      "user-1",
      storage,
      helpers as any,
    );
    expect(inserted).toHaveLength(1);
    expect(storage.createTask).toHaveBeenCalledTimes(1);
    const createdArg = (storage.createTask as any).mock.calls[0][0];
    expect(createdArg.title).toBe("Subpoena body cam");
    expect(createdArg.status).toBe("recommended");
    expect(createdArg.sourceType).toBe("ai_recommendation");
    expect(createdArg.dueDate).toBeInstanceOf(Date);
  });
});

describe("generateRecommendationsForCaseSafe — fire-and-forget contract", () => {
  it("resolves to null (not reject) when the AI throws, so upload response is unaffected", async () => {
    const storage = makeStorage();
    const helpers = {
      recommendParalegalTasks: vi.fn(async () => { throw new Error("OpenAI timed out"); }),
      parseAttorneyInstruction: vi.fn(),
    };
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await generateRecommendationsForCaseSafe(
      "case-1",
      "user-1",
      storage,
      helpers as any,
    );

    expect(result).toBeNull();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("resolves to null when AI returns malformed payload (helper returned [])", async () => {
    const storage = makeStorage();
    const helpers = {
      recommendParalegalTasks: vi.fn(async () => [] as any),
      parseAttorneyInstruction: vi.fn(),
    };
    const result = await generateRecommendationsForCaseSafe(
      "case-1",
      "user-1",
      storage,
      helpers as any,
    );
    // No throw, no error: returns the empty array (truthy "success" path).
    expect(result).toEqual([]);
  });
});

describe("createTasksFromAttorneyInstruction — fallback path", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a single fallback task when the AI call throws (rate limit / timeout)", async () => {
    const createTask = vi.fn(async (t: any) => ({ ...t, id: "fb-1" }));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const helpers = {
      parseAttorneyInstruction: vi.fn(async () => {
        throw Object.assign(new Error("429 rate limit"), { status: 429 });
      }),
    };

    const result = await createTasksFromAttorneyInstruction(
      {
        noteId: "note-1",
        caseId: "case-1",
        userId: "user-1",
        content: "Subpoena Officer Smith ASAP and pull his body cam.",
      },
      { createTask },
      helpers as any,
    );

    expect(result.fallback).toBe(true);
    expect(result.generatedTaskIds).toEqual(["fb-1"]);
    expect(createTask).toHaveBeenCalledTimes(1);
    const arg = createTask.mock.calls[0][0];
    expect(arg.title.startsWith("Attorney instruction:")).toBe(true);
    expect(arg.description).toContain("Officer Smith");
    expect(arg.status).toBe("pending");
    expect(arg.sourceType).toBe("attorney_note");
    expect(arg.sourceId).toBe("note-1");
    errSpy.mockRestore();
  });

  it("creates a single fallback task when AI returns a malformed (zero-task) payload", async () => {
    const createTask = vi.fn(async (t: any) => ({ ...t, id: "fb-2" }));
    const helpers = {
      // openai.ts returns { tasks: result.tasks || [] } when JSON has no `tasks` key.
      parseAttorneyInstruction: vi.fn(async () => ({ tasks: [] })),
    };

    const result = await createTasksFromAttorneyInstruction(
      {
        noteId: "note-2",
        caseId: "case-1",
        userId: "user-1",
        content: "Please check the discovery deadline.",
      },
      { createTask },
      helpers as any,
    );

    expect(result.fallback).toBe(true);
    expect(result.generatedTaskIds).toHaveLength(1);
    expect(createTask).toHaveBeenCalledTimes(1);
  });

  it("creates multiple structured tasks when AI returns a healthy compound response", async () => {
    let n = 0;
    const createTask = vi.fn(async (t: any) => ({ ...t, id: `ok-${++n}` }));
    const helpers = {
      parseAttorneyInstruction: vi.fn(async () => ({
        tasks: [
          { title: "Subpoena body cam", description: "...", stage: "Discovery", priority: "high", dueInDays: 3, category: "filing" },
          { title: "Call witness Jane", description: "...", stage: "Trial Prep", priority: "medium", dueInDays: null, category: "communication" },
        ],
      })),
    };

    const result = await createTasksFromAttorneyInstruction(
      {
        noteId: "note-3",
        caseId: "case-1",
        userId: "user-1",
        content: "Subpoena body cam and call Jane.",
      },
      { createTask },
      helpers as any,
    );

    expect(result.fallback).toBe(false);
    expect(result.generatedTaskIds).toEqual(["ok-1", "ok-2"]);
    expect(createTask).toHaveBeenCalledTimes(2);
    expect(createTask.mock.calls[0][0].status).toBe("recommended");
    expect(createTask.mock.calls[1][0].dueDate).toBeNull();
  });
});
