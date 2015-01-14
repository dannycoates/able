Able Roadmap
============

# Goals

- remotely control application parameters via experiments
- manage the lifecycle of experiments, including releasing results
- provide adaquate data for analysing experiments without scary tracking
- allow concurrent experiments without conflicts
- provide as consistent of a user experience as possible


A/B testing, feature flagging, release management, and data analysis integration
are a lot of things that will take a while to develop into a complete suite of
tools. Fortunately most of these thing build upon each other so we can start using
parts as they become available. This is a rough timeline of how we think the
system will develop. The larger the phase number the less clear the objectives.

## Phase 1

target mid-Q1 2015

- feature flags
- canary/beta testing
- all-at-once or linear incremental feature releases
- minimal metrics integration
- no user authentication or storage
- javascript API only
- git-based experiment workflow

## Phase 2

target late-Q1 2015

- A/B testing
- "single-thread" experiments
- basic metrics integration
- manual experiment analysis
- HTTP API

## Phase 3

- concurrent experiments
- thorough metrics integration
- authenticated user storage
- basic analysis tools
- other language(s) API
