# AI Story Studio — Product Requirements Document

A simple internal web application that helps users create AI-video-ready content by configuring scripts, storylines, presenter profiles, scene breakdowns, and structured prompt/JSON outputs. The application is designed for non-technical business users — particularly insurance marketing leaders, agent trainers, and corporate communications teams — and enables them to go from idea to structured scene package in a few guided steps.

---

## 1. Purpose

The application helps users inside the company create structured inputs for AI video generation tools.

Instead of manually writing prompts, users should be able to:

* define a video idea (brief)
* create or select a presenter profile
* generate or write a script
* break the script into a visual storyboard of scenes
* maintain visual and tonal consistency across scenes automatically
* export the final structure in prompt format or JSON format for downstream video generation tools
* generate videos from completed storylines and manage multiple video versions per project

The application should be very simple to use, with a guided wizard workflow and minimal complexity.

---

## 2. Problem Statement

Today, creating consistent AI-generated videos requires multiple manual steps:

* writing a story/script
* defining the presenter appearance and tone
* splitting dialogue into scenes
* repeating presenter/environment descriptions in each scene so AI video tools maintain visual continuity
* converting all of this into a structured format for the video generation model

This process is time-consuming, inconsistent, and difficult for ordinary business users.

The company needs a simple web application that standardises this workflow so users can create production-ready structured story packages easily, and then generate and manage video outputs from those packages.

---

## 3. Goals

### Primary Goals

* Make AI video pre-production simple for business users
* Allow users to configure scripts, storylines, and presenter profiles in one place
* Ensure consistency of presenters, tone, and environment across multiple scenes automatically
* Generate structured outputs that can be directly used in AI video tools
* Provide a project-level home where users can see the full storyline and all generated videos in one place

### Secondary Goals

* Reduce prompt-writing effort
* Improve output consistency across video versions
* Enable reuse of templates, presenter profiles, and storyline patterns
* Support both short-form (15s social clips) and long-form (90s+) video creation
* Give users visibility into video generation progress and version history

---

## 4. Target Users

### Primary Users

* Insurance marketing leaders
* Agent training teams
* Corporate communications teams
* Product marketing teams
* Business users with no prompting expertise

### Secondary Users

* Creative reviewers
* Brand/compliance reviewers
* Prompt designers / admins

---

## 5. Design Principles

### Simple

* Minimal screens with a clear linear flow
* Guided wizard steps
* Clean, modern layout with business-friendly terminology
* Low learning curve — no technical jargon exposed to users

### Structured

* Every video project follows a clear, repeatable flow
* Users should not need to manage raw JSON unless they specifically choose to

### Reusable

* Users can reuse presenter profiles, story templates, and scene patterns across projects

### Consistent

* Presenter appearance, tone, and environment details persist across scenes automatically
* The system handles consistency so users do not have to think about it

---

## 6. Application Architecture — Three Views

The application is organised into three interconnected views. Users navigate between them as follows:

```
Dashboard → Project Overview → Storyline Editor (Wizard)
```

### 6.1 Navigation

* A persistent **App Header** is visible on all views
  * Left: "Story Studio" logo (clicking it always returns to Dashboard)
  * Right: context-sensitive actions that change per view
    * Dashboard: "My Projects" button
    * Project Overview: autosave indicator + "My Projects" button
    * Editor: autosave indicator + "Back to Project" button

### 6.2 View Summary

| View | Purpose | Entry points |
|------|---------|-------------|
| **Dashboard** | See all projects, stats, create new | Logo click, "My Projects" button |
| **Project Overview** | See a single project's full storyline + generated videos | Clicking a project card on Dashboard |
| **Storyline Editor** | Edit a project's storyline through a 5-step wizard | "New Project" from Dashboard, "Edit Storyline" from Project Overview, clicking any storyline card |

---

## 7. View 1 — Dashboard

The default landing page. Shows all of the user's projects at a glance.

### 7.1 Dashboard Header

* Page title: "My Projects"
* Subtitle: "Create and manage your AI video storylines."
* Primary action button: "New Project" (routes to Storyline Editor, Step 1)

### 7.2 Stats Row

A row of 4 summary stat cards:

| Stat | Description |
|------|-------------|
| Total Projects | Count of all projects |
| Drafts | Count of projects in draft status |
| Exported | Count of exported projects |
| Videos Generated | Total number of videos generated across all projects |

### 7.3 Filter Tabs

Horizontal tab bar to filter the project grid:

* All (with count)
* Drafts (with count)
* Exported (with count)
* In Review (with count)

Active tab is visually underlined.

### 7.4 Project Grid

Responsive card grid (auto-fill, minimum 320px per card).

Each **project card** displays:

* **Thumbnail area**: colour-coded gradient background based on video type, with:
  * Video type badge (bottom-left): e.g., "Educational", "Agent Training", "Social Media Ad", "Product Update", "Corporate Update", "Compliance"
  * Video count badge (top-right, only if videos exist): e.g., "3 videos" with a play icon
* **Card body**:
  * Project title
  * Status badge (Draft, Exported, In Review) with coloured dot
  * Scene count and estimated duration
* **Card footer**:
  * Presenter avatar (circle with initial) and name
  * Last modified date

Clicking a project card navigates to the **Project Overview** for that project.

### 7.5 New Project Card

A special dashed-border card with a "+" icon and "Start New Project" label. Clicking it routes to the Storyline Editor at Step 1.

### 7.6 Project Statuses

| Status | Badge colour | Meaning |
|--------|-------------|---------|
| Draft | Grey background, grey text | Project is still being built |
| Exported | Green background, green text | Storyline has been exported at least once |
| In Review | Amber background, amber text | Storyline has been sent for review/approval |

---

## 8. View 2 — Project Overview

A read-oriented landing page for a single project. Shows the complete storyline summary and all generated videos.

### 8.1 Breadcrumb Navigation

* "My Projects" (clickable, returns to Dashboard) > Project Title (current page)

### 8.2 Project Hero

Displays at the top of the page:

* **Left side**:
  * Project title (large heading)
  * Metadata row: status badge, estimated duration, scene count, creation date
* **Right side** (action buttons):
  * "Edit Storyline" (outline button) — opens the Storyline Editor at Step 1
  * "Generate Video" (primary button) — triggers new video generation from the current storyline

### 8.3 Storyline Summary Grid

A 2x2 grid of four **storyline summary cards**, one per wizard step (Brief, Presenter, Script, Storyboard). Each card contains:

* **Coloured icon** (teal for Brief, blue for Presenter, amber for Script, pink for Storyboard)
* **Card title**: "Brief", "Presenter", "Script", "Storyboard"
* **Summary text**: a 1-2 sentence plain-language summary of what was configured in that step
* **"Edit [step]" link**: clicking the card opens the Storyline Editor directly at that step

Example summaries:
* Brief: "Educational / Awareness video targeting young parents aged 28-40, first-time insurance buyers. Brand kit: SecureLife Standard."
* Presenter: "Maya - Friendly Advisor, early 30s. Dark brown hair, navy blazer, pearl earrings. Warm & reassuring speaking style."
* Script: "118 words, ~55 seconds. Tone: Warm & Personal. Opens with a parenthood hook, closes with a CTA to talk to an advisor."
* Storyboard: "5 scenes across 60 seconds. Presenter + brand locked on every scene. Locations: living room, kitchen, office, park."

### 8.4 Scene Timeline

A compact table/list view of all scenes within the project. Each row shows:

* Scene number (numbered circle)
* Storyboard thumbnail (small image)
* Scene name (e.g., "The Hook", "The Why")
* Dialogue preview (truncated, italicised)
* Time range (e.g., "0:00 – 0:12")

The timeline has a header with a "Scene Timeline" title and an "Open in Editor" button that routes to Step 4 (Storyboard) in the Storyline Editor.

### 8.5 Generated Videos Section

Displays all videos that have been generated from this project's storyline.

#### Section header

* Title: "Generated Videos"
* "Generate New" button (primary, small)

#### Video cards

Responsive grid of video cards (min 300px per card). Each card shows:

* **Thumbnail area**: image from the first scene of the generated video
  * Play button overlay (circle with play icon)
  * Duration badge (bottom-right, e.g., "1:02")
* **Card body**:
  * Version title (e.g., "Version 1 — Full 60s Cut", "Version 2 — Short Social Cut", "Version 3 — Alternate Hook Opening")
  * Status badge: "Ready" (green) or "Rendering" (blue)
  * Generation date
  * Action buttons: "Download" (outline) and "Share" (ghost)

#### Rendering progress state

For videos that are still being generated:

* Thumbnail area shows a dark background with a loading/refresh icon
* A progress bar beneath the card body shows percent completion
* Progress text describes the current state (e.g., "68% complete — Scene 4 of 5 rendering")

#### Video statuses

| Status | Badge | Meaning |
|--------|-------|---------|
| Ready | Green "Ready" badge | Video has been fully rendered and is available for download/sharing |
| Rendering | Blue "Rendering" badge | Video is currently being generated, shows progress bar |

---

## 9. View 3 — Storyline Editor (Wizard)

The editor is a 5-step linear wizard where users create or edit a project's storyline. Each step builds on the previous one.

### 9.1 Progress Stepper

A horizontal stepper bar, sticky below the app header. Shows all 5 steps with:

* **Step number** (circled)
* **Step label**: Brief, Presenter, Script, Storyboard, Review & Export
* **Visual states**: incomplete (grey circle), active (teal filled circle), completed (teal circle with checkmark)
* **Connector lines** between steps (grey when incomplete, teal when the preceding step is completed)
* Steps are clickable — users can jump to any completed or active step

### 9.2 Step 1 — Brief

**Page heading**: "What are we creating?"
**Subtitle**: "Tell us about your video so we can help you build it faster."

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| Video Title | Text input | Working title for the project |
| Video Type | Pill selector (single-select) | Options: Product Explainer, Educational / Awareness, Agent Training, Social Media Ad, Customer Testimonial, Corporate Update |
| Target Audience | Text input | Free-text description of the intended viewer |
| Target Duration | Dropdown | Options: 15 seconds (2-3 scenes), 30 seconds (3-4 scenes), 60 seconds (5 scenes), 90 seconds (6-8 scenes) |
| Key Message | Textarea | The single most important takeaway for the viewer. Includes a hint: "What is the single most important takeaway for the viewer?" |
| Brand / Compliance Kit | Dropdown | Pre-configured brand kits (e.g., "SecureLife Standard (Warm, Professional, Blue)", "SecureLife Social (Friendly, Casual, Teal)", "No brand constraints") |
| Call to Action | Text input | What the viewer should do after watching |

#### Navigation

* Footer: "Back to Project" (ghost button, left) — returns to Project Overview
* "Continue to Presenter" (primary button, right) — advances to Step 2

### 9.3 Step 2 — Presenter

**Page heading**: "Who is presenting?"
**Subtitle**: "Define the on-screen person. Their appearance will stay consistent across every scene automatically."

#### Saved Presenter Selection

A pill group at the top allows users to either "Create New" or select a previously saved presenter profile (e.g., "Maya - Friendly Advisor", "David - Senior Agent", "Priya - Trainer").

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| Name / Role | Text input | e.g., "Maya - Friendly Advisor" |
| Age Range | Dropdown | Options: 20s, Early 30s, 40s, 50s |
| Appearance Keywords | Text input | Comma-separated descriptors (e.g., "warm smile, dark hair in a neat bun, navy blazer, pearl earrings"). Hint: "Describe the look you want. The more specific, the more consistent." |
| Speaking Style | Dropdown | Options: Warm & Reassuring, Confident & Authoritative, Energetic & Motivational, Calm & Educational |

#### Full Appearance Description

A separate card with:
* A textarea containing the full, detailed appearance description
* An AI-assist button: **"Generate from keywords"** — uses the appearance keywords to auto-generate a vivid, consistent description
* A hint explaining that this exact description is injected into every scene to keep the presenter looking identical

#### Explainer Card

An informational card (teal background) explains **why** the appearance description matters:

> "AI video tools generate each scene independently. Without repeating the presenter's appearance in every scene, the person may look completely different from one clip to the next. This description acts as the 'lock' that keeps Maya looking like Maya throughout your video."

#### Navigation

* Footer: "Back" (ghost button) → Step 1
* "Continue to Script" (primary button) → Step 3

### 9.4 Step 3 — Script

**Page heading**: "Write the script"
**Subtitle**: "Write what [Presenter Name] will say, or let AI draft it from your brief."

#### Script Editor

* Large textarea for the full script
* AI-assist button: **"Auto-draft from brief"** — generates a first draft from the Brief (Step 1) inputs
* **Script metadata bar** below the textarea showing:
  * Word count
  * Estimated duration

#### Tone Adjustment Chips

A row of selectable tone chips for quick AI-powered rewrites:

* Warm & Personal (default active)
* More Professional
* Shorter
* Stronger CTA

Clicking a chip triggers an AI rewrite of the script in that tone.

#### Navigation

* Footer: "Back" (ghost button) → Step 2
* "Break into Scenes" (primary button) → Step 4

### 9.5 Step 4 — Storyboard

**Page heading**: "Storyboard"
**Subtitle**: "Your script has been split into [N] scenes. Edit any scene, or adjust the visuals."

#### Consistency Banner

A teal info banner at the top confirms:

> "Presenter appearance is locked and auto-injected into every scene. Brand kit '[Kit Name]' applied."

This gives users confidence that consistency is being handled automatically.

#### Scene Cards

A vertical list of scene cards (one per scene). Each card uses a horizontal layout:

* **Left**: Storyboard preview thumbnail (220px wide) with a "Storyboard Preview" label overlay
* **Right**: Scene content area containing:
  * **Scene header**: Scene number + name (e.g., "Scene 1 — The Hook") and time range (e.g., "0:00 – 0:12")
  * **Dialogue block**: The portion of script assigned to this scene, displayed in an italicised quote block with a teal left border
  * **Setting description**: Free-text description of the environment and action (e.g., "Bright, modern living room. Soft morning light. Maya sits on a sofa, speaking directly to the camera with a gentle smile.")
  * **Tags**: Small pill-style tags showing:
    * "Presenter locked" (teal, indicates appearance auto-injected)
    * "Brand locked" (teal, indicates brand kit applied)
    * Camera framing (grey, e.g., "Medium close-up", "Wide shot", "Tracking shot", "Close-up")

#### Scene Breakdown Behaviour

When the user clicks "Break into Scenes" from Step 3, the system:

1. Splits the script into N scenes (based on the duration selected in Step 1)
2. Each scene receives a portion of the dialogue
3. Each scene is auto-assigned a descriptive name (Hook, Why, Product, Peace of Mind, Call to Action, etc.)
4. The presenter's full appearance description is automatically injected into the underlying prompt for every scene
5. The brand kit constraints are applied to every scene

#### Requirement: Appearance Injection

Every single scene's underlying video prompt must include the full presenter appearance description. This is because AI video generation models evaluate each scene independently, so repeating detailed attributes is the only way to preserve continuity across the video. The user does not see this injection directly — it is indicated by the "Presenter locked" tag.

#### Navigation

* Footer: "Back" (ghost button) → Step 3
* "Review & Export" (primary button) → Step 5

### 9.6 Step 5 — Review & Export

**Page heading**: "Review & Export"
**Subtitle**: "Everything looks good. Choose how you'd like to export your package."

#### Summary Stats

A row of 4 stat cards:

| Stat | Value |
|------|-------|
| Scenes | Number of scenes |
| Duration | Estimated total duration |
| Words | Word count of full script |
| Consistency | "All Clear" if no issues detected |

#### Presenter Summary

A card showing the presenter profile:
* Avatar circle with initial
* Name and role
* Appearance summary
* Speaking style
* Confirmation that appearance is locked across all scenes

#### Scene Summary

A compact list of all scenes, each showing:
* Scene number (coloured circle)
* Scene name and setting summary
* Time range

#### Export Format Selection

Three export format cards (selectable, only one active at a time):

| Format | Icon | Description |
|--------|------|-------------|
| **Full Package** | Package icon | Scene-by-scene brief with presenter description and visuals. Ready for your video team or AI tool. |
| **Script Only** | Document icon | Clean script document with scene markers. Good for review or voiceover recording. |
| **Technical (JSON)** | Disk icon | Structured data file for direct import into AI video generation platforms. |

The "Full Package" option is selected by default.

#### Navigation

* Footer: "Back" (ghost button) → Step 4
* "Export Package" (primary button, large) — exports in the selected format and returns to the Project Overview

---

## 10. Consistency Management

Consistency is handled automatically rather than being a separate step or screen.

### How it works

* The presenter's **full appearance description** (from Step 2) is injected into the underlying prompt of every scene
* The **brand kit** selected in Step 1 applies visual and tonal constraints to every scene
* Each scene card in the Storyboard (Step 4) displays "Presenter locked" and "Brand locked" tags confirming the locks are active
* The Consistency Banner at the top of the Storyboard step provides a global confirmation
* The Review & Export step (Step 5) includes a "Consistency" stat showing "All Clear" when no issues are detected

### What users see

Users never need to manually manage consistency. They see:
* Tags on each scene confirming locks are applied
* A banner confirming global consistency
* A stat confirming consistency check passed

---

## 11. Presenter Profile Library

### Purpose

Allow users to save and reuse presenter profiles across projects.

### Features

* Create a new presenter profile during any project
* Select from previously saved profiles (shown as pills: "Maya - Friendly Advisor", "David - Senior Agent", "Priya - Trainer")
* Each profile stores:
  * name / role
  * age range
  * appearance keywords
  * speaking style
  * full appearance description
* Profiles can be reused across multiple projects
* Save as reusable template

---

## 12. AI-Assist Features

The application includes targeted AI assists at specific points in the workflow. Each is a single-purpose action triggered by a clearly labelled button.

| Location | Button Label | What it does |
|----------|-------------|--------------|
| Step 2 (Presenter) | "Generate from keywords" | Takes the appearance keywords and generates a full, vivid appearance description |
| Step 3 (Script) | "Auto-draft from brief" | Uses the Brief inputs (topic, audience, tone, key message, CTA) to generate a first-draft script |
| Step 3 (Script) | Tone chips (Warm & Personal, More Professional, Shorter, Stronger CTA) | Rewrites the existing script in the selected tone |

### Design principle

AI assists are helpers, not drivers. Users always see the result in an editable field and can modify freely.

---

## 13. Brand / Compliance Kit

### Purpose

Ensure every video project adheres to company brand and compliance requirements.

### Features

* Pre-configured kits selectable from a dropdown in Step 1
* Each kit defines:
  * colour palette constraints
  * tone of voice guidelines
  * font/typography preferences
  * compliance disclaimers if required
* The selected kit is applied to every scene automatically
* Brand lock is confirmed via a tag on each scene card and the consistency banner

### Example kits

* SecureLife Standard (Warm, Professional, Blue)
* SecureLife Social (Friendly, Casual, Teal)
* No brand constraints

---

## 14. Templates Library

### Purpose

Speed up creation through reusable templates.

### Template types

* Storyline templates (pre-filled brief + script + scenes)
* Presenter templates (saved profiles)
* Scene templates (reusable scene configurations)
* Video style presets

### Features

* Save as template
* Edit template
* Duplicate template
* Mark favourite
* Search templates

---

## 15. Video Generation & Management

### Purpose

Allow users to generate videos from completed storylines and manage multiple versions.

### Features

* **Generate Video** button on the Project Overview page triggers video generation
* **Multiple versions** per project — users can generate different cuts (full length, short social, alternate hook, etc.)
* **Real-time progress tracking** for videos that are currently rendering, showing:
  * Progress bar with percentage
  * Current scene being rendered
* **Video statuses**: Ready (green), Rendering (blue with progress)
* **Actions per video**: Download, Share
* **Version labelling**: Each video gets a version title (e.g., "Version 1 — Full 60s Cut")

---

## 16. Non-Functional Requirements

### 16.1 Usability

* Extremely simple UI with clean, modern design
* Minimal training required
* Business-friendly terminology (no technical jargon)
* Wizard-driven workflow
* Autosave enabled — always visible via indicator in header

### 16.2 Performance

* Screen loads under 2 seconds for normal projects
* Scene generation response should feel near real time
* Save action should be instant or near instant

### 16.3 Reliability

* No data loss on refresh
* Version history for scripts and scenes
* Draft recovery

### 16.4 Security

* Company login / SSO
* Role-based access
* Project-level access control
* Audit logging for edits

### 16.5 Scalability

* Should support many users creating projects simultaneously
* Should allow future addition of direct video-generation integrations

---

## 17. Screen Inventory

The application has exactly 3 views and 5 wizard steps:

### Views

| # | Screen | Description |
|---|--------|-------------|
| 1 | **Dashboard** | Project grid with stats, filters, and new project creation |
| 2 | **Project Overview** | Single project: storyline summary, scene timeline, generated videos |
| 3 | **Storyline Editor** | 5-step wizard for creating/editing the storyline |

### Wizard Steps (inside Storyline Editor)

| Step | Name | Purpose |
|------|------|---------|
| 1 | Brief | Define video idea, type, audience, tone, duration, brand kit, CTA |
| 2 | Presenter | Define or select the on-screen person and their appearance |
| 3 | Script | Write or AI-generate the narrative |
| 4 | Storyboard | Review and edit the scene-by-scene breakdown with visual previews |
| 5 | Review & Export | Verify consistency, select export format, export the package |

---

## 18. Recommended UX Pattern

The application uses a **linear wizard** (Steps 1–5) for content creation, embedded within a **project-centric navigation** model:

1. **Dashboard** is the home base — users see all their work at a glance
2. **Project Overview** is the hub for a single project — storyline summary + generated videos
3. **Storyline Editor** is the workspace — users go here only when actively creating or editing

This separation means users who just want to check on a project or download a video never need to enter the editor. The editor is reserved for creation and editing.

---

## 19. Role Definitions

### Creator

* Creates projects
* Edits storylines
* Exports outputs
* Generates videos

### Reviewer

* Reviews and comments on projects
* Approves projects (moves status from Draft to Exported)

### Admin

* Manages templates
* Manages users
* Configures brand/compliance kits
* Configures global settings

---

## 20. Future Enhancements

Not required for phase 1, but useful later:

* Direct integration with video generation tools (currently the "Generate Video" button is a placeholder for future integration)
* Voice profile configuration
* Storyboard thumbnail auto-generation via AI image models
* Compliance review rules and automated checks
* Multilingual script generation
* AI suggestions for scene transitions
* Prompt quality scoring
* Advanced collaboration (commenting, reviewer workflows)
* Analytics dashboards
* Asset management

---

## 21. MVP Scope

### Must-have

* Dashboard with project grid, stats, and filters
* Project Overview with storyline summary cards, scene timeline, and generated videos section
* Storyline Editor with all 5 wizard steps (Brief, Presenter, Script, Storyboard, Review & Export)
* Presenter profile library (create, select, reuse)
* AI-assist: generate appearance description from keywords
* AI-assist: auto-draft script from brief
* AI-assist: tone adjustment chips for script rewriting
* Automatic presenter appearance injection into every scene
* Brand kit selection and lock
* Consistency banner and per-scene lock tags
* Export in 3 formats (Full Package, Script Only, Technical JSON)
* Autosave with visible indicator
* Simple template save/load
* Video generation trigger and version listing with progress tracking

### Exclude for now

* Advanced collaboration and commenting
* Direct video rendering pipeline (video generation is triggered but actual rendering is handled externally)
* Complex approval workflows
* Analytics dashboards
* Voice cloning
* Asset management
* AI-generated storyboard thumbnails (placeholder images for now)

---

## 22. Success Metrics

The application is successful if:

* Users can create a complete storyline in under 10 minutes
* Non-technical users can generate structured output without help
* Reuse of presenter profiles and templates increases over time
* Presenter consistency improves across scenes (fewer visual mismatches in generated videos)
* Manual editing effort reduces significantly
* Users can find and manage their projects, storylines, and generated videos from a single dashboard without switching tools

---

## 23. Product Summary

This application acts as a **guided AI video pre-production studio**.

It lets a user:

* see all their projects at a glance on a Dashboard
* open any project to view its full storyline and generated videos
* start with a brief and be guided through presenter, script, storyboard, and export
* maintain presenter and brand consistency automatically
* export structured packages for downstream AI video tools
* generate and track multiple video versions per project

The overall feel should be:

* simple
* guided
* clean
* fast
* non-technical
* project-centric
