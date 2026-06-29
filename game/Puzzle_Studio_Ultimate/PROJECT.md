# Puzzle_Studio_Ultimate PROJECT CONSTITUTION

Version : 1.0

---

# Project Vision

Puzzle_Studio_Ultimate는 하나의 퍼즐 게임을 만드는 프로젝트가 아니다.

Puzzle_Studio_Ultimate는 다양한 퍼즐 게임을 제작할 수 있는 범용 퍼즐 엔진(Puzzle Engine)이며,
최종 목표는 GUI 기반의 Puzzle Builder를 제공하는 것이다.

Sliding Puzzle는 첫 번째 플러그인일 뿐이다.

---

# Ultimate Goal

One Click으로 퍼즐 게임을 생성할 수 있는 Builder를 완성한다.

Puzzle Builder

↓

Puzzle Plugin

↓

Puzzle Engine

↓

Game

---

# Engine Philosophy

Engine은 퍼즐 종류를 알지 못한다.

Engine은

* Scene
* Renderer
* Input
* Audio
* Save
* Asset
* Plugin

만 관리한다.

각 퍼즐는 Plugin으로 동작한다.

---

# Core Principles

① Renderer는 계산하지 않는다.

② Puzzle(Board)는 화면을 그리지 않는다.

③ Input은 직접 Puzzle을 호출하지 않는다.

④ Scene은 Puzzle 내부를 알지 않는다.

⑤ Engine만 전체 시스템을 제어한다.

⑥ Plugin은 Engine을 수정하지 않는다.

⑦ 모든 기능은 확장 가능해야 한다.

---

# Architecture

Engine

├── Scene Manager

├── Renderer

├── Input Manager

├── Audio Manager

├── Save Manager

├── Asset Manager

├── Plugin Manager

└── Puzzle Manager

---

# Plugin Structure

Puzzle Plugin은 최소 다음 인터페이스를 가진다.

init()

update()

render()

destroy()

reset()

resize()

---

# Supported Puzzle Types

Sliding Puzzle

Jigsaw Puzzle

2048

Sudoku

Memory

Nonogram

Crossword

Picture Puzzle

Future Plugins...

---

# Development Rules

새로운 기능보다 구조를 우선한다.

임시 코드보다 유지보수를 우선한다.

중복 코드는 작성하지 않는다.

Engine 수정 없이 Plugin 추가가 가능해야 한다.

---

# Coding Rules

SOLID 원칙을 최대한 따른다.

역할 분리를 철저히 한다.

데이터와 렌더링을 분리한다.

Event 기반 구조를 우선한다.

---

# Current Status

현재 버전

Puzzle_Studio_Ultimate Engine v0.6

현재 목표

Engine Core 안정화

Sliding Puzzle Plugin 개선

Menu UI

Settings

Save

Animation

---

# Long Term Goal

Puzzle Studio Builder

↓

One Click Generate

↓

퍼즐 게임 자동 생성

---

이 문서는 Puzzle_Studio_Ultimate 프로젝트의 최상위 설계 기준이며,
향후 모든 개발은 본 문서를 우선 기준으로 한다.
