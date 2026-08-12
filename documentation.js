// Documentation module — lazy-loaded only when the user navigates to Documentation.
// Split out of admin.html as part of the file-splitting refactor to keep the main bundle lean.
(function() {
  const DOC_SECTIONS = [
    {
      id: 'erp-conventions',
      label: 'ERP-Wide Conventions',
      groups: [
        {
          title: 'Non-Destructive by Design',
          points: [
            { t: 'Nothing is ever hard-deleted', d: 'Every record that can be "removed" is archived via a status field (e.g. Employee: active/suspended/left; Vendor: draft/pending_approval/approved/rejected/suspended) instead of being deleted from the database.' },
            { t: 'Why', d: 'Historical records (Km Tracker entries, past approvals, payment history) often reference employees/vendors that are no longer active. Deleting the parent record would silently break that history.' },
            { t: 'New code never overwrites working code without being told to', d: 'Changes are additive — new columns, new tables, new files — unless a rebuild is explicitly requested.' },
          ],
        },
        {
          title: 'Security Model: RLS-First, Server Re-Validates Everything',
          points: [
            { t: 'The browser never talks to the database directly', d: 'Every read and write goes through a Supabase Edge Function (e.g. hr-actions, vendor-actions, permissions-actions) using the service-role key — the anon/public key alone cannot touch any table.' },
            { t: 'Server-side re-read pattern for privileged actions', d: 'The browser sends only an ID (e.g. "approve vendor X"). The edge function re-reads the record itself, re-checks the requester\'s role/permission fresh from the database, and only then acts. The client\'s claims about what should happen are never trusted.' },
            { t: 'Why', d: 'Anyone can open browser dev-tools and try to fake a request. If the server blindly trusted what the client sent, a low-privilege user could approve their own request just by knowing its ID. Re-checking server-side closes that gap entirely.' },
          ],
        },
        {
          title: 'Test Data Hygiene',
          points: [
            { t: 'All test/demo records are prefixed ZZTEST_', d: 'Applies to employee names, vendor names, vehicle numbers — anything created for testing rather than real business use.' },
            { t: 'Why', d: 'Makes test data instantly recognizable and safe to bulk-delete later without risking real records. Also sorts to the bottom of most alphabetical lists.' },
          ],
        },
        {
          title: 'Visual Design Rules',
          points: [
            { t: 'Thin 1px lines as the only separator', d: 'Never gaps, background-color tricks, or card-in-card nesting — matches classic dense business software (Tally/SAP) rather than "airy" modern SaaS.' },
            { t: 'One typeface for the whole app', d: 'Currently Inter, everywhere — headings, buttons, body text. Hierarchy comes from weight/size, not mixing fonts.' },
            { t: 'Dense spacing by default', d: 'Information density is prioritized over whitespace. If in doubt, go tighter, not looser.' },
            { t: 'Sticky/frozen headers on any scrollable list', d: 'Toolbar controls (search, filters, buttons) and column headers stay visible while only the data rows scroll — first built for Employee Master, now reused everywhere (Vendor Master, etc).' },
            { t: 'Nothing decorative-only', d: 'No asterisks, icons, or badges unless they carry real functional meaning. A disabled/grayed button already communicates "no changes to save" — no need for a redundant symbol next to it.' },
          ],
        },
        {
          title: 'The Self-Updating Page (Cache Fix)',
          points: [
            { t: 'Every page checks a version.txt file every 60 seconds', d: 'Using a cache-bypassing fetch. If the deployed version differs from what\'s loaded, the page force-reloads itself automatically.' },
            { t: 'Why', d: 'GitHub Pages + Chrome caching meant changes sometimes needed a manual hard-refresh or incognito window to appear. This makes updates appear for everyone within ~60 seconds with zero manual action.' },
          ],
        },
      ],
    },
    {
      id: 'km-tracker',
      label: 'Km Tracker',
      groups: [
        {
          title: 'Purpose',
          points: [
            { t: 'Tracks daily vehicle odometer readings', d: 'For employees who use their own vehicle for company work and are paid per kilometer.' },
          ],
        },
        {
          title: 'Fraud-Resistant Daily Entry',
          points: [
            { t: 'Morning and evening photo + GPS location required', d: 'Captured at the moment of each punch, not editable afterward.' },
            { t: 'Why', d: 'Prevents an employee from typing in a distance without actually having driven it — the photo and location are evidence the reading was taken at that place and time.' },
            { t: 'Evening reading must be ≥ morning reading, no rollback allowed', d: 'Odometers only ever increase. Any entry that violates this is rejected before it can be submitted.' },
            { t: 'No duplicate entries for the same employee on the same day', d: 'Enforced as a database constraint, not just a UI check.' },
            { t: 'Vehicle is derived server-side from the employee\'s assigned vehicle', d: 'Never trusted from what the browser sends — closes the loophole of someone claiming a different (higher-rate) vehicle than the one actually assigned to them.' },
            { t: 'Maximum daily KM cap', d: 'Configurable in Settings. Catches wildly implausible distances before they reach approval.' },
          ],
        },
        {
          title: 'Approval Workflow',
          points: [
            { t: 'Status flow', d: 'pending_evening → calculated → approved / rejected → paid.' },
            { t: 'Rejection requires a mandatory reason', d: 'Cannot be rejected with no explanation on file.' },
          ],
        },
      ],
    },
    {
      id: 'employee-master',
      label: 'Employee Master',
      groups: [
        {
          title: 'Identity & Lifecycle',
          points: [
            { t: 'Employee Code is unique and admin-assigned at creation', d: 'Not auto-derived from any other field.' },
            { t: 'PIN is bcrypt-hashed, never stored in plain text', d: 'Auto-generated from the last 4 digits of the employee\'s mobile number at creation; admin can reset it anytime.' },
            { t: 'Status: active / suspended / left — never hard-deleted', d: 'A "left" employee\'s record stays intact so past Km Tracker entries, payments, and approvals remain valid and traceable.' },
          ],
        },
        {
          title: 'Mandatory Fields — Decided Field-by-Field, Not Guessed',
          points: [
            { t: 'Every mandatory/optional field was individually confirmed', d: 'Rather than assumed, across Basic, Personal, Bank & Statutory, and the repeatable sections — captured through a dedicated review pass before building.' },
            { t: 'A short, explicit optional list', d: 'Blood Group, Religion, Place of Birth, Present/Permanent Pincode, Tel (Home), License Category, Emergency Contact Address, HRA/DA/TA, PAN — everything else in the core form is mandatory.' },
          ],
        },
        {
          title: 'Conditional Mandatory Logic',
          points: [
            { t: 'Vehicle KM Payable checked → Driving License Number + Upload become mandatory', d: 'You can\'t legally drive for work without a valid license on file.' },
            { t: 'PF Applicable checked → PF Number + UAN + Certificate become mandatory', d: '' },
            { t: 'ESI Applicable checked → ESI Number + Certificate become mandatory', d: '' },
            { t: 'Salary Payment Method = Bank → Bank Name/Account/IFSC become mandatory', d: 'If Cash is selected instead, these stay optional.' },
          ],
        },
        {
          title: 'Documents Live Inline, Not in a Separate Tab',
          points: [
            { t: 'Photo sits in Basic tab; Aadhar/License sit in Personal; PF/ESI Certificates sit in Bank & Statutory', d: 'Right next to the field they relate to, not grouped into one generic "Upload Documents" area.' },
            { t: 'Why', d: 'Keeps the mandatory-field logic and its matching document upload visually together, so it\'s obvious which cert belongs to which requirement.' },
            { t: 'Deferred-upload pattern', d: 'Selected files are held in memory and only actually uploaded once the employee record is saved — works identically for both a brand-new employee (who doesn\'t have an ID yet) and an existing one.' },
          ],
        },
        {
          title: 'Repeatable Sections (Family, Education, Work Experience, Nominee)',
          points: [
            { t: 'Collapsed behind a "+ Add" button until clicked', d: 'No empty, mandatory-looking fields shown by default.' },
            { t: 'Education requires at least one entry; the others are fully optional', d: 'Matches how the underlying data is actually required for the business.' },
          ],
        },
        {
          title: 'Layout: Single Scrolling Page, Not Tabs',
          points: [
            { t: 'One continuous page with a sticky "jump to section" nav', d: 'Replaced an earlier tab-based design.' },
            { t: 'Why', d: 'Tabs are great for filling out a brand-new record top-to-bottom, but bad for editing one field on an existing employee — you\'d have to know which tab it\'s hiding in. Scrolling + jump-nav gives both: fast navigation and the ability to just scroll and see everything.' },
          ],
        },
        {
          title: 'Validation UX',
          points: [
            { t: 'On save failure, every missing/invalid field is highlighted red', d: 'And the page automatically scrolls to and focuses the first error — no hunting through a plain error-text list.' },
          ],
        },
        {
          title: 'Company Assets — Deliberately Removed',
          points: [
            { t: 'A simple free-text assets list was removed from Employee Master', d: 'In favor of a proper future Item Master + Asset Allocation module, where each asset has a unique code and can be tracked/reassigned even if not physically on hand.' },
          ],
        },
      ],
    },
    {
      id: 'hr-dropdowns',
      label: 'HR Dropdowns',
      groups: [
        {
          title: 'What It Covers',
          points: [
            { t: 'Six admin-editable master lists', d: 'Branch, Department, Designation, Employee Category, Relationship, Asset Type.' },
            { t: 'States and Cities are pre-seeded and read-only', d: 'Not exposed for admin editing here, since they\'re reference data rather than company-specific configuration.' },
          ],
        },
        {
          title: 'Deletion Is FK-Safe',
          points: [
            { t: 'If a dropdown item is currently in use, delete is blocked with a friendly message', d: 'Admin is guided toward Deactivating it instead, which hides it from new selections without breaking any existing employee record that already references it.' },
          ],
        },
      ],
    },
    {
      id: 'roles-permissions',
      label: 'Roles & Permissions',
      groups: [
        {
          title: 'Catalog-Table Design, Not Hardcoded Logic',
          points: [
            { t: 'permissions table stores (category, sub_head, action, key, label) as data', d: 'Not as if/else logic buried in code.' },
            { t: 'Why', d: 'Adding a brand-new module later (Client Master, Item Master, etc.) just means inserting new catalog rows — no schema change, no code rewrite.' },
          ],
        },
        {
          title: 'Category/Sub-Head Mirrors the Actual Left-Nav Menu',
          points: [
            { t: 'Whatever is a top-level sidebar menu becomes a "Category"; whatever nests under it becomes a "Sub-head"', d: 'e.g. Masters (category) → Employee Master, Vendor Master (sub-heads). Inventory & Purchase (category) → Vendor Data Bank (sub-head).' },
            { t: 'Why', d: 'Keeps the permissions screen intuitive — an admin managing access sees the same structure they see in the app itself, not a separate abstract hierarchy to learn.' },
          ],
        },
        {
          title: 'Standard Action Vocabulary',
          points: [
            { t: 'View, Create, Edit, Approve, Delete', d: 'Same five actions apply across every module — a module simply doesn\'t use the ones that don\'t make sense for it (e.g. Km Tracker has no "Create" action).' },
          ],
        },
        {
          title: 'Owner Bypasses Everything, Always',
          points: [
            { t: 'The Owner role automatically has full access to every module and action', d: 'And cannot be restricted — there is no "grant" screen for the Owner because none is needed.' },
          ],
        },
        {
          title: 'Direct Grants, Not Role Templates',
          points: [
            { t: 'employee_permissions links one employee directly to one permission', d: 'Rather than assigning employees to predefined "roles" that bundle several permissions together.' },
            { t: 'Only the Owner can manage permissions', d: 'The single highest-privilege gate in the system.' },
          ],
        },
      ],
    },
    {
      id: 'vendor-master',
      label: 'Vendor Master',
      groups: [
        {
          title: 'Branch-Centric Architecture',
          points: [
            { t: 'Every vendor location — including the very first one, created alongside the vendor itself — is a "Branch"', d: 'There is no separate "vendor address" concept; even a vendor with only one location has exactly one branch under the hood.' },
            { t: 'Why', d: 'Keeps bank accounts, contacts, and location data structurally uniform no matter whether a vendor ends up with 1 location or 10 — nothing special-cased for "the first one."' },
          ],
        },
        {
          title: 'Two Vendor Types',
          points: [
            { t: 'Company', d: 'Anchored on PAN + GST. Supports multiple branches, each with its own GSTIN.' },
            { t: 'Individual / Contractor', d: 'Anchored on Aadhar Number instead of PAN. No GST, no multi-branch — for freelancers and job workers with no registered company.' },
          ],
        },
        {
          title: 'The Core Anti-Duplication Rule (PAN/GSTIN)',
          points: [
            { t: 'New PAN → genuinely new vendor is created', d: '' },
            { t: 'Existing PAN + a new GSTIN → a new branch/GST-registration is added to the EXISTING vendor', d: 'Not treated as a duplicate — this is the same company registering in a new state.' },
            { t: 'Same GSTIN already on the same vendor → treated as simply a new branch under that existing registration', d: '' },
            { t: 'Same GSTIN found under a DIFFERENT PAN → hard-blocked, no override, ever', d: 'This combination is not legally possible, so it\'s always treated as an error, never as an edge case to allow through.' },
            { t: 'The GSTIN\'s embedded PAN (characters 3–12) is cross-checked against the PAN typed', d: 'Catches a typo in either field automatically, before it ever reaches the duplicate-detection logic above.' },
          ],
        },
        {
          title: '"+ Add Branch" — Same/Different GST Declaration',
          points: [
            { t: 'Admin explicitly states whether the new branch\'s GST is the Same or Different from this vendor\'s existing GST', d: '' },
            { t: 'That declaration is cross-checked against the actual GSTIN typed — a contradiction in EITHER direction blocks the save', d: 'Says "Same" but the GSTIN doesn\'t match → blocked. Says "Different" but the GSTIN already exists on this same vendor → blocked.' },
            { t: 'Why', d: 'Prevents two separate mistakes at once: accidentally creating a duplicate vendor, and accidentally merging two genuinely different companies into one.' },
            { t: '"Different" creates a whole new, separate vendor record — plus a link back to the original', d: 'Stored as a bidirectional relationship (vendor_relationships table), not just a note on one side.' },
            { t: 'Purpose of the link', d: 'Lets an admin see, right on a vendor\'s page, whether it has any sister concerns/subsidiaries — so pricing can be cross-checked before issuing a PO. Without this, the same item could unknowingly be quoted at ₹30 to one company and ₹50 to its own sister concern.' },
          ],
        },
        {
          title: 'Contact Reuse',
          points: [
            { t: 'A contact person is one record, phone-number anchored', d: 'The same person can be linked to multiple branches (e.g. an accountant working across 3 units) via a checkbox instead of re-typing their details each time.' },
          ],
        },
        {
          title: 'Bank Accounts Belong to a Branch, Not the Vendor as a Whole',
          points: [
            { t: 'Each branch has its own bank account(s)', d: 'Matching how real multi-unit companies often keep separate accounts per unit for reconciliation.' },
            { t: 'Reusable via checkbox', d: 'If two branches genuinely share one account, it can be linked rather than duplicated.' },
          ],
        },
        {
          title: 'Name vs. Alias — Distinct Purposes, at Both Vendor and Branch Level',
          points: [
            { t: 'Name is the official, mandatory label that prints on the actual PO/Challan', d: 'e.g. Branch Name "Unit 1".' },
            { t: 'Alias is optional and exists purely to make searching/selecting faster', d: 'Never printed anywhere — e.g. Branch Alias "Samrala Chowk Unit", something the team actually remembers day-to-day. Typing the vendor name shows branches by alias in the dropdown; the generated document still shows "Unit 1".' },
          ],
        },
        {
          title: 'Blacklist Status Is a Separate Track From the Approval Workflow',
          points: [
            { t: 'blacklist_status (not_blacklisted / blacklisted) is independent of status (draft/pending_approval/approved/rejected/suspended)', d: 'A vendor\'s approval state and its blacklist state don\'t have to move together.' },
          ],
        },
        {
          title: 'Other Field-Level Rules',
          points: [
            { t: '"Deals In" (free text) replaces a fixed Category dropdown entirely', d: '' },
            { t: '"Vendor Is" (Trader/Manufacturer/Exporter/Service Provider) is multi-select and company-only', d: 'Not applicable to individual contractors.' },
            { t: 'MSME Registered = Yes → MSME Number and MSME Certificate Upload both become mandatory', d: '' },
          ],
        },
      ],
    },
    {
      id: 'roadmap',
      label: 'Roadmap / Planned',
      groups: [
        {
          title: 'Security Module — In Progress, Blocks Everything Else',
          points: [
            { t: 'Current session model is a real gap', d: 'Every action today just sends a plain employee ID with the request, and the server trusts it blindly — no expiry, no token. Anyone who ever learned or guessed an ID could act as that person indefinitely. This is being fixed before any other feature work continues.' },
            { t: 'ERP login is being replaced entirely: email + password, not PIN', d: 'Only @refconveyors.com or @refconveyors.net email addresses can log into the ERP (admin.html). Password minimum 8 characters, must include a letter, a number, and a symbol.' },
            { t: 'Km Tracker link (submit.html) keeps PIN login, completely unchanged', d: 'The two login systems are being deliberately kept separate — this decision only affects the actual ERP.' },
            { t: 'Real session tokens replace the plain-ID trust model', d: 'A random, unguessable token is issued at login and validated on every subsequent action, with an idle-timeout duration configurable in Admin Panel (Owner-only) so it can be tuned as the system grows.' },
            { t: 'Not every employee gets ERP login', d: 'A new "ERP Login Required?" toggle on Employee Master, defaulting to No. Blue-collar/field staff exist fully in HR records (and can still use Km Tracker via PIN if applicable) without ever having ERP access. Role field stays on the employee record either way, even when login isn\'t required.' },
            { t: 'Location (IP) restriction — built, but left dormant', d: 'Per-branch allowed-IP list, with three per-employee exception types available when granting login (always-allow flag, per-request approval, or a time-limited exception). Not enforced yet because the office connections are currently on dynamic IPs; will be switched on once static IPs are in place.' },
          ],
        },
        {
          title: 'Home Tab — Personalized Hub (Future, After Security)',
          points: [
            { t: 'Vision: one place where any logged-in employee sees everything relevant to them', d: 'Their own score, today\'s tasks, delegated tasks, and a daily/weekly report submission — instead of hunting across separate sections of the system.' },
            { t: 'Most of what feeds it doesn\'t exist yet', d: 'Checklist system, FMS, Projects & Production, and Inventory Management (with purchase-department action triggers) are all planned but not built — the Home tab\'s task feed depends on those existing first.' },
            { t: 'What is realistically buildable now, standalone', d: 'Daily/weekly report submission, and a generic lightweight Task module (assign, view, mark done) that later modules (Projects, Production, Inventory) could feed into once they exist, rather than each building its own separate task system.' },
            { t: '"Score" has no definition yet', d: 'What actually earns or loses an employee score hasn\'t been decided — needs its own design pass before it can be built.' },
          ],
        },
      ],
    },
  ];

  function renderDocPoints(points) {
    return points.map(p => `<li><strong>${p.t}</strong>${p.d ? ' — ' + p.d : ''}</li>`).join('');
  }

  // Tree structure for the nav (references DOC_SECTIONS ids for content)
  const DOC_TREE = [
    { label: 'General', leaves: [{ id: 'erp-conventions', label: 'ERP-Wide Conventions' }] },
    { label: 'Operations', leaves: [{ id: 'km-tracker', label: 'Km Tracker' }] },
    {
      label: 'Masters',
      children: [
        { label: 'HR', leaves: [{ id: 'employee-master', label: 'Employee Master' }, { id: 'hr-dropdowns', label: 'HR Dropdowns' }] },
      ],
      leaves: [{ id: 'vendor-master', label: 'Vendor Master' }],
    },
    { label: 'System', leaves: [{ id: 'roles-permissions', label: 'Roles & Permissions' }] },
    { label: 'Roadmap', leaves: [{ id: 'roadmap', label: 'Roadmap / Planned' }] },
  ];

  let docActiveSection = DOC_SECTIONS[0].id;
  let docTreeExpanded = { 'Masters': true, 'Masters > HR': true }; // expanded by default so everything's reachable at a glance

  async function loadDocumentation() {
    documentationLoaded = true;
    renderDocumentation();
  }

  function docTreeGroupHtml(group, path, depth) {
    depth = depth || 0;
    const key = path ? path + ' > ' + group.label : group.label;
    const isExpanded = docTreeExpanded[key] !== false; // default expanded
    let html = `<button type="button" class="nav-item nav-parent doc-tree-toggle ${isExpanded ? 'expanded' : ''}" data-key="${key}" style="padding-left:16px;">
      <span class="nav-label">${group.label}</span>
      <svg class="nav-arrow" style="${isExpanded ? 'transform:rotate(90deg);' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 18l6-6-6-6"/></svg>
    </button>
    <div class="nav-children" style="${isExpanded ? '' : 'display:none;'} margin-left:15px; border-left:1px solid var(--border); padding-left:0;">`;
    (group.children || []).forEach(child => { html += docTreeGroupHtml(child, key, depth + 1); });
    (group.leaves || []).forEach(leaf => {
      html += `<button type="button" class="nav-item doc-tree-leaf ${depth === 0 ? 'doc-tree-leaf-shallow' : ''} ${leaf.id === docActiveSection ? 'active' : ''}" data-section="${leaf.id}" style="padding-left:16px;">
        <span class="nav-label">${leaf.label}</span>
      </button>`;
    });
    html += `</div>`;
    return html;
  }

  function renderDocumentation() {
    const active = DOC_SECTIONS.find(s => s.id === docActiveSection) || DOC_SECTIONS[0];

    const html = `<div class="panel panel-no-clip">
      <div class="panel-header doc-panel-header-sticky" id="docPanelHeader"><span class="panel-title">Documentation</span></div>
      <div style="display:flex; min-height:600px;">

        <div class="doc-tree-nav" id="docTreeNav" style="width:240px; flex-shrink:0; border-right:1px solid var(--border); position:sticky; align-self:flex-start; max-height:100vh; overflow-y:auto; padding:10px 0;">
          ${DOC_TREE.map(g => docTreeGroupHtml(g, '')).join('')}
        </div>

        <div style="flex:1; padding:24px 28px; min-width:0;">
          <h2 style="font-size:18px; font-weight:700; margin:0 0 4px;">${active.label}</h2>
          <p style="font-size:12.5px; color:var(--muted); margin:0 0 20px;">Every rule below reflects an actual decision made while building this module, along with why it was made that way.</p>
          ${active.groups.map(g => `
            <div style="margin-bottom:22px;">
              <h3 style="font-size:13.5px; font-weight:700; color:var(--steel); text-transform:uppercase; letter-spacing:0.3px; margin:0 0 10px; padding-bottom:6px; border-bottom:1px solid var(--border);">${g.title}</h3>
              <ul style="margin:0; padding-left:20px; font-size:13.5px; line-height:1.7;">${renderDocPoints(g.points)}</ul>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;

    document.getElementById('documentationContent').innerHTML = html;

    const docHeader = document.getElementById('docPanelHeader');
    if (docHeader) {
      const applyOffset = () => {
        const nav = document.getElementById('docTreeNav');
        if (nav && docHeader) nav.style.top = docHeader.offsetHeight + 'px';
      };
      applyOffset();
      // Re-measure once fonts/layout settle, in case the header's height shifts slightly after initial paint
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(applyOffset);
      setTimeout(applyOffset, 300);
    }

    document.querySelectorAll('.doc-tree-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const currentlyExpanded = docTreeExpanded[key] !== false; // same logic used when rendering
        docTreeExpanded[key] = !currentlyExpanded;
        renderDocumentation();
      });
    });
    document.querySelectorAll('.doc-tree-leaf').forEach(btn => {
      btn.addEventListener('click', () => {
        docActiveSection = btn.dataset.section;
        renderDocumentation();
      });
    });
  }

  window.loadDocumentation = loadDocumentation;
})();
