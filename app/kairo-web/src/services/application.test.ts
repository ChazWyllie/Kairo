/**
 * Tests for services/application.ts
 *
 * Covers: submitApplication (happy path, duplicate prevention, email side effects),
 * updateApplicationStatus (approve/reject, not found, email),
 * getApplicationByEmail (found, not found).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  mockPrisma,
  mockSendApplicationReceived,
  mockSendApplicationApproved,
  mockNotifyAdminNewApplication,
} from "@/test/setup";

import {
  submitApplication,
  updateApplicationStatus,
  getApplicationByEmail,
} from "@/services/application";

const BASE_INPUT = {
  email: "applicant@test.com",
  fullName: "Test Applicant",
  goal: "muscle",
};

const MOCK_APPLICATION = {
  id: "app_test_001",
  email: BASE_INPUT.email,
  fullName: BASE_INPUT.fullName,
  phone: null,
  age: null,
  height: null,
  currentWeight: null,
  goal: BASE_INPUT.goal,
  whyNow: null,
  trainingExperience: null,
  trainingFrequency: null,
  gymAccess: null,
  injuryHistory: null,
  nutritionStruggles: null,
  biggestObstacle: null,
  helpWithMost: null,
  preferredTier: null,
  readyForStructure: false,
  budgetComfort: null,
  status: "pending",
  createdAt: new Date("2026-03-01T00:00:00Z"),
  approvedAt: null,
  convertedToMember: false,
  isFoundingMember: false,
};

describe("submitApplication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendApplicationReceived.mockResolvedValue(undefined);
    mockNotifyAdminNewApplication.mockResolvedValue(undefined);
  });

  it("returns DUPLICATE when application already exists for email", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(MOCK_APPLICATION);

    const result = await submitApplication(BASE_INPUT);

    expect(result).toEqual({ ok: false, code: "DUPLICATE" });
    expect(mockPrisma.application.create).not.toHaveBeenCalled();
  });

  it("creates application and returns applicationId on success", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(null);
    mockPrisma.application.create.mockResolvedValue(MOCK_APPLICATION);

    const result = await submitApplication(BASE_INPUT);

    expect(result).toEqual({ ok: true, applicationId: MOCK_APPLICATION.id });
    expect(mockPrisma.application.create).toHaveBeenCalledOnce();
  });

  it("passes all required fields to Prisma create", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(null);
    mockPrisma.application.create.mockResolvedValue(MOCK_APPLICATION);

    await submitApplication({
      ...BASE_INPUT,
      phone: "555-0100",
      age: 28,
      goal: "fat_loss",
      preferredTier: "standard",
      readyForStructure: true,
    });

    const createArgs = mockPrisma.application.create.mock.calls[0][0].data;
    expect(createArgs.email).toBe(BASE_INPUT.email);
    expect(createArgs.fullName).toBe(BASE_INPUT.fullName);
    expect(createArgs.phone).toBe("555-0100");
    expect(createArgs.age).toBe(28);
    expect(createArgs.goal).toBe("fat_loss");
    expect(createArgs.preferredTier).toBe("standard");
    expect(createArgs.readyForStructure).toBe(true);
  });

  it("defaults optional fields to null when not provided", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(null);
    mockPrisma.application.create.mockResolvedValue(MOCK_APPLICATION);

    await submitApplication(BASE_INPUT);

    const createArgs = mockPrisma.application.create.mock.calls[0][0].data;
    expect(createArgs.phone).toBeNull();
    expect(createArgs.age).toBeNull();
    expect(createArgs.whyNow).toBeNull();
    expect(createArgs.readyForStructure).toBe(false);
  });

  it("fires sendApplicationReceived as fire-and-forget", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(null);
    mockPrisma.application.create.mockResolvedValue(MOCK_APPLICATION);

    await submitApplication(BASE_INPUT);

    // Give fire-and-forget a tick to execute
    await new Promise((r) => setTimeout(r, 0));
    expect(mockSendApplicationReceived).toHaveBeenCalledWith({
      email: BASE_INPUT.email,
      fullName: BASE_INPUT.fullName,
    });
  });

  it("fires notifyAdminNewApplication as fire-and-forget", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(null);
    mockPrisma.application.create.mockResolvedValue(MOCK_APPLICATION);

    await submitApplication(BASE_INPUT);

    await new Promise((r) => setTimeout(r, 0));
    expect(mockNotifyAdminNewApplication).toHaveBeenCalled();
  });
});

describe("updateApplicationStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendApplicationApproved.mockResolvedValue(undefined);
  });

  it("returns NOT_FOUND when application does not exist", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(null);

    const result = await updateApplicationStatus("nobody@test.com", "approved");

    expect(result).toEqual({ ok: false, code: "NOT_FOUND" });
    expect(mockPrisma.application.update).not.toHaveBeenCalled();
  });

  it("updates status and sets approvedAt when approving", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(MOCK_APPLICATION);
    mockPrisma.application.update.mockResolvedValue({
      ...MOCK_APPLICATION,
      status: "approved",
      approvedAt: new Date(),
    });

    const result = await updateApplicationStatus(BASE_INPUT.email, "approved");

    expect(result).toEqual({ ok: true });
    const updateArgs = mockPrisma.application.update.mock.calls[0][0];
    expect(updateArgs.data.status).toBe("approved");
    expect(updateArgs.data.approvedAt).toBeInstanceOf(Date);
  });

  it("updates status and clears approvedAt when rejecting", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(MOCK_APPLICATION);
    mockPrisma.application.update.mockResolvedValue({
      ...MOCK_APPLICATION,
      status: "rejected",
      approvedAt: null,
    });

    const result = await updateApplicationStatus(BASE_INPUT.email, "rejected");

    expect(result).toEqual({ ok: true });
    const updateArgs = mockPrisma.application.update.mock.calls[0][0];
    expect(updateArgs.data.status).toBe("rejected");
    expect(updateArgs.data.approvedAt).toBeNull();
  });

  it("sends approval email only when approving", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(MOCK_APPLICATION);
    mockPrisma.application.update.mockResolvedValue(MOCK_APPLICATION);

    await updateApplicationStatus(BASE_INPUT.email, "approved");

    await new Promise((r) => setTimeout(r, 0));
    expect(mockSendApplicationApproved).toHaveBeenCalledWith({
      email: BASE_INPUT.email,
      fullName: BASE_INPUT.fullName,
      preferredTier: null,
    });
  });

  it("does not send approval email when rejecting", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(MOCK_APPLICATION);
    mockPrisma.application.update.mockResolvedValue(MOCK_APPLICATION);

    await updateApplicationStatus(BASE_INPUT.email, "rejected");

    await new Promise((r) => setTimeout(r, 0));
    expect(mockSendApplicationApproved).not.toHaveBeenCalled();
  });
});

describe("getApplicationByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for unknown email", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(null);

    const result = await getApplicationByEmail("nobody@test.com");

    expect(result).toBeNull();
  });

  it("returns application data for known email", async () => {
    const selected = {
      id: MOCK_APPLICATION.id,
      fullName: MOCK_APPLICATION.fullName,
      status: MOCK_APPLICATION.status,
      preferredTier: MOCK_APPLICATION.preferredTier,
      createdAt: MOCK_APPLICATION.createdAt,
      approvedAt: MOCK_APPLICATION.approvedAt,
    };
    mockPrisma.application.findUnique.mockResolvedValue(selected);

    const result = await getApplicationByEmail(BASE_INPUT.email);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(MOCK_APPLICATION.id);
    expect(result!.fullName).toBe(MOCK_APPLICATION.fullName);
    expect(result!.status).toBe("pending");
  });
});
