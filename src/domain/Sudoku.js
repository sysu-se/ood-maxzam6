class Sudoku {
  constructor(grid) {
    this.grid = this._deepClone(grid);
  }

  getGrid() {
    return this._deepClone(this.grid);
  }

  guess(move) {
    const { row, col, value } = move;
    if (this._isValidPosition(row, col)) {
      this.grid[row][col] = value;
      return true;
    }
    return false;
  }

  clone() {
    return new Sudoku(this.grid);
  }

  toJSON() {
    return { grid: this._deepClone(this.grid) };
  }

  toString() {
    return this.grid.map(row => row.join(' ')).join('\n');
  }

  _isValidPosition(row, col) {
    return row >= 0 && row < 9 && col >= 0 && col < 9;
  }

  _deepClone(grid) {
    return grid.map(row => [...row]);
  }

  getCandidates(row, col) {
    if (!this._isValidPosition(row, col) || this.grid[row][col] !== 0) {
      return [];
    }

    const candidates = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (let i = 0; i < 9; i++) {
      candidates.delete(this.grid[row][i]);
      candidates.delete(this.grid[i][col]);
    }

    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        candidates.delete(this.grid[r][c]);
      }
    }

    return Array.from(candidates);
  }

  getNextHints() {
    const hints = [];
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.grid[row][col] === 0) {
          const candidates = this.getCandidates(row, col);
          if (candidates.length === 1) {
            hints.push({
              row,
              col,
              value: candidates[0],
              reason: `唯一候选数`
            });
          }
        }
      }
    }
    
    return hints;
  }

  hasConflict() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = this.grid[row][col];
        if (value !== 0) {
          for (let i = 0; i < 9; i++) {
            if (i !== col && this.grid[row][i] === value) return true;
            if (i !== row && this.grid[i][col] === value) return true;
          }

          const boxRow = Math.floor(row / 3) * 3;
          const boxCol = Math.floor(col / 3) * 3;
          for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
              if (r !== row && c !== col && this.grid[r][c] === value) {
                return true;
              }
            }
          }
        }
      }
    }
    
    return false;
  }

  isComplete() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.grid[row][col] === 0) {
          return false;
        }
      }
    }
    return !this.hasConflict();
  }
}

export function createSudoku(grid) {
  return new Sudoku(grid);
}

export function createSudokuFromJSON(json) {
  return new Sudoku(json.grid);
}
