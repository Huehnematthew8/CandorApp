# Candor — Codebase Architecture

## 1. High-level overview

```mermaid
flowchart TB
  subgraph Frontend["Frontend (single HTML)"]
    HTML[index.html]
    HTML --> Pages
    HTML --> Data
    HTML --> API_Calls["API calls (not yet wired)"]
    subgraph Pages["Pages"]
      Onboard["#page-onboard\nResume upload & parse"]
      Dashboard["#page-dashboard\nBoard / All Jobs / My Story"]
    end
    Onboard -->|goToDashboard / loadDemo| Dashboard
    subgraph Data["In-memory data"]
      industries
      companyFiles
      profileData
      userData
    end
  end

  subgraph Backend["Backend (Node.js)"]
    Server[server.js]
    Server --> Auth["/api/auth"]
    Server --> Apps["/api/applications"]
    Server --> Resume["/api/resume"]
    Server --> Email["/api/email"]
    Auth --> Prisma[(Prisma / PostgreSQL)]
    Apps --> Prisma
    Resume --> AI[lib/ai.js\nAnthropic]
    Email --> AI
  end

  Frontend -.->|future| Backend
```

---

## 2. Frontend: pages & views

```mermaid
flowchart LR
  subgraph Onboarding["Onboarding"]
    A["#page-onboard"]
    A --> B[Drop zone]
    A --> C[Parse progress]
    A --> D[Parsed tags]
    A --> E[Continue / Skip demo]
  end

  subgraph Dashboard["Dashboard (#page-dashboard)"]
    Nav[Top nav\nBoard | All Jobs | My Story]
    Nav --> V1
    Nav --> V2
    Nav --> V3

    subgraph V1["#view-board"]
      Sidebar[Sidebar\nIndustry groups\nCompany list]
      Main[Main content]
      Sidebar --> Main
      Main --> Empty[Empty state]
      Main --> Detail[Company detail]
      Detail --> T1[Cover Letter / Email]
      Detail --> T2[Notes]
      Detail --> T3[Contacts]
      Detail --> T4[Files]
    end

    subgraph V2["#view-tracker"]
      Toolbar[Search + status filters]
      Table[Sortable table\nCompany, Role, Industry, Location, Salary, Status, Files, Updated]
      Toolbar --> Table
    end

    subgraph V3["#view-profile"]
      ProfileHdr[Header: name, headline, tags]
      Narrative[AI Narrative]
      Cols[Two columns]
      ProfileHdr --> Narrative
      Narrative --> Cols
      Cols --> Timeline[Career Timeline]
      Cols --> Skills[Skills + AI Strengths + Looking For]
      Obs[AI Observations]
      Cols --> Obs
    end
  end

  E -->|goToDashboard()| Dashboard
```

---

## 3. Frontend: main JS flow

```mermaid
flowchart TB
  subgraph Init["On load"]
    Demo["Skip to demo / loadDemo()"]
    Continue["Continue to Dashboard / goToDashboard()"]
  end

  goToDashboard["goToDashboard()"]
  goToDashboard --> renderSidebar
  goToDashboard --> updateTopStats
  goToDashboard --> renderTracker
  goToDashboard --> renderProfileView
  goToDashboard --> switchViewBoard["switchView('board')"]

  switchView["switchView(view)"]
  switchView --> Show["Show view-board | view-tracker | view-profile"]
  switchView --> renderTracker
  switchView --> renderProfile["renderProfileView / renderStrengths_profile"]

  renderSidebar["renderSidebar()"]
  renderSidebar --> toggleIndustry["toggleIndustry(id)"]

  selectCompany["selectCompany(id)"]
  selectCompany --> Tabs["switchTab: email | notes | contacts | files"]
  selectCompany --> renderNotes
  selectCompany --> renderContacts
  selectCompany --> renderFiles

  openFromTracker["openFromTracker(id)"]
  openFromTracker --> switchView
  openFromTracker --> selectCompany

  getAllCompanyRows["getAllCompanyRows()"]
  getAllCompanyRows --> companyFiles
  getAllCompanyRows --> industries
  renderTracker["renderTracker()"]
  renderTracker --> getAllCompanyRows
  renderTracker --> sortTracker
  renderTracker --> filterByStatus
  renderTracker --> filterTracker
```

---

## 4. Backend: server & routes

```mermaid
flowchart TB
  Server["server.js\nExpress + CORS + rate limit"]
  Server --> Auth["routes/auth.js"]
  Server --> Applications["routes/applications.js"]
  Server --> Resume["routes/resume.js"]
  Server --> Email["routes/email.js"]

  Auth --> |POST| Register["/register"]
  Auth --> |POST| Login["/login"]
  Auth --> |POST| Google["/google"]
  Auth --> |POST| Refresh["/refresh"]
  Auth --> |POST| Logout["/logout"]
  Auth --> |GET| Me["/me (auth)"]

  Applications --> |GET| GetIndustries["/industries (auth)"]
  Applications --> |POST| PostIndustry["/industries (auth)"]
  Applications --> |PUT| PutIndustry["/industries/:id (auth)"]
  Applications --> |DELETE| DelIndustry["/industries/:id (auth)"]
  Applications --> |POST| PostCompany["/industries/:id/companies (auth)"]
  Applications --> |PUT| PutCompany["/companies/:id (auth)"]
  Applications --> |PUT| PutStatus["/companies/:id/status (auth)"]
  Applications --> |POST| PostNote["/companies/:id/notes (auth)"]
  Applications --> |POST| PostContact["/companies/:id/contacts (auth)"]

  Resume --> |POST| Upload["/upload\nmulter + pdf-parse → lib/ai"]

  Email --> |POST| Gen["/generate (auth)"]
  Email --> |POST| Insights["/insights (auth)"]
  Email --> |POST| Refine["/refine (auth)"]

  middleware["middleware/auth.js\nJWT Bearer"]
  Auth -.-> middleware
  Applications -.-> middleware
  Email -.-> middleware

  lib["lib/ai.js\nparseResumeWithAI\ngenerateEmailWithAI\ngenerateAIInsights"]
  Resume --> lib
  Email --> lib
```

---

## 5. Database (Prisma schema)

```mermaid
erDiagram
  User ||--o{ RefreshToken : has
  User ||--o{ Industry : has
  Industry ||--o{ Company : contains
  Company ||--o{ Contact : has
  Company ||--o{ Note : has
  Company ||--o{ Activity : has

  User {
    uuid id PK
    string email UK
    string passwordHash
    string name
    string googleId UK
  }

  RefreshToken {
    uuid id PK
    string token UK
    uuid userId FK
    datetime expiresAt
  }

  Industry {
    uuid id PK
    uuid userId FK
    string name
    string emoji
    boolean open
    int order
  }

  Company {
    uuid id PK
    uuid industryId FK
    string name
    string role
    string location
    string salary
    enum status "draft|applied|screening|round1|round2|offer|rejected"
    string logo
    string emailTo
    string emailSubject
    string emailDraft
  }

  Contact {
    uuid id PK
    uuid companyId FK
    string name
    string role
    string initials
  }

  Note {
    uuid id PK
    uuid companyId FK
    string content
  }

  Activity {
    uuid id PK
    uuid companyId FK
    string type
    json payload
  }
```

---

## 6. File tree

```
candor/
├── index.html          # Single-file app (HTML + CSS + JS)
├── README.md
├── ARCHITECTURE.md     # This file
└── server/
    ├── server.js       # Entry: Express, CORS, rate limit, routes
    ├── package.json
    ├── .env.example
    ├── middleware/
    │   └── auth.js     # JWT Bearer auth
    ├── lib/
    │   └── ai.js       # Anthropic: parseResume, generateEmail, insights
    ├── prisma/
    │   └── schema.prisma
    └── routes/
        ├── auth.js         # register, login, google, refresh, logout, /me
        ├── applications.js # industries + companies CRUD, notes, contacts
        ├── resume.js       # POST /upload (PDF parse + AI)
        └── email.js        # /generate, /insights, /refine
```

---

*Render the Mermaid diagrams in GitHub, VS Code (Mermaid extension), or [mermaid.live](https://mermaid.live).*
