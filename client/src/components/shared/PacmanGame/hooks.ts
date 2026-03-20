import { useState, useEffect, useCallback } from 'react';
import type { Position, Enemy } from './types';
import { GRID_SIZE, MAZE_LEVEL_1, MAZE_LEVEL_2 } from './types';

export function usePacmanGame(isOpen: boolean) {
  const [pacman, setPacman] = useState<Position>({ x: 1, y: 1 });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<'playing' | 'gameOver' | 'levelComplete' | 'allComplete'>('playing');
  const [maze, setMaze] = useState(MAZE_LEVEL_1);
  const [dotsEaten, setDotsEaten] = useState(0);
  const [powerMode, setPowerMode] = useState(false);
  const [powerModeTimer, setPowerModeTimer] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState<Array<{name: string, score: number}>>([]);

  // Initialize enemies
  useEffect(() => {
    if (isOpen) {
      const initialEnemies: Enemy[] = [
        { id: 1, x: 9, y: 9, direction: 'up', isVulnerable: false },
        { id: 2, x: 10, y: 9, direction: 'down', isVulnerable: false },
        { id: 3, x: 9, y: 10, direction: 'left', isVulnerable: false },
        { id: 4, x: 10, y: 10, direction: 'right', isVulnerable: false }
      ];
      setEnemies(initialEnemies);
    }
  }, [isOpen, level]);

  // Reset game when opening
  useEffect(() => {
    if (isOpen) {
      setPacman({ x: 1, y: 1 });
      setLives(3);
      setScore(0);
      setLevel(1);
      setGameState('playing');
      setMaze(MAZE_LEVEL_1);
      setDotsEaten(0);
      setPowerMode(false);
      setPowerModeTimer(0);
      setShowLeaderboard(false);
      setPlayerName('');
    }
  }, [isOpen]);

  // Check for collisions
  useEffect(() => {
    if (gameState !== 'playing') return;

    const collidingEnemy = enemies.find(enemy =>
      enemy.x === pacman.x && enemy.y === pacman.y
    );

    if (collidingEnemy) {
      if (powerMode && collidingEnemy.isVulnerable) {
        // Eat the enemy!
        setScore(prev => prev + 200);
        setEnemies(prev => prev.map(enemy =>
          enemy.id === collidingEnemy.id
            ? { ...enemy, x: 9, y: 9, isVulnerable: false } // Reset enemy position
            : enemy
        ));
      } else if (!collidingEnemy.isVulnerable) {
        // Pacman dies
        const newLives = lives - 1;
        setLives(newLives);

        if (newLives <= 0) {
          setGameState('gameOver');
        } else {
          // Reset pacman position
          setPacman({ x: 1, y: 1 });
        }
      }
    }
  }, [pacman, enemies, lives, gameState, powerMode]);

  // Leaderboard functions
  const loadLeaderboard = () => {
    const saved = localStorage.getItem('swagman-leaderboard');
    if (saved) {
      setLeaderboard(JSON.parse(saved));
    }
    setShowLeaderboard(true);
  };

  // Check for level completion (only when all dots are cleared)
  useEffect(() => {
    if (gameState === 'playing') {
      const remainingDots = maze.flat().filter(cell => cell === 2 || cell === 3).length;

      if (remainingDots === 0) {
        if (level === 1) {
          setLevel(2);
          setMaze(MAZE_LEVEL_2);
          setDotsEaten(0);
          setPacman({ x: 1, y: 1 });
          setGameState('levelComplete');

          setTimeout(() => {
            setGameState('playing');
          }, 2000);
        } else {
          // Completed both levels - show leaderboard
          setGameState('allComplete');
          loadLeaderboard();
        }
      }
    }
  }, [maze, gameState, level]);

  // Move enemies
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setEnemies(prevEnemies =>
        prevEnemies.map(enemy => {
          let newX = enemy.x;
          let newY = enemy.y;
          let newDirection = enemy.direction;

          // Random direction change occasionally
          if (Math.random() < 0.1) {
            const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right'];
            newDirection = directions[Math.floor(Math.random() * directions.length)];
          }

          // Move based on direction
          switch (newDirection) {
            case 'up':
              newY = Math.max(0, enemy.y - 1);
              break;
            case 'down':
              newY = Math.min(GRID_SIZE - 1, enemy.y + 1);
              break;
            case 'left':
              newX = Math.max(0, enemy.x - 1);
              break;
            case 'right':
              newX = Math.min(GRID_SIZE - 1, enemy.x + 1);
              break;
          }

          // Check if new position is valid (not a wall)
          if (maze[newY] && maze[newY][newX] !== 1) {
            return { ...enemy, x: newX, y: newY, direction: newDirection };
          }

          // If can't move, try a different direction
          const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right'];
          const randomDirection = directions[Math.floor(Math.random() * directions.length)];
          return { ...enemy, direction: randomDirection };
        })
      );
    }, 200);

    return () => clearInterval(interval);
  }, [gameState, maze]);

  // Handle keyboard input
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (gameState !== 'playing') return;

    let newX = pacman.x;
    let newY = pacman.y;

    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        newY = Math.max(0, pacman.y - 1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        newY = Math.min(GRID_SIZE - 1, pacman.y + 1);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        newX = Math.max(0, pacman.x - 1);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        newX = Math.min(GRID_SIZE - 1, pacman.x + 1);
        break;
      default:
        return;
    }

    // Check if new position is valid (not a wall)
    if (maze[newY] && maze[newY][newX] !== 1) {
      setPacman({ x: newX, y: newY });

      // Check if eating a dot or power pellet
      if (maze[newY][newX] === 2) {
        setScore(prev => prev + 10);
        setDotsEaten(prev => prev + 1);
        // Remove the dot from the maze
        setMaze(prevMaze => {
          const newMaze = prevMaze.map(row => [...row]);
          newMaze[newY][newX] = 0;
          return newMaze;
        });
      } else if (maze[newY][newX] === 3) {
        // Power pellet!
        setScore(prev => prev + 50);
        setDotsEaten(prev => prev + 1);
        setPowerMode(true);
        setPowerModeTimer(100); // 10 seconds at 10fps
        // Make all enemies vulnerable
        setEnemies(prev => prev.map(enemy => ({ ...enemy, isVulnerable: true })));
        // Remove the power pellet from the maze
        setMaze(prevMaze => {
          const newMaze = prevMaze.map(row => [...row]);
          newMaze[newY][newX] = 0;
          return newMaze;
        });
      }
    }
  }, [pacman, gameState, maze]);

  // Handle power mode timer
  useEffect(() => {
    if (!powerMode || gameState !== 'playing') return;

    const interval = setInterval(() => {
      setPowerModeTimer(prev => {
        if (prev <= 1) {
          setPowerMode(false);
          setEnemies(prevEnemies => prevEnemies.map(enemy => ({ ...enemy, isVulnerable: false })));
          return 0;
        }
        return prev - 1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [powerMode, gameState]);

  const saveScore = () => {
    if (!playerName.trim()) return;

    const newEntry = { name: playerName.trim(), score };
    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Keep top 10

    setLeaderboard(updated);
    localStorage.setItem('swagman-leaderboard', JSON.stringify(updated));
    setPlayerName('');
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [isOpen, handleKeyPress]);

  const getGameMessage = () => {
    if (gameState === 'gameOver') {
      return "Game Over! Time to get back to work! \u{1F454}";
    }
    if (gameState === 'allComplete' && !showLeaderboard) {
      return "Congratulations! You completed both levels! Now back to work! \u{1F4BC}";
    }
    if (gameState === 'levelComplete') {
      return "Level Complete! Moving to level 2...";
    }
    return '';
  };

  const remainingDots = maze.flat().filter(cell => cell === 2 || cell === 3).length;

  return {
    pacman,
    enemies,
    lives,
    score,
    level,
    gameState,
    maze,
    powerMode,
    showLeaderboard,
    playerName,
    setPlayerName,
    leaderboard,
    saveScore,
    getGameMessage,
    remainingDots,
  };
}
