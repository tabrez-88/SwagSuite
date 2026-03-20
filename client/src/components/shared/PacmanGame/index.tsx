import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PacmanGameProps } from './types';
import { CELL_SIZE, GAME_WIDTH, GAME_HEIGHT } from './types';
import { usePacmanGame } from './hooks';

// Logo from public folder
const lsdLogoPath = "/circle-logo.png";

export function PacmanGame({ isOpen, onClose }: PacmanGameProps) {
  const {
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
  } = usePacmanGame(isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-4" data-testid="pacman-game-modal">
        <DialogHeader className="sr-only">
          <DialogTitle>SwagMan Game</DialogTitle>
          <DialogDescription>A Pacman-style game featuring the LSD logo collecting dots while avoiding t-shirt enemies</DialogDescription>
        </DialogHeader>
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">SwagMan Game! {'\u{1F47B}'}</h2>

          <div className="flex justify-between text-sm">
            <span>Lives: {'\u2764\uFE0F'.repeat(lives)}</span>
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
                {'\u{1F455}'}
              </div>
            ))}
          </div>

          {gameState !== 'playing' && !showLeaderboard && (
            <div className="space-y-2">
              <p className="text-lg font-semibold">{getGameMessage()}</p>
              <Button onClick={onClose} data-testid="back-to-work-button">
                Back to Work!
              </Button>
            </div>
          )}

          {showLeaderboard && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-center">{'\u{1F3C6}'} Hall of Fame {'\u{1F3C6}'}</h3>
              <p className="text-center text-sm">You completed both levels with a score of <span className="font-bold text-yellow-500">{score}</span>!</p>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={20}
                    data-testid="player-name-input"
                    onKeyPress={(e) => e.key === 'Enter' && saveScore()}
                  />
                  <Button
                    onClick={saveScore}
                    disabled={!playerName.trim()}
                    data-testid="save-score-button"
                  >
                    Save
                  </Button>
                </div>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <h4 className="font-semibold mb-2 text-center">Top Scores</h4>
                  {leaderboard.length > 0 ? (
                    <div className="space-y-1">
                      {leaderboard.map((entry, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-sm py-1"
                          data-testid={`leaderboard-entry-${index}`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-6 text-center font-bold">
                              {index === 0 ? '\u{1F947}' : index === 1 ? '\u{1F948}' : index === 2 ? '\u{1F949}' : `${index + 1}.`}
                            </span>
                            <span className="truncate max-w-32">{entry.name}</span>
                          </span>
                          <span className="font-mono text-yellow-600 dark:text-yellow-400">
                            {entry.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 text-sm">No scores yet! Be the first!</p>
                  )}
                </div>

                <Button
                  onClick={onClose}
                  className="w-full"
                  data-testid="close-leaderboard-button"
                >
                  Back to Work! {'\u{1F4BC}'}
                </Button>
              </div>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="text-xs text-gray-500 space-y-1">
              <p>Use arrow keys or WASD to move</p>
              <p>Avoid the t-shirts! Collect all dots to advance!</p>
              <p>Dots left: {remainingDots}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
