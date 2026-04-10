import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { getDb } from './db';
import {
  companyContext,
  stages,
  stage1Items,
  stage1Questions,
  stage2Questions,
  stage3Brief,
  stage3Questions,
  scoringHints,
  uaeMarketData,
  stakeholderThread,
} from './content';

interface ScoreDimension {
  score: number;
  rationale: string;
}

export interface EvaluationResult {
  scores: {
    pattern_recognition: ScoreDimension;
    prioritization: ScoreDimension;
    ceo_communication: ScoreDimension;
    strategic_thinking: ScoreDimension;
    commercial_acumen: ScoreDimension;
    stakeholder_navigation: ScoreDimension;
    output_quality: ScoreDimension;
    ai_fluency: ScoreDimension;
    communication_quality: ScoreDimension;
    speed_quality_balance: ScoreDimension;
  };
  weighted_total: number;
  stage_narratives: {
    stage1: string;
    stage2: string;
    stage3: string;
  };
  hiring_memo: {
    recommendation: string;
    summary: string;
    key_strengths: string[];
    key_concerns: string[];
    comparison_to_ideal: string;
    interview_followups: string[];
  };
}

async function extractFileContent(filePath: string): Promise<string | null> {
  const fullPath = path.join(process.cwd(), 'data', filePath);
  if (!fs.existsSync(fullPath)) return null;

  const ext = path.extname(fullPath).toLowerCase();
  try {
    if (ext === '.pdf') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(fullPath);
      const data = await pdfParse(buffer);
      return data.text;
    }
    if (ext === '.docx') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ path: fullPath });
      return result.value;
    }
    if (ext === '.xlsx') {
      const XLSX = await import('xlsx');
      const workbook = XLSX.readFile(fullPath);
      const sheets: string[] = [];
      for (const name of workbook.SheetNames) {
        const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name]);
        sheets.push(`[Sheet: ${name}]\n${csv}`);
      }
      return sheets.join('\n\n');
    }
    if (ext === '.csv') {
      return fs.readFileSync(fullPath, 'utf-8');
    }
    if (ext === '.pptx') {
      return `[PPTX file uploaded: ${path.basename(fullPath)} — text extraction not supported for this format]`;
    }
  } catch (err) {
    console.error(`Failed to extract content from ${filePath}:`, err);
    return `[File uploaded: ${path.basename(fullPath)} — extraction failed]`;
  }
  return null;
}

function buildEvaluationPrompt(responses: Record<string, unknown>[], fileContents: Record<string, string>): string {
  const responsesByStage: Record<number, Record<string, unknown>[]> = { 1: [], 2: [], 3: [] };
  for (const r of responses) {
    const stage = r.stage as number;
    if (responsesByStage[stage]) {
      responsesByStage[stage].push(r);
    }
  }

  let prompt = `You are an expert hiring evaluator for a CEO Office Manager role at a payments company. You are evaluating a candidate's responses to a timed 75-minute assessment. The assessment simulates real CEO Office challenges.

## COMPANY CONTEXT
${companyContext.name} — ${companyContext.industry}. ${companyContext.description}

## SCORING RUBRIC

Score each dimension on a 1-10 scale:
- 1-3: Weak — misses the point, superficial, or incorrect
- 4-5: Below average — partially addresses the task but significant gaps
- 6-7: Good — solid work with some room for improvement
- 8-9: Strong — excellent work, demonstrates real capability
- 10: Exceptional — would impress a seasoned executive

## DIMENSIONS TO SCORE

### Stage 1: Operational Triage (Weight: 25%)
1. **Pattern Recognition (1-10):** Did they identify the systemic integration/credentials bottleneck connecting messages msg-1, msg-4, msg-6, and msg-7? Did they see that the Rappi deal loss (msg-7) is a CONSEQUENCE of the same root cause?
2. **Prioritization Quality (1-10):** Is their priority matrix sensible? Did they correctly identify msg-2 (CEO request) and msg-4 (systemic data) as top priorities? Did they correctly deprioritize msg-8 (conference sponsorship)?
3. **CEO Communication (1-10):** Is the escalation memo concise, clear, and action-oriented? Does it frame the issue in business impact terms (deal loss, revenue risk) not just operational terms?

### Stage 2: Strategic Business Case (Weight: 35%)
4. **Strategic Thinking (1-10):** Is the UAE recommendation well-reasoned? Does it consider market size, competitive landscape, regulatory timeline, and resource constraints? Is there a clear framework (not just "yes" or "no" but conditions, phasing, milestones)?
5. **Commercial Acumen (1-10):** Does the financial sketch show understanding of unit economics, investment vs. return, and path to breakeven? Are the assumptions explicit and reasonable?
6. **Stakeholder Navigation (1-10):** Does the alignment plan address each stakeholder's concern specifically? Does it propose a process (not just "we should align") — e.g., a structured meeting, decision framework, phased approach that gives each party what they need?

### Stage 3: AI-Powered Execution (Weight: 25%)
7. **Output Quality (1-10):** Is the board briefing actually board-ready? Clear structure, executive summary, data-backed points, actionable "so what"? Would you put this in front of a board?
8. **AI Fluency (1-10):** Based on their reflection — did they use AI thoughtfully? Did they add their own judgment, edit the output, structure the narrative? Or did they just copy-paste? Deduct points for uncritical AI usage.

### Cross-Cutting (Weight: 15%)
9. **Communication Quality (1-10):** Across all stages — is the writing clear, concise, and professional? Does it show executive communication skills?
10. **Speed vs. Quality Balance (1-10):** Given the time constraints, did they make smart trade-offs about where to go deep vs. where to stay high-level?

---

## ASSESSMENT CONTENT & CANDIDATE RESPONSES

### STAGE 1: Operational Triage (${stages[0].timeMinutes} minutes)

**Scenario:** The candidate received ${stage1Items.length} inbox items (Slack messages and emails) and had to triage them.

**Inbox items provided:**
${stage1Items.map(item => `- ${item.id} [${item.type}] from ${item.sender} (${item.senderRole}): "${item.content}"`).join('\n')}

**Known systemic issue:** ${scoringHints.stage1.systemicIssue}
**Connected messages:** ${scoringHints.stage1.connectedMessages.join(', ')}

**Questions asked:**
${stage1Questions.map(q => `- ${q.key}: ${q.description}`).join('\n')}

**Candidate's Stage 1 Responses:**
`;

  for (const r of responsesByStage[1]) {
    const key = r.question_key as string;
    if (key.endsWith('_file')) continue; // file content appended to parent key
    prompt += `\n**${key}:**\n`;
    if (r.response_json) {
      prompt += `${r.response_json}\n`;
    }
    if (r.response_text) {
      prompt += `${r.response_text}\n`;
    }
    if (!r.response_text && !r.response_json) {
      prompt += `[No response provided]\n`;
    }
    if (fileContents[`1_${key}`]) {
      prompt += `\n[UPLOADED FILE]\n${fileContents[`1_${key}`]}\n`;
    }
  }

  prompt += `
### STAGE 2: Strategic Business Case (${stages[1].timeMinutes} minutes)

**Scenario:** The candidate was asked to evaluate whether Payvio should enter the UAE market.

**Market data provided:** UAE digital payments market ($53.2B, 14.7% YoY growth), estimated Year 1 investment $835K-$1.28M.

**Competitor landscape:**
${uaeMarketData.competitors.map(c => `- ${c.name}: ${c.uaePresence}. Strengths: ${c.strengths}. Weaknesses: ${c.weaknesses}`).join('\n')}

**Stakeholder positions:**
${stakeholderThread.map(s => `- ${s.sender} (${s.role}, ${s.sentiment}): "${s.message}"`).join('\n')}

**Key evaluation considerations:** ${scoringHints.stage2.keyConsiderations.join('; ')}

**Questions asked:**
${stage2Questions.map(q => `- ${q.key}: ${q.description}`).join('\n')}

**Candidate's Stage 2 Responses:**
`;

  for (const r of responsesByStage[2]) {
    const key = r.question_key as string;
    if (key.endsWith('_file')) continue;
    prompt += `\n**${key}:**\n`;
    if (r.response_text) {
      prompt += `${r.response_text}\n`;
    }
    if (r.response_json) {
      prompt += `${r.response_json}\n`;
    }
    if (!r.response_text && !r.response_json) {
      prompt += `[No response provided]\n`;
    }
    if (fileContents[`2_${key}`]) {
      prompt += `\n[UPLOADED FILE]\n${fileContents[`2_${key}`]}\n`;
    }
  }

  prompt += `
### STAGE 3: AI-Powered Execution (${stages[2].timeMinutes} minutes)

**Scenario:** The CEO asked for a board-ready competitive positioning briefing.

**CEO's brief:** "${stage3Brief.content}"

**Key traits to look for:** ${scoringHints.stage3.keyTraits.join('; ')}

**Questions asked:**
${stage3Questions.map(q => `- ${q.key}: ${q.description}`).join('\n')}

**Candidate's Stage 3 Responses:**
`;

  for (const r of responsesByStage[3]) {
    const key = r.question_key as string;
    if (key.endsWith('_file')) continue;
    prompt += `\n**${key}:**\n`;
    if (r.response_text) {
      prompt += `${r.response_text}\n`;
    }
    if (r.response_json) {
      prompt += `${r.response_json}\n`;
    }
    if (!r.response_text && !r.response_json) {
      prompt += `[No response provided]\n`;
    }
    if (fileContents[`3_${key}`]) {
      prompt += `\n[UPLOADED FILE]\n${fileContents[`3_${key}`]}\n`;
    }
  }

  prompt += `

## WHAT TO RETURN

Return a JSON object with exactly this structure (no markdown, no code fences, just the JSON):

{
  "scores": {
    "pattern_recognition": { "score": <1-10>, "rationale": "<2-3 sentences>" },
    "prioritization": { "score": <1-10>, "rationale": "<2-3 sentences>" },
    "ceo_communication": { "score": <1-10>, "rationale": "<2-3 sentences>" },
    "strategic_thinking": { "score": <1-10>, "rationale": "<2-3 sentences>" },
    "commercial_acumen": { "score": <1-10>, "rationale": "<2-3 sentences>" },
    "stakeholder_navigation": { "score": <1-10>, "rationale": "<2-3 sentences>" },
    "output_quality": { "score": <1-10>, "rationale": "<2-3 sentences>" },
    "ai_fluency": { "score": <1-10>, "rationale": "<2-3 sentences>" },
    "communication_quality": { "score": <1-10>, "rationale": "<2-3 sentences>" },
    "speed_quality_balance": { "score": <1-10>, "rationale": "<2-3 sentences>" }
  },
  "weighted_total": <calculated weighted score out of 100>,
  "stage_narratives": {
    "stage1": "<3-5 sentence narrative assessment of Stage 1 performance>",
    "stage2": "<3-5 sentence narrative assessment of Stage 2 performance>",
    "stage3": "<3-5 sentence narrative assessment of Stage 3 performance>"
  },
  "hiring_memo": {
    "recommendation": "<STRONG YES | YES | MAYBE | LEAN NO | NO>",
    "summary": "<2-3 sentence overall assessment — who is this candidate?>",
    "key_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "key_concerns": ["<concern 1>", "<concern 2>"],
    "comparison_to_ideal": "<2-3 sentences on how they compare to the ideal CEO Office Manager profile: someone who can spot operational issues, think strategically, navigate stakeholders, communicate at board level, and leverage AI effectively>",
    "interview_followups": ["<suggested follow-up question 1 based on their specific responses>", "<question 2>", "<question 3>"]
  }
}`;

  return prompt;
}

function persist(db: import('sql.js').Database): void {
  const fs = require('fs');
  const path = require('path');
  const DB_PATH = path.join(process.cwd(), 'data', 'assessment.db');
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export async function evaluateCandidate(sessionId: string): Promise<EvaluationResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('ANTHROPIC_API_KEY not configured — skipping evaluation for session:', sessionId);
    return null;
  }

  const db = await getDb();

  // Check for existing evaluation
  const existingStmt = db.prepare('SELECT * FROM evaluations WHERE session_id = ?');
  existingStmt.bind([sessionId]);
  let existing: Record<string, unknown> | undefined;
  if (existingStmt.step()) {
    existing = existingStmt.getAsObject() as Record<string, unknown>;
  }
  existingStmt.free();

  if (existing) {
    return {
      scores: JSON.parse(existing.scores_json as string),
      weighted_total: existing.weighted_total as number,
      stage_narratives: JSON.parse(existing.stage_narratives_json as string),
      hiring_memo: JSON.parse(existing.hiring_memo_json as string),
    };
  }

  // Get all final responses, fall back to latest
  const finalStmt = db.prepare(
    'SELECT * FROM responses WHERE session_id = ? AND is_final_submission = 1 ORDER BY stage, question_key'
  );
  finalStmt.bind([sessionId]);
  const responses: Record<string, unknown>[] = [];
  while (finalStmt.step()) {
    responses.push({ ...finalStmt.getAsObject() });
  }
  finalStmt.free();

  if (responses.length === 0) {
    const latestStmt = db.prepare(
      `SELECT r1.* FROM responses r1
       INNER JOIN (
         SELECT session_id, stage, question_key, MAX(saved_at) as max_saved
         FROM responses WHERE session_id = ?
         GROUP BY session_id, stage, question_key
       ) r2 ON r1.session_id = r2.session_id
         AND r1.stage = r2.stage
         AND r1.question_key = r2.question_key
         AND r1.saved_at = r2.max_saved
       ORDER BY r1.stage, r1.question_key`
    );
    latestStmt.bind([sessionId]);
    while (latestStmt.step()) {
      responses.push({ ...latestStmt.getAsObject() });
    }
    latestStmt.free();
  }

  // Always merge in _file responses from latest that may not be marked final.
  // File uploads are saved via /api/save with is_final=0 and may never get
  // promoted to final if the stage was already submitted. Merge them in so
  // the evaluator always sees uploaded files.
  const existingKeys = new Set(responses.map(r => `${r.stage}_${r.question_key}`));
  const fileStmt = db.prepare(
    `SELECT r1.* FROM responses r1
     INNER JOIN (
       SELECT session_id, stage, question_key, MAX(saved_at) as max_saved
       FROM responses
       WHERE session_id = ? AND question_key LIKE '%_file' AND file_path IS NOT NULL
       GROUP BY session_id, stage, question_key
     ) r2 ON r1.session_id = r2.session_id
       AND r1.stage = r2.stage
       AND r1.question_key = r2.question_key
       AND r1.saved_at = r2.max_saved
     ORDER BY r1.stage, r1.question_key`
  );
  fileStmt.bind([sessionId]);
  while (fileStmt.step()) {
    const row = { ...fileStmt.getAsObject() } as Record<string, unknown>;
    const compositeKey = `${row.stage}_${row.question_key}`;
    if (!existingKeys.has(compositeKey)) {
      responses.push(row);
      existingKeys.add(compositeKey);
    }
  }
  fileStmt.free();

  if (responses.length === 0) {
    throw new Error('No responses found for session: ' + sessionId);
  }

  // Extract content from uploaded files
  const fileContents: Record<string, string> = {};
  for (const r of responses) {
    const key = r.question_key as string;
    const filePath = r.file_path as string | null;
    const stage = r.stage as number;
    if (key.endsWith('_file') && filePath) {
      const parentKey = key.replace(/_file$/, '');
      const content = await extractFileContent(filePath);
      if (content) {
        fileContents[`${stage}_${parentKey}`] = content;
      }
    }
  }

  const prompt = buildEvaluationPrompt(responses, fileContents);

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const rawText = message.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('');

  let evaluation: EvaluationResult;
  try {
    evaluation = JSON.parse(rawText);
  } catch {
    // Store raw response on parse failure
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO evaluations (session_id, scores_json, weighted_total, stage_narratives_json, hiring_memo_json, model_used, evaluated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        JSON.stringify({ _raw: rawText, _error: 'JSON parse failed' }),
        0,
        JSON.stringify({}),
        JSON.stringify({ recommendation: 'ERROR', summary: 'Evaluation produced invalid JSON. See raw output.' }),
        'claude-sonnet-4-20250514',
        now,
      ]
    );
    persist(db);
    throw new Error('Failed to parse evaluation JSON response');
  }

  // Store evaluation
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO evaluations (session_id, scores_json, weighted_total, stage_narratives_json, hiring_memo_json, model_used, evaluated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      sessionId,
      JSON.stringify(evaluation.scores),
      evaluation.weighted_total,
      JSON.stringify(evaluation.stage_narratives),
      JSON.stringify(evaluation.hiring_memo),
      'claude-sonnet-4-20250514',
      now,
    ]
  );
  persist(db);

  return evaluation;
}

export async function getEvaluation(sessionId: string): Promise<EvaluationResult | null> {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM evaluations WHERE session_id = ?');
  stmt.bind([sessionId]);
  let row: Record<string, unknown> | undefined;
  if (stmt.step()) {
    row = stmt.getAsObject() as Record<string, unknown>;
  }
  stmt.free();

  if (!row) return null;

  return {
    scores: JSON.parse(row.scores_json as string),
    weighted_total: row.weighted_total as number,
    stage_narratives: JSON.parse(row.stage_narratives_json as string),
    hiring_memo: JSON.parse(row.hiring_memo_json as string),
  };
}

export async function deleteEvaluation(sessionId: string): Promise<void> {
  const db = await getDb();
  db.run('DELETE FROM evaluations WHERE session_id = ?', [sessionId]);
  persist(db);
}
