export const companyContext = {
  name: "Payvio",
  industry: "Payment infrastructure / Payment orchestration",
  hq: "São Paulo, Brazil",
  markets: "Latin America (primary), expanding internationally",
  employees: "~350",
  stage: "Series C, $80M raised",
  ceo: "Marco Ferretti",
  description: `Payvio provides payment orchestration technology to merchants across Latin America, connecting them to 300+ payment methods, acquirers, and alternative payment providers through a single API integration. Think of it as the layer between merchants and the complex, fragmented payments ecosystem in LatAm.`,
  roleDescription: `You are being assessed for the role of Manager, CEO Office. This is a strategic role that sits at the intersection of the CEO and the rest of the organization — you'll drive strategic initiatives, provide operational oversight, and ensure the CEO has the visibility and intelligence needed to make decisions.`,
  assessmentDescription: `This assessment simulates a real day in the CEO Office. You'll face operational triage, strategic analysis, and an AI-assisted execution task. There are no trick questions — we're looking for how you think, prioritize, and communicate.`,
};

export const stages = [
  { number: 1, title: "Operational Triage", timeMinutes: 30 },
  { number: 2, title: "Strategic Business Case", timeMinutes: 50 },
  { number: 3, title: "AI-Powered Execution", timeMinutes: 40 },
];

export const stage1Items = [
  {
    id: "msg-1",
    type: "slack" as const,
    channel: "#integrations-alerts",
    sender: "Ricardo Mora",
    senderRole: "Integration Support Lead",
    timestamp: "Monday 8:12 AM",
    content:
      "Heads up — we have 3 merchants stuck in onboarding since last week. They've submitted integration requests but we're waiting on API credentials from the acquirers. I've pinged the partnerships team but no response yet. One of them (MercadoTech) is a $2M ARR prospect that Sales flagged as urgent.",
    category: "critical-operational",
    isPartOfSystemicIssue: true,
    priority: "high",
  },
  {
    id: "msg-2",
    type: "slack" as const,
    channel: "#ceo-office",
    sender: "Marco Ferretti",
    senderRole: "CEO",
    timestamp: "Monday 8:30 AM",
    content:
      "I need a one-pager on our competitive positioning vs. dLocal and Kushki for the board meeting next Thursday. Can you own this? Doesn't need to be a full analysis, just our key differentiators and where we're losing deals.",
    category: "ceo-strategic",
    isPartOfSystemicIssue: false,
    priority: "high",
  },
  {
    id: "msg-3",
    type: "email" as const,
    channel: "Email",
    sender: "Laura Chen",
    senderRole: "VP of Product",
    timestamp: "Monday 8:45 AM",
    content:
      "Can the CEO Office help us think through the pricing model for our new fraud prevention module? We're launching in Q3 and Product and Sales have very different views on whether it should be bundled or standalone. I don't think we need a full strategy sprint, but a facilitated session would help. No rush — next week is fine.",
    category: "strategic-facilitation",
    isPartOfSystemicIssue: false,
    priority: "medium",
  },
  {
    id: "msg-4",
    type: "slack" as const,
    channel: "#integrations-alerts",
    sender: "Ana Gutierrez",
    senderRole: "Integration Engineer",
    timestamp: "Monday 9:02 AM",
    content:
      "I just pulled the integration backlog report. Out of 127 active integration requests, 84 are blocked — 71 of them are flagged as 'awaiting credentials.' This has been building up over the last 6 weeks. I don't think anyone's been tracking this at the aggregate level.",
    category: "critical-systemic",
    isPartOfSystemicIssue: true,
    priority: "critical",
  },
  {
    id: "msg-5",
    type: "slack" as const,
    channel: "#general",
    sender: "Diego Vargas",
    senderRole: "Head of People",
    timestamp: "Monday 9:15 AM",
    content:
      "Reminder: Team Thermometer survey results are in. Overall engagement is 7.2/10, down from 7.8 last quarter. Biggest drops in 'clarity of direction' and 'cross-team collaboration.' Full report attached. Happy to walk through it with anyone who wants context.",
    category: "important-not-urgent",
    isPartOfSystemicIssue: false,
    priority: "medium",
  },
  {
    id: "msg-6",
    type: "slack" as const,
    channel: "#partnerships",
    sender: "Sofia Reyes",
    senderRole: "Partnerships Manager",
    timestamp: "Monday 9:30 AM",
    content:
      "Quick update — the Visa Direct integration partner meeting got moved to Wednesday. They want to discuss expanded coverage in Central America. Should I loop in Sales? Also, unrelated, but I've noticed we're getting a lot of credential requests from the integrations team lately. Not sure what's going on there but it's creating a bottleneck on our side.",
    category: "moderate-operational",
    isPartOfSystemicIssue: true,
    priority: "medium",
  },
  {
    id: "msg-7",
    type: "email" as const,
    channel: "Email",
    sender: "Carlos Mendoza",
    senderRole: "Regional Sales Director, Mexico",
    timestamp: "Monday 9:45 AM",
    content:
      "Hey — just FYI, we lost the Rappi deal. They went with dLocal. Main feedback was that our onboarding was too slow and they couldn't get live in time for their Q2 launch. Frustrating because the product fit was good. Can we do a post-mortem? I have notes from the last call.",
    category: "important-signal",
    isPartOfSystemicIssue: true,
    priority: "high",
  },
  {
    id: "msg-8",
    type: "slack" as const,
    channel: "#random",
    sender: "Miguel Torres",
    senderRole: "Marketing Manager",
    timestamp: "Monday 10:00 AM",
    content:
      "Does anyone know if we're sponsoring Money20/20 in Vegas this year? I'm getting pinged by the event organizers about booth space and need to confirm by Friday. Budget was approved last quarter but I don't have the final sign-off. @CEO-Office can you check?",
    category: "low-priority-delegate",
    isPartOfSystemicIssue: false,
    priority: "low",
  },
];

export const stage1Questions = [
  {
    key: "priority_matrix",
    title: "Priority Matrix",
    description:
      'Drag each inbox item into one of 4 quadrants based on how you would prioritize them.',
    type: "matrix" as const,
  },
  {
    key: "root_cause",
    title: "Root Cause Diagnosis",
    description:
      "Pick the 3 most critical items. For each, write 2-3 sentences: What's actually going on here? What's the root cause vs. the surface symptom?",
    type: "multi_text" as const,
    fields: [
      { key: "root_cause_1", label: "Critical Item 1" },
      { key: "root_cause_2", label: "Critical Item 2" },
      { key: "root_cause_3", label: "Critical Item 3" },
    ],
  },
  {
    key: "ceo_memo",
    title: "CEO Escalation Memo",
    description:
      "You've spotted a pattern across several of these items. Write a short memo to Marco (the CEO) flagging the systemic issue, why it matters, and your recommended next step.",
    type: "text" as const,
    maxWords: 250,
  },
];

export const matrixQuadrants = [
  { id: "urgent-important", label: "Urgent & Important", subtitle: "Act Now", color: "#e94560" },
  { id: "important-not-urgent", label: "Important, Not Urgent", subtitle: "Schedule", color: "#ff9f43" },
  { id: "delegate", label: "Delegate", subtitle: "Assign to Others", color: "#0f3460" },
  { id: "acknowledge", label: "Acknowledge / Low Priority", subtitle: "Note & Move On", color: "#16213e" },
];

export const uaeMarketData = {
  marketSize: {
    title: "UAE Digital Payments Market",
    rows: [
      { metric: "Total digital payments volume (2025)", value: "$53.2B" },
      { metric: "YoY growth rate", value: "14.7%" },
      { metric: "E-commerce share of digital payments", value: "38%" },
      { metric: "Cross-border payment volume", value: "$12.1B" },
      { metric: "Number of licensed payment processors", value: "47" },
      { metric: "Avg. merchant payment processing fee", value: "2.1% - 3.4%" },
      { metric: "Regulatory body", value: "Central Bank of UAE (CBUAE)" },
      { metric: "Key regulation", value: "Retail Payment Services & Card Schemes Regulation (2021)" },
      { metric: "License required", value: "Retail Payment Service Provider (RPSP) license" },
      { metric: "License timeline (estimated)", value: "6-12 months" },
      { metric: "Local entity requirement", value: "Yes — must establish local presence" },
      { metric: "Data residency requirement", value: "Payment data must be stored in UAE or approved jurisdictions" },
    ],
  },
  competitors: [
    {
      name: "Checkout.com",
      hq: "London, UK",
      uaePresence: "Established — licensed since 2020",
      strengths: "Strong enterprise relationships, full-stack solution, deep UAE regulatory knowledge",
      weaknesses: "Higher pricing, less flexible orchestration, limited LatAm coverage",
      estimatedUAERevenue: "$15-20M ARR",
    },
    {
      name: "Payfort (Amazon Payment Services)",
      hq: "Dubai, UAE",
      uaePresence: "Dominant local player — acquired by Amazon 2017",
      strengths: "Local brand trust, Amazon backing, deep integration with regional banks",
      weaknesses: "Legacy tech stack, limited orchestration, focused on acquiring not orchestrating",
      estimatedUAERevenue: "$40-50M ARR",
    },
    {
      name: "HyperPay",
      hq: "Riyadh, Saudi Arabia",
      uaePresence: "Growing — licensed 2022",
      strengths: "Regional expertise, Arabic-first, strong SMB segment",
      weaknesses: "Smaller scale, limited enterprise features, no orchestration layer",
      estimatedUAERevenue: "$8-12M ARR",
    },
  ],
  costEstimates: {
    title: "Estimated Entry Costs (Year 1)",
    rows: [
      { item: "RPSP License application + legal", cost: "$150K - $250K" },
      { item: "Local entity setup (DIFC or mainland)", cost: "$50K - $80K" },
      { item: "Local team (3-5 people: GM, BD, compliance, engineering)", cost: "$400K - $600K" },
      { item: "Cloud infrastructure (UAE region)", cost: "$60K - $100K" },
      { item: "Integration with local acquirers/PSPs (5-8 integrations)", cost: "$100K - $150K" },
      { item: "Marketing & events", cost: "$75K - $100K" },
      { item: "Total estimated Year 1 investment", cost: "$835K - $1.28M" },
    ],
  },
};

export const stakeholderThread = [
  {
    sender: "Paulo Andrade",
    role: "VP of Sales",
    message:
      "I'm bullish on UAE. The anchor client alone could be $500K ARR and they're ready to sign an LOI if we commit to a Q3 launch timeline. We're leaving money on the table by not being there. Every quarter we wait, Checkout.com deepens their moat. I say we go fast and figure out the regulatory stuff in parallel.",
    sentiment: "strongly_for",
  },
  {
    sender: "Laura Chen",
    role: "VP of Product",
    message:
      "I'm not against it, but I'm concerned about timeline. We'd need to build 5-8 new acquirer integrations, adapt our fraud rules for the region, and handle Arabic localization. That's at minimum 4 months of engineering time, and we're already behind on the fraud prevention module and the Zuora migration. If we commit to UAE, something else has to give. I need clarity on priorities.",
    sentiment: "cautious",
  },
  {
    sender: "Sofia Reyes",
    role: "Partnerships Manager",
    message:
      "I've been doing some preliminary outreach and the acquirer landscape in UAE is different from LatAm. The relationships are more formal, longer sales cycles, and you need a local presence to be taken seriously. I don't think we can do this remotely from São Paulo. Also — the RPSP license is not a rubber stamp. Two fintechs I spoke with said it took them 9-11 months. We need to start the application immediately if we're serious.",
    sentiment: "supportive_but_realistic",
  },
  {
    sender: "Martin Holz",
    role: "CFO",
    message:
      "The numbers can work if we hit $1.5M ARR by end of Year 2, which requires landing 3-4 enterprise clients beyond the anchor. But our runway isn't unlimited — we have 18 months of runway at current burn rate. A $1M+ bet on a new market needs to show traction within 6 months or we need an exit plan. I'd want clear milestones and a kill switch.",
    sentiment: "conditional",
  },
];

export const stage2Questions = [
  {
    key: "strategic_recommendation",
    title: "Strategic Recommendation",
    description:
      "Should Payvio enter the UAE market? Present your recommendation with a clear go/no-go (or conditional go) framework. Consider the market opportunity, competitive landscape, regulatory requirements, resource constraints, and stakeholder concerns.",
    type: "richtext" as const,
    targetWords: 500,
  },
  {
    key: "financial_sketch",
    title: "Financial Sketch",
    description:
      "Provide a rough revenue model or business case outline. What assumptions are you making? What does the path to breakeven look like? You can use plain text, a table, or upload a spreadsheet.",
    type: "richtext_with_upload" as const,
    targetWords: 300,
  },
  {
    key: "stakeholder_alignment",
    title: "Stakeholder Alignment Plan",
    description:
      "Sales wants to move fast, Product is capacity-constrained, Partnerships flags the licensing timeline, and Finance wants milestones with a kill switch. How do you get these four stakeholders aligned? What process would you run?",
    type: "richtext" as const,
    targetWords: 300,
  },
];

export const stage3Brief = {
  sender: "Marco Ferretti",
  senderRole: "CEO",
  channel: "Direct Message",
  content: `I need a board-ready briefing on where we stand competitively in LatAm. The board meeting is Thursday. I need:
- Who are our top 3-4 competitors and how we compare
- Where we're winning and where we're losing deals
- What our key differentiators are (and which ones are defensible)
- A clear 'so what' — what should we be doing differently?

Use AI tools. Use Claude, ChatGPT, whatever you want. I don't care how you get there as long as the output is sharp and the thinking is yours. 2-3 pages max.`,
};

export const stage3Competitors = [
  {
    name: "dLocal",
    hq: "Uruguay",
    description: "Public company, full-stack payments for global merchants entering LatAm",
  },
  {
    name: "Kushki",
    hq: "Ecuador/US",
    description: "Payment infrastructure focused on LatAm",
  },
  {
    name: "EBANX",
    hq: "Brazil",
    description: "Payment processing for global commerce in LatAm",
  },
  {
    name: "Mercado Pago",
    hq: "Argentina",
    description: "Mercado Libre's payments arm, massive consumer base",
  },
];

export const stage3Differentiators = [
  "True orchestration layer (not an acquirer — we sit above acquirers)",
  "300+ payment method connections",
  "Smart routing that optimizes authorization rates",
  "Single API for all of LatAm (vs. country-by-country integrations)",
  "Real-time payment analytics dashboard",
];

export const stage3Questions = [
  {
    key: "board_briefing",
    title: "Board Briefing",
    description:
      "Paste or write your board-ready competitive positioning briefing here. 2-3 pages.",
    type: "richtext" as const,
  },
  {
    key: "ai_reflection",
    title: "AI Reflection",
    description:
      "How did you use AI tools in this task? What did you draft yourself vs. delegate to AI? What would you improve with more time?",
    type: "text" as const,
    maxWords: 200,
  },
];

export const scoringHints = {
  stage1: {
    systemicIssue:
      "Integration credentials bottleneck → 71/127 requests blocked → partnerships team overwhelmed → caused Rappi deal loss → 3 more merchants stuck",
    connectedMessages: ["msg-1", "msg-4", "msg-6", "msg-7"],
    bestAnswerTraits: [
      "Connects dots across messages, not treating them as isolated items",
      "Identifies the credential bottleneck as systemic, not just operational",
      "Links the Rappi loss to the onboarding delays",
      "Proposes concrete next steps (not just 'investigate')",
    ],
  },
  stage2: {
    keyConsiderations: [
      "Addresses go/conditional-go/no-go clearly",
      "Considers 18-month runway constraint",
      "Accounts for licensing timeline (9-11 months)",
      "Balances opportunity vs. resource constraints",
      "Proposes clear milestones and kill switch criteria",
    ],
  },
  stage3: {
    keyTraits: [
      "Board-appropriate tone and structure",
      "Clear competitive comparison",
      "Honest about weaknesses, not just strengths",
      "Actionable recommendations",
      "Transparent about AI usage",
    ],
  },
};
