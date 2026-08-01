export type EmailPreset = {
  name: string;
  slug: string;
  category: string;
  subject: string;
  bodyHtml: string;
};

export const EMAIL_PRESETS: EmailPreset[] = [
  {
    name: "Intro",
    slug: "intro",
    category: "outreach",
    subject: "Great connecting, {{first_name}}",
    bodyHtml: `<p>Hi {{first_name}},</p>
<p>It was great connecting — I’d love to learn more about what you’re working on at {{company}} and see where I can help.</p>
<p>If it’s useful, I can share a few relevant examples and a simple next-step outline.</p>
<p>Looking forward to hearing from you.</p>`,
  },
  {
    name: "Follow-up",
    slug: "follow-up",
    category: "outreach",
    subject: "Following up — {{first_name}}",
    bodyHtml: `<p>Hi {{first_name}},</p>
<p>Just floating this back to the top of your inbox in case it got buried.</p>
<p>Happy to answer questions or jump on a quick call whenever works for you.</p>`,
  },
  {
    name: "Proposal",
    slug: "proposal",
    category: "sales",
    subject: "Proposal for {{company}}",
    bodyHtml: `<p>Hi {{first_name}},</p>
<p>Thanks again for the conversation. Here’s a clear proposal for next steps on the project:</p>
<ul>
<li><strong>Scope:</strong> [outline deliverables]</li>
<li><strong>Timeline:</strong> [weeks / milestones]</li>
<li><strong>Investment:</strong> [range or fixed fee]</li>
</ul>
<p>If this looks right, I can send a contract and kickoff checklist.</p>`,
  },
  {
    name: "Availability",
    slug: "availability",
    category: "scheduling",
    subject: "Scheduling time to chat",
    bodyHtml: `<p>Hi {{first_name}},</p>
<p>Would any of these times work for a quick call?</p>
<ul>
<li>[Day], [time] [timezone]</li>
<li>[Day], [time] [timezone]</li>
<li>[Day], [time] [timezone]</li>
</ul>
<p>If none of those fit, send a few windows that do and I’ll match them.</p>`,
  },
  {
    name: "Project kickoff",
    slug: "project-kickoff",
    category: "delivery",
    subject: "Kickoff — {{company}}",
    bodyHtml: `<p>Hi {{first_name}},</p>
<p>Excited to get started. Here’s what happens next:</p>
<ol>
<li>Review and sign the agreement (if you haven’t already)</li>
<li>Complete the project questionnaire in your portal</li>
<li>We’ll confirm timeline and first deliverables</li>
</ol>
<p>Reply with any questions — talk soon.</p>`,
  },
  {
    name: "Check-in",
    slug: "check-in",
    category: "delivery",
    subject: "Quick check-in on the project",
    bodyHtml: `<p>Hi {{first_name}},</p>
<p>Wanted to check in on how things are feeling so far and make sure we’re aligned on priorities.</p>
<p>Anything you’d like me to adjust, prioritize, or clarify this week?</p>`,
  },
];
