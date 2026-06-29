# Puzzle_Studio_Ultimate

Version : 1.0

Last Update : 2026-06-29

---

# PROJECT VISION

Puzzle_Studio_Ultimate는 하나의 퍼즐 게임이 아니다.

Puzzle_Studio_Ultimate는 다양한 퍼즐 게임을 제작할 수 있는 범용 Puzzle Engine이며,
최종 목표는 GUI 기반의 Puzzle Builder를 제공하는 것이다.

Sliding Puzzle은 첫 번째 Plugin이다.

---

# ULTIMATE GOAL

Puzzle Builder

↓

Puzzle Plugin

↓

Puzzle Engine

↓

Game

One Click으로 퍼즐 게임을 생성한다.

---

# CORE PHILOSOPHY

Engine은 퍼즐를 모른다.

Engine은 다음 시스템만 관리한다.

- Scene
- Renderer
- Input
- Audio
- Save
- Asset
- Event
- Plugin

퍼즐는 Plugin이다.

---

# CORE RULES

Renderer는 계산하지 않는다.

Puzzle는 화면을 그리지 않는다.

Input은 Puzzle를 직접 호출하지 않는다.

Scene는 Puzzle 내부를 모른다.

Engine만 전체를 제어한다.

Plugin은 Engine을 수정하지 않는다.

모든 기능은 확장 가능해야 한다.

---

# ARCHITECTURE

Engine

├── SceneManager

├── Renderer

├── InputManager

├── AudioManager

├── SaveManager

├── AssetManager

├── EventBus

├── PluginManager

└── PuzzleManager

---

# PLUGIN INTERFACE

모든 Puzzle Plugin은 다음 API를 가진다.

init()

update()

render()

destroy()

reset()

resize()

---

# CURRENT PLUGINS

Sliding Puzzle

Future

2048

Sudoku

Jigsaw

Memory

Nonogram

Crossword

Picture Puzzle

---

# FOLDER STRUCTURE

assets/

engine/

game/

games/

graphics/

plugins/

src/

ui/

docs/

---

# DEVELOPMENT PRINCIPLES

기능보다 구조를 우선한다.

임시코드보다 유지보수를 우선한다.

중복 코드를 만들지 않는다.

Engine 수정 없이 Plugin 추가가 가능해야 한다.

---

# CODING STYLE

SOLID 원칙을 최대한 따른다.

역할 분리를 철저히 한다.

Renderer는 렌더만 담당한다.

Puzzle는 데이터만 관리한다.

Input은 입력만 처리한다.

Scene는 화면 전환만 담당한다.

Engine은 전체를 관리한다.

---

# VERSION ROADMAP

v0.6

Engine Core

Sliding 개선

Renderer 개선

Input 개선

Scene 개선

Menu

Save

Animation

---

v0.7

Plugin API

Puzzle Registry

Difficulty

Audio

---

v0.8

Builder Core

Plugin Loader

Asset Pipeline

---

v0.9

Optimization

Animation

Editor

---

v1.0

Puzzle Studio Builder

One Click Generate

SDK

Plugin Marketplace

---

# CURRENT STATUS

Engine : 진행중

Builder : 준비중

Plugin : Sliding Puzzle

Version : v0.6

Current Task

Engine Core Refactoring

---

# TODO

HOME 버튼 수정

RESET 버튼 수정

버튼 UI 개선

Board 중앙정렬

Moves 표시 개선

승리 판정

Animation

Menu

Save

Settings

Plugin API

Builder

---

# AI CONTEXT

이 프로젝트는 퍼즐 게임이 아니다.

Puzzle Game Engine이다.

새로운 기능을 추가할 때는 반드시 구조를 먼저 설계한다.

기존 코드보다 더 좋은 구조가 있다면 변경을 허용한다.

기존 코드와의 호환성보다 장기적인 유지보수를 우선한다.

Engine은 Plugin을 모르고 Plugin은 Engine을 수정하지 않는다.

모든 퍼즐는 Plugin으로 개발한다.

---

# CHANGELOG

2026-06-29

PROJECT Constitution 작성

Engine 중심 구조로 방향 결정

Sliding Puzzle을 첫 번째 Plugin으로 정의

Builder 개발 방향 확정
