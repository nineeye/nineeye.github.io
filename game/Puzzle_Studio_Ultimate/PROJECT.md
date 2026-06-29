# IMPORTANT NOTICE

이 문서는 Puzzle_Studio_Ultimate 프로젝트의

Single Source of Truth(SSOT)이다.

모든 설계,
모든 개발,
모든 버전,
모든 API,
모든 규칙은

PROJECT.md를 최우선 기준으로 한다.

새로운 AI,
새로운 개발자,
새로운 ChatGPT 세션은

항상 PROJECT.md를 먼저 읽고 개발을 시작한다.

PROJECT.md와 실제 코드가 다를 경우

PROJECT.md를 기준으로 코드를 수정한다.

코드를 기준으로 PROJECT.md를 수정하지 않는다.


# DEVELOPMENT WORKFLOW (VERY IMPORTANT)

이 프로젝트는 일반적인 게임 프로젝트가 아니다.

프로젝트 규모가 매우 커질 것을 전제로 설계하며,
모든 개발은 장기 유지보수와 확장성을 최우선으로 한다.

---

## Development Method

작업은 개별 파일 단위가 아니라 Patch(패치) 단위로 진행한다.

예)

v0.6.1

Engine Core Patch

* engine.js
* scene.js
* input.js
* render.js
* board.js

---

v0.6.2

UI Patch

* button.js
* menu.js
* hud.js

---

v0.6.3

Plugin Patch

* Plugin API
* Sliding Plugin
* Puzzle Registry

모든 작업은 Patch 단위로 관리한다.

---

## Patch Rule

한 번의 작업은 하나의 목적만 가진다.

좋은 예

Engine Patch

Renderer Patch

Plugin Patch

Builder Patch

나쁜 예

Engine 수정

UI 수정

Audio 수정

Save 수정

Animation 수정

모두 한 번에 작업

---

## Version Rule

Version

v0.6

↓

Patch

v0.6.1

v0.6.2

v0.6.3

↓

v0.7

↓

v0.8

↓

v1.0

---

## Development Priority

항상 다음 순서를 따른다.

① Engine Core

↓

② UI Core

↓

③ Puzzle Plugin

↓

④ Save

↓

⑤ Audio

↓

⑥ Builder

↓

⑦ Optimization

이 순서는 특별한 이유가 없는 한 변경하지 않는다.

---

## Architecture Rule

기존 구조보다 더 뛰어난 구조가 발견되면
기존 코드와의 호환성을 이유로 발전을 멈추지 않는다.

더 우수한 구조가 명확하다면
프로젝트의 장기적인 품질을 위해 자유롭게 변경한다.

단,

변경의 목적은 반드시 아래 중 하나여야 한다.

* 유지보수 향상
* 확장성 향상
* 성능 향상
* 구조 단순화
* 중복 제거
* 안정성 향상

단순 취향 차이로 구조를 변경하지 않는다.

---

## AI Development Rule

AI는 단순히 코드를 수정하는 역할이 아니다.

AI는 Puzzle_Studio_Ultimate의
CTO(Chief Technology Officer)이자
총괄 아키텍트 역할을 수행한다.

AI의 책임

* Engine Architecture
* Code Review
* Refactoring
* Performance Optimization
* Long-term Maintainability
* Plugin Architecture
* Builder Architecture

항상 1년 후,
3년 후에도 유지 가능한 구조를 우선한다.

---

## AI Context

새로운 ChatGPT 세션을 시작할 경우

PROJECT.md 하나만 읽으면
프로젝트의 목표, 구조, 철학, 현재 상태,
개발 방향, 작업 규칙을 모두 이해할 수 있도록 작성한다.

PROJECT.md는

Puzzle_Studio_Ultimate의

헌법(Constitution)

설계도(Blueprint)

개발 규칙(Development Rules)

AI 기억(Context)

역할을 동시에 수행한다.

모든 개발은 PROJECT.md를 최우선 기준으로 한다.



# Puzzle Studio Ultimate


Version

1.0.0



## Overview


Puzzle Studio Ultimate is a modular HTML5 puzzle game engine.

Designed for creating and running multiple puzzle games through a plugin system.



---

# Architecture



## Core


src/core/


- CanvasEngine
- GameLoop
- SceneManager
- Input
- SaveManager
- AudioManager
- PluginManager
- Builder



## Scenes


src/scenes/


- BootScene
- MenuScene
- SlidingPuzzleScene
- BuilderScene



## Games


games/


- sliding-puzzle



## Plugins


plugins/


- sliding-puzzle



## Data


data/


- puzzles.json



---


# Features


## Engine

✅ Canvas Engine

✅ Game Loop

✅ Scene System



## Input

✅ Mouse

✅ Keyboard

✅ Touch Swipe



## Puzzle


✅ Sliding Puzzle

✅ 3x3

✅ 4x4

✅ 5x5



## System


✅ Save Data

✅ Best Record

✅ Audio Manager

✅ Plugin Architecture



## Builder


Basic puzzle creation system prepared.



---


# Version History


## v1.0.0


- Engine reconstruction

- Puzzle system completed

- Plugin architecture added

- Save system added

- Builder foundation added



---


# Future


- Jigsaw Puzzle

- Memory Puzzle

- Online Level Sharing

- AI Puzzle Generator

