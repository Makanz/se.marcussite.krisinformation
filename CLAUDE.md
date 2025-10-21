# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Homey app (Athom smart home platform) that monitors the Swedish crisis information API (krisinformation.se) and triggers Flow cards when crisis alerts match user-configured cities/areas. The app uses Homey SDK v2 and requires compatibility with Homey firmware >=1.5.0.

## Development Commands

**Install dependencies:**
```bash
npm install
```

**No build step required** - This is a pure JavaScript Homey app that runs directly on the Homey device.

**Testing:**
Currently no test suite is configured. The package.json test script returns an error.

**Manual API testing:**
```bash
node api/api.js
```
This standalone script tests the krisinformation.se API with hardcoded cities.

## Architecture

### Application Flow
1. **Cron Task Scheduling** (app.js:9-41): On app init, registers a cron task that runs every 5 minutes (`cronInterval = "0 */5 * * * *"`)
2. **Crisis Information Polling** (app.js:51-94):
   - Fetches from `http://api.krisinformation.se/v1/feed?format=json`
   - Filters alerts by matching user-configured cities against Title, Summary, and CapArea fields
   - Generates MD5 hash from first 10 chars of Summary + ID to track alert history
   - Only triggers new alerts (not in warningsHistory)
3. **Flow Card Trigger** (app.js:20): Registered as `krisinformation_trigger_alert` with tokens for title and message
4. **Settings Persistence**: Uses `Homey.ManagerSettings` to store:
   - `cities`: JSON array of city names to monitor
   - `warningsHistory`: JSON array of MD5 hashes for previously-seen alerts

### Key Files
- **app.js**: Main application class extending `Homey.App`, handles cron scheduling and API polling
- **app.json**: Homey app manifest defining Flow triggers, app metadata, and compatibility
- **api/api.js**: Standalone test script for the krisinformation API (not used by main app)
- **settings/**: Settings page UI where users manage their city list
  - **index.html**: Settings page structure
  - **main.js**: Client-side JavaScript handling city input fields and persistence via Homey.set/get
  - **main.css**: Styling for settings page
- **locales/en.json**: I18n strings for settings page

### Alert Deduplication Logic
The app uses MD5 hashing (app.js:69) to prevent duplicate alerts:
```javascript
Hash: md5(item.Summary.substring(0, 10) + item.ID)
```
**Important**: Only the first 10 characters of Summary are used, which could cause collisions if two alerts have the same ID and similar Summary text. This is stored in the `warningsHistory` array and only ONE alert is triggered per polling cycle (app.js:90).

### City Matching Algorithm
The `searchForCity()` function (app.js:97-110) performs case-insensitive substring matching across:
- Alert Title
- Alert Summary
- All CapArea descriptions

This means searching for "Stockholm" would match "Stockholms län", "Stockholm city", etc.

## Homey Platform Specifics

- Uses Homey SDK v2 APIs: `Homey.FlowCardTrigger`, `Homey.ManagerCron`, `Homey.ManagerSettings`
- Settings page uses `/homey.js` library for communicating with the Homey backend
- Flow triggers must be registered in both app.json (definition) and app.js (runtime registration)
- Cron tasks must be explicitly unregistered on app unload to prevent leaks

## External Dependencies

- **node-fetch** (v2.6.7): HTTP client for API requests
- **md5** (v2.2.1): Alert deduplication hashing

## Known Limitations

- Only triggers the FIRST matching alert per polling cycle, not all matches (app.js:90)
- No pagination handling for API responses
- Settings page does not validate city name format
- No error handling for network failures in checkCrisisInformation()
- Alert history grows unbounded in warningsHistory array
