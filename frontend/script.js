const SOLUTION_PLAYBOOK = {
  password: (answers) => {
    const steps = [
      "Go to the IKEA password reset portal.",
      "Click 'Forgot Password / Unlock Account'.",
      "Enter your employee ID or company email.",
      "Complete identity verification.",
      "Create a new password.",
      "Wait 2 minutes and log in again.",
    ];
    if (answers.locked === true) {
      steps.splice(4, 0, "Wait 15 minutes if your account is locked.");
    }
    return {
      steps,
      level: answers.locked ? "L2" : "L1",
      confidence: answers.locked ? 90 : 95,
      escalate: answers.locked === true,
    };
  },
  system_access: () => ({
    steps: [
      "Check you are connected to VPN.",
      "Log out and restart the application.",
      "Clear browser cache.",
      "Log in again using SSO.",
      "Check your permissions.",
    ],
    level: "L2",
    confidence: 88,
    escalate: true,
  }),
  slow_computer: (answers) => ({
    steps: [
      "Restart your computer.",
      "Close unused applications.",
      "Check Task Manager for high CPU usage.",
      "Install system updates.",
      "Check disk space.",
    ],
    level: answers.after_restart ? "L1" : "L2",
    confidence: answers.after_restart ? 92 : 86,
    escalate: answers.after_restart === false,
  }),
  network_vpn: () => ({
    steps: [
      "Check Wi-Fi or Ethernet connection.",
      "Restart the network connection.",
      "Open VPN client.",
      "Enter corporate credentials.",
      "Reconnect to the VPN server.",
    ],
    level: "L2",
    confidence: 88,
    escalate: true,
  }),
  email: () => ({
    steps: [
      "Restart Outlook.",
      "Check internet connection.",
      "Check mailbox storage.",
      "Log out and log in again.",
      "Synchronize mailbox.",
    ],
    level: "L1",
    confidence: 91,
    escalate: false,
  }),
  software_install: (answers) => ({
    steps: [
      "Open Software Center.",
      "Search for the application.",
      "Click Install.",
      "Wait for installation to finish.",
      "Restart computer if prompted.",
    ],
    level: answers.admin_required ? "L2" : "L1",
    confidence: answers.admin_required ? 85 : 90,
    escalate: answers.admin_required === true,
  }),
  printer: (answers) => ({
    steps: [
      "Check printer power.",
      "Confirm network connection.",
      "Set as default printer.",
      "Clear print queue.",
      "Print a test page.",
    ],
    level: answers.printer_status === "offline" ? "L2" : "L1",
    confidence: answers.printer_status === "offline" ? 86 : 90,
    escalate: answers.printer_status === "offline",
  }),
  shared_access: () => ({
    steps: [
      "Verify corporate login.",
      "Refresh SharePoint or Teams.",
      "Check folder permissions.",
      "Log out and log back in.",
    ],
    level: "L2",
    confidence: 87,
    escalate: true,
  }),
  app_crash: (answers) => ({
    steps: [
      "Close the application.",
      "Restart your computer.",
      "Install updates.",
      "Clear application cache.",
    ],
    level: answers.when_crash === "launch" ? "L2" : "L1",
    confidence: answers.when_crash === "launch" ? 85 : 89,
    escalate: answers.when_crash === "launch",
  }),
  security: () => ({
    steps: [
      "Disconnect from internet.",
      "Do not open suspicious files.",
      "Run antivirus scan.",
      "Report the issue to IT security.",
    ],
    level: "L3",
    confidence: 98,
    escalate: true,
  }),
};

const ISSUE_CONFIG = [
  {
    id: "password",
    label: "Password / Account Locked",
    questions: [
      {
        key: "location",
        text: "Are you on-site or remote?",
        options: [
          { label: "On-site", value: "onsite" },
          { label: "Remote", value: "remote" },
        ],
      },
      {
        key: "locked",
        text: 'Do you see "Account locked"?',
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    ],
  },
  {
    id: "system_access",
    label: "Cannot Access System",
    questions: [
      {
        key: "system_type",
        text: "What are you trying to access?",
        options: [
          { label: "ERP / Core App", value: "erp" },
          { label: "HR / Internal Portal", value: "portal" },
        ],
      },
      {
        key: "error_code",
        text: "Is there an error code shown?",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    ],
  },
  {
    id: "slow_computer",
    label: "Slow / Freezing Computer",
    questions: [
      {
        key: "scope",
        text: "Is the slowness constant or occasional?",
        options: [
          { label: "Constant", value: "constant" },
          { label: "Occasional", value: "occasional" },
        ],
      },
      {
        key: "after_restart",
        text: "Did restart improve performance?",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    ],
  },
  {
    id: "network_vpn",
    label: "Network / VPN Issue",
    questions: [
      {
        key: "network_type",
        text: "Which connection is failing?",
        options: [
          { label: "Office Network", value: "office" },
          { label: "VPN", value: "vpn" },
        ],
      },
      {
        key: "others_affected",
        text: "Are others affected too?",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    ],
  },
  {
    id: "email",
    label: "Email Problem",
    questions: [
      {
        key: "email_issue",
        text: "What is the main email issue?",
        options: [
          { label: "Cannot Send", value: "send" },
          { label: "Cannot Receive", value: "receive" },
        ],
      },
      {
        key: "webmail_works",
        text: "Does webmail work?",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    ],
  },
  {
    id: "software_install",
    label: "Software Installation / Update",
    questions: [
      {
        key: "software_type",
        text: "Is the software approved by IT?",
        options: [
          { label: "Approved", value: "approved" },
          { label: "Not Sure", value: "unknown" },
        ],
      },
      {
        key: "admin_required",
        text: "Does installer request admin rights?",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    ],
  },
  {
    id: "printer",
    label: "Printer Problem",
    questions: [
      {
        key: "printer_status",
        text: "What is the issue type?",
        options: [
          { label: "Offline", value: "offline" },
          { label: "Print Queue Stuck", value: "queue" },
        ],
      },
      {
        key: "single_user",
        text: "Is it only your device?",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    ],
  },
  {
    id: "shared_access",
    label: "Shared Drive / Teams Access",
    questions: [
      {
        key: "platform",
        text: "Where is access denied?",
        options: [
          { label: "Shared Drive", value: "drive" },
          { label: "Teams / SharePoint", value: "teams" },
        ],
      },
      {
        key: "recent_change",
        text: "Did access work previously?",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    ],
  },
  {
    id: "app_crash",
    label: "Application Crashes",
    questions: [
      {
        key: "when_crash",
        text: "When does it crash?",
        options: [
          { label: "At Launch", value: "launch" },
          { label: "During Use", value: "runtime" },
        ],
      },
      {
        key: "after_update",
        text: "Did this start after an update?",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    ],
  },
  {
    id: "security",
    label: "Possible Virus / Security Issue",
    questions: [
      {
        key: "symptom",
        text: "What did you observe?",
        options: [
          { label: "Suspicious Pop-up", value: "popup" },
          { label: "Unknown File / Process", value: "file_process" },
        ],
      },
      {
        key: "clicked_link",
        text: "Did you click a suspicious link or attachment?",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    ],
  },
];

const state = {
  selectedIssue: null,
  answers: {},
};

const issueButtonsEl = document.getElementById("issueButtons");
const questionsSectionEl = document.getElementById("questionsSection");
const selectedIssueEl = document.getElementById("selectedIssue");
const questionsContainerEl = document.getElementById("questionsContainer");
const solveBtnEl = document.getElementById("solveBtn");
const resultSectionEl = document.getElementById("resultSection");
const resultContentEl = document.getElementById("resultContent");

function renderIssueButtons() {
  ISSUE_CONFIG.forEach((issue) => {
    const btn = document.createElement("button");
    btn.className = "issue-btn";
    btn.textContent = issue.label;
    btn.addEventListener("click", () => selectIssue(issue.id));
    issueButtonsEl.appendChild(btn);
  });
}

function selectIssue(issueId) {
  state.selectedIssue = ISSUE_CONFIG.find((item) => item.id === issueId) || null;
  state.answers = {};

  document.querySelectorAll(".issue-btn").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.textContent === state.selectedIssue?.label
    );
  });

  questionsSectionEl.classList.remove("hidden");
  resultSectionEl.classList.add("hidden");
  selectedIssueEl.textContent = `Selected: ${state.selectedIssue.label}`;

  renderQuestions();
  updateSolveButtonState();
}

function renderQuestions() {
  questionsContainerEl.innerHTML = "";

  state.selectedIssue.questions.forEach((question) => {
    const block = document.createElement("div");
    block.className = "question-block";

    const title = document.createElement("p");
    title.className = "question-title";
    title.textContent = question.text;
    block.appendChild(title);

    const row = document.createElement("div");
    row.className = "answer-row";

    question.options.forEach((option) => {
      const btn = document.createElement("button");
      btn.className = "answer-btn";
      btn.textContent = option.label;
      btn.addEventListener("click", () => {
        state.answers[question.key] = option.value;
        renderQuestions();
        updateSolveButtonState();
      });

      if (state.answers[question.key] === option.value) {
        btn.classList.add("active");
      }

      row.appendChild(btn);
    });

    block.appendChild(row);
    questionsContainerEl.appendChild(block);
  });
}

function updateSolveButtonState() {
  if (!state.selectedIssue) {
    solveBtnEl.disabled = true;
    return;
  }

  const answeredAll = state.selectedIssue.questions.every(
    (q) => state.answers[q.key] !== undefined
  );
  solveBtnEl.disabled = !answeredAll;
}

function renderError(message) {
  resultSectionEl.classList.remove("hidden");
  resultContentEl.innerHTML = `<div class="error">${message}</div>`;
}

function renderResult(data) {
  const stepsHtml = data.steps
    .map((step) => `<li>${step}</li>`)
    .join("");

  const shouldEscalate = data.escalate || data.confidence < 70;

  resultContentEl.innerHTML = `
    <div class="result-meta">
      <div class="meta-box">
        <div class="meta-label">Support Level</div>
        <div class="meta-value">${data.level}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Confidence</div>
        <div class="meta-value">${data.confidence}</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">Escalation</div>
        <div class="meta-value">${data.escalate ? "Yes" : "No"}</div>
      </div>
    </div>

    <h3>Step-by-step troubleshooting</h3>
    <ol class="steps">${stepsHtml}</ol>

    ${
      shouldEscalate
        ? '<div class="notice">This case has been escalated to IT Support.</div>'
        : ""
    }
  `;

  resultSectionEl.classList.remove("hidden");
}

function getSolution() {
  if (!state.selectedIssue) return;

  resultSectionEl.classList.remove("hidden");
  resultContentEl.innerHTML = "<p class='muted'>Generating personalized solution...</p>";

  const resolver = SOLUTION_PLAYBOOK[state.selectedIssue.id];
  if (!resolver) {
    renderError("No personalized solution is available for this issue.");
    return;
  }

  const data = resolver(state.answers);
  renderResult(data);
}

solveBtnEl.addEventListener("click", getSolution);
renderIssueButtons();
