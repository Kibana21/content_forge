# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

content_forge is a Python-based video generation tool that uses Google's Vertex AI Generative API (model `veo-3.1-lite-generate-001`) to create videos from text prompts. Currently implemented as a Jupyter notebook prototype.

## Environment Setup

**Python version:** 3.12.7

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
I am still not very happy with the flow and the final mockup, I feel it is a bit disjoined, help me to restructure the flow, also in the mockup ensure that all buttons etc are well thought of. If something doesn;t    
  make sense and makes the users accessing it confusing , remove it. Make an fantastic mockup along these lines    
**Required files (not in git):**
- `video-key.json` — Google Cloud service account credentials
- `.env` — sets `GOOGLE_APPLICATION_CREDENTIALS=video-key.json`

**Google Cloud configuration:**
- Project: `gen-lang-client-0913704662`
- Location: `us-central1`

## Running the Notebook

```bash
source .venv/bin/activate
jupyter notebook temp.ipynb
```

Generated videos are saved to the `output/` directory.

## Architecture

The entire implementation lives in `temp.ipynb`. The workflow is:

1. **Auth** — Load service account credentials from `video-key.json`, initialize a Vertex AI GenAI client
2. **Generate** — Submit a text prompt to `veo-3.1-lite-generate-001` via `client.models.generate_videos()`
3. **Poll** — Poll the operation every 20 seconds until completion
4. **Save** — Write the returned video bytes to `output/*.mp4`

There is no server, CLI, or module structure — all code is in the single notebook.
