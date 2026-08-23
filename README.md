# 🚀 CareerAI — AI-Powered Career Intelligence & Job Matching Platform

<p align="center">
  <strong>Turn a resume into a personalized job-search strategy.</strong>
</p>

<p align="center">
  Discover relevant opportunities, understand career fit, identify skill gaps,
  and get AI-powered career guidance from one platform.
</p>

<p align="center">

<a href="https://career-ai-job-board-chi.vercel.app/">
<img src="https://img.shields.io/badge/Live%20Demo-Visit%20CareerAI-2563EB?style=for-the-badge" alt="Live Demo"/>
</a>

<a href="https://github.com/PAWAN0207/career-ai-job-board">
<img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github" alt="GitHub Repository"/>
</a>

<a href="YOUR_GOOGLE_DRIVE_VIDEO_LINK">
<img src="https://img.shields.io/badge/Explanation%20Video-Watch-DC2626?style=for-the-badge" alt="Explanation Video"/>
</a>

</p>

---

## 📌 Submission Links

| Resource | Link |
|---|---|
| 🌐 **Deployed Prototype** | [Open CareerAI](https://career-ai-job-board-chi.vercel.app/) |
| 💻 **Public GitHub Repository** | [View Source Code](https://github.com/PAWAN0207/career-ai-job-board) |
| 🎥 **Explanation Video** | [Watch Project Walkthrough](YOUR_GOOGLE_DRIVE_VIDEO_LINK) |
| 👤 **LinkedIn** | [Connect with Pawan Prasad](https://www.linkedin.com/in/pawan-prasad-analyst/) |

> **Video access:** Set the Google Drive permission to **Anyone with the link → Viewer** before submission.

---

# 📖 Project Overview

**CareerAI** is a full-stack AI-powered Job Board and Career Intelligence platform designed to make job discovery more personalized, explainable, and actionable.

Traditional job boards primarily answer:

> **"What jobs are available?"**

CareerAI goes one step further:

> **"Which jobs are relevant to me?"**  
> **"How well does my profile match this opportunity?"**  
> **"What skills am I missing?"**  
> **"What should I improve next?"**

The platform combines:

- 🔎 Intelligent job discovery
- 🎛️ Multi-dimensional job filtering
- 🏢 Job-source filtering
- 📄 Resume parsing and profile extraction
- 🧠 Career profile generation
- 🎯 Personalized job recommendations
- 📊 Explainable match scoring
- 🧩 Skill-gap identification
- 🤖 Gemini-powered AI Career Assistant
- 🔐 User authentication and profile persistence
- ☁️ Cloud database and public deployment

The system is designed as a reusable career decision-support platform rather than a hard-coded demonstration.

---

# 🎯 Problem Statement

Job seekers often face three major problems:

1. **Information overload** — thousands of job listings make relevant opportunities difficult to identify.
2. **Weak personalization** — traditional job boards do not deeply connect a candidate's resume with available jobs.
3. **Unclear next steps** — candidates may know their target role but not understand their skill gaps or readiness.

CareerAI addresses this through an end-to-end workflow:

```text
                 Candidate
                    │
                    ▼
              Resume Upload
                    │
                    ▼
            Resume Intelligence
                    │
                    ▼
          Structured Career Profile
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
     Candidate Skills     Target Roles
          │                   │
          └─────────┬─────────┘
                    ▼
              Job Matching
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
     Matched Skills       Skill Gaps
          │                   │
          └─────────┬─────────┘
                    ▼
          Personalized Jobs
                    │
                    ▼
          AI Career Assistant


```text

# ✨ Key Features

CareerAI combines job discovery, resume intelligence, personalized job matching, career intelligence, and AI-powered career assistance into a single workflow.

---

## 🔎 1. Intelligent Job Discovery

CareerAI provides a structured job-discovery experience where users can search, filter, and explore opportunities from multiple job sources.

### Search & Filtering

Users can filter jobs using:

- 🔍 Keyword search
- 📍 Location
- 🧩 Domain
- 💼 Employment type
- 📊 Minimum experience
- 📊 Maximum experience
- 🗂️ Job source
- 📄 Pagination

Search can consider information such as:

- Job title
- Company name
- Skills
- Roles
- Location
- Domain
- Experience requirements
- Employment type

### Supported Job Sources

CareerAI normalizes job-source information so users can discover opportunities from multiple platforms through a single interface.

Current source categories include:

- LinkedIn
- Indeed
- Internshala
- Naukri Dekhe
- Naukri Safar
- Glassdoor
- Foundit.in
- Wellfound
- Shine
- Cutshort

The source filter is designed to treat related source labels consistently so users can select a platform without having to understand internal source variations.

<details>
<summary><strong>📸 View Job Discovery Screenshot</strong></summary>

<br>

![CareerAI Job Discovery](docs/screenshots/01-job-discovery.png)

</details>

---

## 📄 2. AI-Powered Resume Intelligence

CareerAI allows users to upload a resume and convert unstructured resume content into structured career information.

### Supported Resume Formats

- PDF
- DOCX
- TXT

### Extracted Information

The resume processing workflow can identify and organize:

- Candidate name
- Contact information
- Professional summary
- Skills
- Work experience
- Education
- Projects
- Recommended career roles

Instead of treating a resume as a static document, CareerAI transforms it into a structured candidate profile that can be reused throughout the platform.

<details>
<summary><strong>📸 View Resume Upload Screenshot</strong></summary>

<br>

![Resume Upload](docs/screenshots/03-resume-upload.png)

</details>

---

## 🧠 3. Structured Career Profile

After resume processing, CareerAI generates a structured career profile that can be used for personalized career analysis and job recommendations.

The profile can contain:

- Candidate information
- Career level
- Skills
- Experience
- Education
- Projects
- Target career direction
- Recommended career roles

This profile acts as the central candidate context for downstream career intelligence and matching workflows.

<details>
<summary><strong>📸 View Candidate Profile</strong></summary>

<br>

![Candidate Profile](docs/screenshots/04-resume-profile.png)

</details>

<details>
<summary><strong>📸 View Career Profile & Projects</strong></summary>

<br>

![Career Profile & Projects](docs/screenshots/05-career-profile-projects.png)

</details>

---

## 🎯 4. Explainable Job Matching

CareerAI does not simply return a list of jobs.

The platform compares candidate information with job requirements and presents matching signals that help users understand **why an opportunity may be relevant**.

### Matching Signals

The recommendation workflow considers signals such as:

- Candidate skills
- Job skills
- Target role
- Job domain
- Job roles
- Experience requirements
- Career-family relevance
- Skill overlap

### Recommendation Information

Recommendations can expose:

- 📊 Match score
- ✅ Matched skills
- ⚠️ Skill gaps
- 💼 Experience assessment
- 🎯 Target-role alignment
- 🧩 Career-family relevance
- 🔗 Job details
- 📝 Application availability

This makes the recommendation workflow more explainable and actionable instead of presenting an unexplained list of jobs.

<details>
<summary><strong>📸 View Personalized Job Matching</strong></summary>

<br>

![Recommended Jobs](docs/screenshots/06-recommended-jobs.png)

</details>

---

## 🤖 5. AI Career Assistant

CareerAI includes a conversational AI assistant powered by **Google Gemini**.

The assistant is designed around career-related context and can help users with:

- Career direction
- Skill development
- Job readiness
- Skill-gap analysis
- Target-role preparation
- Interview preparation
- Career planning
- Practical next steps

### Example Questions

```text
What skills should I improve next?

Am I ready for a Data Scientist role?

What are the most important skill gaps in my profile?

What should I learn for my target role?

How can I improve my job readiness?

What should be my next career step?