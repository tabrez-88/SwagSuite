import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import lsdLogoPath from "@assets/Circle only_1756152840165.png";

interface Position {
  x: number;
  y: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  isVulnerable: boolean;
}

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const GAME_WIDTH = 400;
const GAME_HEIGHT = 400;

// Simple maze layout (1 = wall, 0 = path, 2 = small dot, 3 = power pellet)
const MAZE_LEVEL_1 = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,3,1],
  [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,1,1,0,1,1,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,1,1,0,0,1,1,0,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,1,0,0,0,0,1,0,0,2,0,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,1,0,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,1,1,0,1,1,0,1,1,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
  [1,3,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,3,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const MAZE_LEVEL_2 = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,1],
  [1,2,1,1,1,2,1,1,1,1,1,1,1,1,2,1,1,1,2,1],
  [1,2,2,2,1,2,2,2,2,1,1,2,2,2,2,1,2,2,2,1],
  [1,1,1,2,1,1,1,1,2,1,1,2,1,1,1,1,2,1,1,1],
  [1,2,2,2,2,2,2,1,2,1,1,2,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,2,2,2,2,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,1,1,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,2,1,0,0,0,0,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,1,2,0,0,0,0,0,0,2,1,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,0,0,0,0,1,2,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,1,1,1,1,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,2,2,2,2,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,2,1,1,2,1,2,2,2,2,2,2,1],
  [1,1,1,2,1,1,1,1,2,1,1,2,1,1,1,1,2,1,1,1],
  [1,2,2,2,1,2,2,2,2,1,1,2,2,2,2,1,2,2,2,1],
  [1,2,1,1,1,2,1,1,1,1,1,1,1,1,2,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

interface PacmanGameProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PacmanGame({ isOpen, onClose }: PacmanGameProps) {
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
  
  const totalDots = maze.flat().filter(cell => cell === 2 || cell === 3).length;

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

  // Check for level completion
  useEffect(() => {
    if (dotsEaten >= totalDots && gameState === 'playing') {
      if (level === 1) {
        setLevel(2);
        setMaze(MAZE_LEVEL_2);
        setPacman({ x: 1, y: 1 });
        setDotsEaten(0);
        setGameState('levelComplete');
        setTimeout(() => setGameState('playing'), 2000);
      } else {
        setGameState('allComplete');
      }
    }
  }, [dotsEaten, totalDots, level, gameState]);

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

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [isOpen, handleKeyPress]);

  const getGameMessage = () => {
    if (gameState === 'gameOver') {
      return "Game Over! Time to get back to work! 👔";
    }
    if (gameState === 'allComplete') {
      return "Congratulations! You completed both levels! Now back to work! 💼";
    }
    if (gameState === 'levelComplete') {
      return "Level Complete! Moving to level 2...";
    }
    return '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-4" data-testid="pacman-game-modal">
        <DialogHeader className="sr-only">
          <DialogTitle>SwagMan Game</DialogTitle>
          <DialogDescription>A Pacman-style game featuring the LSD logo collecting dots while avoiding t-shirt enemies</DialogDescription>
        </DialogHeader>
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">SwagMan Game! 👻</h2>
          
          <div className="flex justify-between text-sm">
            <span>Lives: {'❤️'.repeat(lives)}</span>
            <span>Score: {score}</span>
            <span>Level: {level}</span>
            {powerMode && <span className="text-yellow-400 animate-pulse">POWER MODE!</span>}
          </div>

          <div 
            className="relative bg-black border-2 border-gray-400 mx-auto"
            style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
            data-testid="game-board"
          >
            {/* Render maze */}
            {maze.map((row, y) => 
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`absolute ${
                    cell === 1 ? 'bg-blue-600' : 'bg-transparent'
                  }`}
                  style={{
                    left: x * CELL_SIZE,
                    top: y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE
                  }}
                >
                  {/* Small white dots */}
                  {cell === 2 && (
                    <div 
                      className="bg-white rounded-full"
                      style={{
                        width: '4px',
                        height: '4px',
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  )}
                  {/* Large white power pellets */}
                  {cell === 3 && (
                    <div 
                      className="bg-white rounded-full animate-pulse"
                      style={{
                        width: '12px',
                        height: '12px',
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  )}
                </div>
              ))
            )}

            {/* Render LSD Logo as Pacman */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                left: pacman.x * CELL_SIZE + 2,
                top: pacman.y * CELL_SIZE + 2,
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4
              }}
              data-testid="pacman"
            >
              <img 
                src={lsdLogoPath} 
                alt="LSD Logo" 
                className="w-full h-full object-contain rounded-full"
                style={{ filter: 'invert(1)' }}
              />
            </div>

            {/* Render T-shirt enemies */}
            {enemies.map(enemy => (
              <div
                key={enemy.id}
                className={`absolute flex items-center justify-center text-lg transition-all duration-200 ${
                  enemy.isVulnerable ? 'animate-pulse' : ''
                }`}
                style={{
                  left: enemy.x * CELL_SIZE,
                  top: enemy.y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  filter: enemy.isVulnerable ? 'hue-rotate(180deg) brightness(0.7)' : 'none'
                }}
                data-testid={`enemy-${enemy.id}`}
              >
                👕
              </div>
            ))}
          </div>

          {gameState !== 'playing' && (
            <div className="space-y-2">
              <p className="text-lg font-semibold">{getGameMessage()}</p>
              <Button onClick={onClose} data-testid="back-to-work-button">
                Back to Work!
              </Button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="text-xs text-gray-500 space-y-1">
              <p>Use arrow keys or WASD to move</p>
              <p>Avoid the t-shirts! Collect all dots to advance!</p>
              <p>Dots left: {totalDots - dotsEaten}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}