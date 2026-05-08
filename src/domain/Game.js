import { createSudoku, createSudokuFromJSON } from './Sudoku.js';

class Game {
  constructor({ sudoku }) {
    this.sudoku = sudoku;
    this.history = [];
    this.future = [];
    this.isExploring = false;
    this.explorationSnapshot = null;
    this.explorationHistory = [];
    this.failedPaths = new Set();
  }

  getSudoku() {
    return this.sudoku;
  }

  guess(move) {
    if (this.isExploring) {
      return this._explorationGuess(move);
    }

    this._saveState();
    const success = this.sudoku.guess(move);
    if (success) {
      this.future = [];
    }
    return success;
  }

  undo() {
    if (this.isExploring) {
      return this._explorationUndo();
    }

    if (this.canUndo()) {
      this.future.unshift(this.sudoku.clone());
      this.sudoku = this.history.pop();
      return true;
    }
    return false;
  }

  redo() {
    if (this.isExploring) {
      return this._explorationRedo();
    }

    if (this.canRedo()) {
      this._saveState();
      this.sudoku = this.future.shift();
      return true;
    }
    return false;
  }

  canUndo() {
    if (this.isExploring) {
      return this.explorationHistory.length > 0;
    }
    return this.history.length > 0;
  }

  canRedo() {
    if (this.isExploring) {
      return this.future.length > 0;
    }
    return this.future.length > 0;
  }

  toJSON() {
    return {
      sudoku: this.sudoku.toJSON(),
      history: this.history.map(s => s.toJSON()),
      future: this.future.map(s => s.toJSON()),
      isExploring: this.isExploring,
      explorationSnapshot: this.explorationSnapshot ? this.explorationSnapshot.toJSON() : null,
      explorationHistory: this.explorationHistory.map(s => s.toJSON()),
      failedPaths: Array.from(this.failedPaths)
    };
  }

  _saveState() {
    this.history.push(this.sudoku.clone());
  }

  startExploration() {
    if (this.isExploring) {
      return false;
    }

    this.isExploring = true;
    this.explorationSnapshot = this.sudoku.clone();
    this.explorationHistory = [];
    this.future = [];

    return true;
  }

  stopExploration(discard = true) {
    if (!this.isExploring) {
      return false;
    }

    if (!discard) {
      this._saveState();
    } else {
      this.sudoku = this.explorationSnapshot;
      this.future = [];
    }

    this.isExploring = false;
    this.explorationSnapshot = null;
    this.explorationHistory = [];

    return true;
  }

  _explorationGuess(move) {
    const stateKey = this._getStateKey();
    
    if (this.failedPaths.has(stateKey)) {
      return { success: false, reason: '此路径已探索失败' };
    }

    this.explorationHistory.push(this.sudoku.clone());
    const success = this.sudoku.guess(move);
    
    if (success) {
      this.future = [];
      
      if (this.sudoku.hasConflict()) {
        this.failedPaths.add(stateKey);
        return { success: false, reason: '出现冲突' };
      }
      
      return { success: true };
    }
    
    return { success: false, reason: '无效移动' };
  }

  _explorationUndo() {
    if (this.explorationHistory.length === 0) {
      return false;
    }

    this.future.unshift(this.sudoku.clone());
    this.sudoku = this.explorationHistory.pop();
    return true;
  }

  _explorationRedo() {
    if (this.future.length === 0) {
      return false;
    }

    this.explorationHistory.push(this.sudoku.clone());
    this.sudoku = this.future.shift();
    return true;
  }

  _getStateKey() {
    return JSON.stringify(this.sudoku.getGrid());
  }

  checkExplorationStatus() {
    if (!this.isExploring) {
      return { status: 'not_exploring' };
    }

    if (this.sudoku.hasConflict()) {
      return { status: 'conflict' };
    }

    if (this.sudoku.isComplete()) {
      return { status: 'complete' };
    }

    return { status: 'exploring' };
  }

  getCandidates(row, col) {
    return this.sudoku.getCandidates(row, col);
  }

  getNextHints() {
    return this.sudoku.getNextHints();
  }

  applyHint(hint) {
    return this.guess({ row: hint.row, col: hint.col, value: hint.value });
  }
}

export function createGame({ sudoku }) {
  return new Game({ sudoku });
}

export function createGameFromJSON(json) {
  const sudoku = createSudokuFromJSON(json.sudoku);
  const game = new Game({ sudoku });
  game.history = json.history.map(s => createSudokuFromJSON(s));
  game.future = json.future.map(s => createSudokuFromJSON(s));
  return game;
}
