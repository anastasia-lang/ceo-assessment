import { scoringHints } from './content';

export function getStage1ScoringContext() {
  return {
    systemicIssue: scoringHints.stage1.systemicIssue,
    connectedMessages: scoringHints.stage1.connectedMessages,
    bestAnswerTraits: scoringHints.stage1.bestAnswerTraits,
    matrixGuidance: {
      "urgent-important": ["msg-4", "msg-1", "msg-7"],
      "important-not-urgent": ["msg-2", "msg-5"],
      "delegate": ["msg-6", "msg-8"],
      "acknowledge": ["msg-3"],
    },
  };
}

export function getStage2ScoringContext() {
  return scoringHints.stage2;
}

export function getStage3ScoringContext() {
  return scoringHints.stage3;
}

export function calculateTimeSpent(startedAt: string | null, submittedAt: string | null): string {
  if (!startedAt || !submittedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = new Date(submittedAt).getTime();
  const diffMs = end - start;
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export function wordCount(text: string | null | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}
