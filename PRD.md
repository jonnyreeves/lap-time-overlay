# RaceCraft — Product Requirements Document (PRD)

## 1. Product Overview

RaceCraft is a software platform designed for karting enthusiasts to track, analyse, and improve their performance. Users can log karting sessions, compare performance across time and different circuits, attach onboard footage from GoPro or similar cameras, and generate videos with embedded lap counters, lap times, and driver comparison overlays. RaceCraft aims to make professional-style telemetry insights accessible to hobbyists and competitive drivers without requiring expensive hardware.

## 2. Target Users

* **Rental kart racers** who want to analyse and improve lap performance.
* **Owners / club racers** who already use onboard cameras and manual timing.
* **Coaches / teams** looking to review driver performance.
* **Enthusiasts** who want to create shareable video content with performance overlays.

## 3. User Objectives

* Track and visualise performance across multiple sessions and circuits.
* Store and organise session metadata alongside video footage.
* Compare improvements over time and identify strengths/weaknesses.
* Review races including context such as opponent drivers.
* Automate creating video overlays with accurate timing data.
* Build a historical record of races, karts, and sessions.

## 4. Core Features

### 4.1 Session Management

* Create and log karting sessions (track, date, kart number, position, conditions, etc).
* Import timing data from CSV or typed manually (lap time, position, etc).
* Tag sessions by track configuration (e.g., Sprint, DMAX, GP).

### 4.2 Video Integration

* Upload video files (GoPro, DJI, Insta360, etc).
* Time alignment of video to lap data via timestamp or frame number.
* Video preview and marker alignment UI.

### 4.3 Overlay / Burn‑In Engine

* Automatic generation of video overlays containing:

  * Current lap number
  * Live lap time counter
  * Best lap indicator
  * Position indicator (optional)
  * Gap to previous laps / delta (future enhancement)
* Export final video in widely supported formats.

### 4.4 Driver & Track Insights

* Store and compare performance across tracks.
* Personal best tracking per circuit.
* Compare against previous sessions and competitors.
* Driver history (drivers previously raced against, finish position records).

### 4.5 Progress & Analytics

* Historical performance graphs.
* Average vs best lap charts.
* Trends across weather, track, kart number, tyre state (future).

### 4.6 Data Management

* Asset organisation (videos, results documents, CSVs).
* Local storage-first with optional cloud backup.

## 5. Non‑Functional Requirements

* **Cross‑platform** (initial Web App for phase 1, React Native Desktop App for phase 2)
* **Reliable video processing** using ffmpeg or GPU‑accelerated pipeline.
* **Fast rendering** with queue processing.
* **Optimised performance** with large media library handling.

## 6. Technical Approach

### Initial Architecture

* Self Hosted React Web Interface with NodeJS Backend, published as a docker container
* Node back‑end for video processing (ffmpeg).
* Local database (SQLite / RxDB / TinyBase) for session + driver history.

### Video Processing

* FFMPEG pipeline to merge video + overlay data.

## 7. Release Plan

### v0.1 — Proof of Concept

* Session logger with support for importing from Daytona and TeamSport email content
* Ability to attach gopro footage, and overlay lap information.
* Ability to export video footage including filters for individual laps and side-by-side comparison

### v1.0 — Public Release

* Full session history + analytics
* Multi‑session comparisons
* Driver archive
* Track database

