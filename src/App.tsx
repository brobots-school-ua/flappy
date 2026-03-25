import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

const GRAVITY = 0.5;
const JUMP_STRENGTH = -7;
const INITIAL_PIPE_SPEED = 3;
const PIPE_GAP = 180;
const PIPE_WIDTH = 70;
const GAME_HEIGHT = 600;
const GAME_WIDTH = 400;
const BIRD_WIDTH = 45;
const BIRD_HEIGHT = 35;

interface PipeData {
  id: number;
  x: number;
  topHeight: number;
}

// Glitch text that appears randomly
const GLITCH_MESSAGES = [
  "ERROR 404: REALITY NOT FOUND",
  "SYSTEM FAILURE",
  "DO NOT TRUST THE PIPES",
  "ARE YOU STILL PLAYING?",
  "THIS IS NOT A GAME",
  "HELP ME",
  "SIGNAL LOST",
  "MEMORY CORRUPTED",
  "RESTART? Y/N/MAYBE",
  "̷̧̛̤̈́E̸̟̊R̵̭̈́R̸̰̋O̷̧̔R̵̫̈",
  "ПТАХ НЕ СПРАВЖНІЙ",
  "ТИ НЕ ВИЙДЕШ",
  "КАНАЛ 404",
];

function App() {
  const [birdY, setBirdY] = useState(250);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<PipeData[]>([]);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  // Glitch state
  const [rotation, setRotation] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);
  const [glitchType, setGlitchType] = useState(0);
  const [hueShift, setHueShift] = useState(0);
  const [glitchMessage, setGlitchMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0 });
  const [invertColors, setInvertColors] = useState(false);
  const [staticNoise, setStaticNoise] = useState(false);
  const [channelShift, setChannelShift] = useState({ r: 0, g: 0, b: 0 });

  const gameLoopRef = useRef<number>(0);
  const pipeSpawnTimerRef = useRef(0);
  const glitchIntervalRef = useRef<number>(0);
  const psychedelicRef = useRef<number>(0);
  const scoreRef = useRef(0);

  // Difficulty increases with score
  const level = Math.floor(score / 10) + 1;
  const currentPipeSpeed = INITIAL_PIPE_SPEED + (level - 1) * 0.5;
  // Glitch intensity increases with score
  const glitchIntensity = Math.min(score / 50, 1);

  const jump = useCallback(() => {
    if (isGameOver) return;
    if (!isStarted) setIsStarted(true);
    setBirdVelocity(JUMP_STRENGTH);
  }, [isGameOver, isStarted]);

  const resetGame = () => {
    setBirdY(250);
    setBirdVelocity(0);
    setPipes([]);
    setScore(0);
    setRotation(0);
    setIsGameOver(false);
    setIsStarted(false);
    setGlitchActive(false);
    setHueShift(0);
    setShowMessage(false);
    setScreenShake({ x: 0, y: 0 });
    setInvertColors(false);
    setStaticNoise(false);
    setChannelShift({ r: 0, g: 0, b: 0 });
    pipeSpawnTimerRef.current = 0;
    scoreRef.current = 0;
  };

  // Rotation every 5-10 score points (25-30 degrees)
  useEffect(() => {
    if (score > 0 && score % 7 === 0) {
      const angle = 25 + Math.random() * 5; // 25-30 degrees
      const direction = Math.random() > 0.5 ? 1 : -1;
      setRotation(prev => prev + angle * direction);
    }
  }, [score]);

  // Glitch effects every 1-2 seconds
  useEffect(() => {
    if (!isStarted || isGameOver) return;

    const triggerGlitch = () => {
      const type = Math.floor(Math.random() * 8);
      setGlitchType(type);
      setGlitchActive(true);

      // Screen shake
      if (type === 0 || type === 3) {
        const shakeAmount = 5 + glitchIntensity * 15;
        setScreenShake({
          x: (Math.random() - 0.5) * shakeAmount,
          y: (Math.random() - 0.5) * shakeAmount
        });
      }

      // Color inversion
      if (type === 1 || type === 5) {
        setInvertColors(true);
        setTimeout(() => setInvertColors(false), 100 + Math.random() * 200);
      }

      // Static noise
      if (type === 2 || type === 6) {
        setStaticNoise(true);
        setTimeout(() => setStaticNoise(false), 150 + Math.random() * 300);
      }

      // RGB channel shift
      if (type === 3 || type === 7) {
        setChannelShift({
          r: (Math.random() - 0.5) * 10,
          g: (Math.random() - 0.5) * 10,
          b: (Math.random() - 0.5) * 10,
        });
        setTimeout(() => setChannelShift({ r: 0, g: 0, b: 0 }), 200);
      }

      // Glitch message
      if (type === 4 || (Math.random() > 0.6 && scoreRef.current > 5)) {
        setGlitchMessage(GLITCH_MESSAGES[Math.floor(Math.random() * GLITCH_MESSAGES.length)]);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 500 + Math.random() * 1000);
      }

      // End glitch after short time
      setTimeout(() => {
        setGlitchActive(false);
        setScreenShake({ x: 0, y: 0 });
      }, 100 + Math.random() * 200);
    };

    // Trigger glitch every 1-2 seconds
    const interval = 1000 + Math.random() * 1000;
    glitchIntervalRef.current = window.setInterval(() => {
      triggerGlitch();
    }, interval);

    return () => clearInterval(glitchIntervalRef.current);
  }, [isStarted, isGameOver, glitchIntensity]);

  // Psychedelic background — hue shift
  useEffect(() => {
    if (!isStarted || isGameOver) return;

    const animate = () => {
      setHueShift(prev => (prev + 2) % 360);
      psychedelicRef.current = requestAnimationFrame(animate);
    };
    psychedelicRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(psychedelicRef.current);
  }, [isStarted, isGameOver]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  // Main game loop
  useEffect(() => {
    if (!isStarted || isGameOver) return;

    const update = () => {
      setBirdY(y => {
        const newY = y + birdVelocity;
        if (newY <= 0 || newY + BIRD_HEIGHT >= GAME_HEIGHT) {
          setIsGameOver(true);
          return y;
        }
        return newY;
      });
      setBirdVelocity(v => v + GRAVITY);

      setPipes(currentPipes => {
        const nextPipes = currentPipes
          .map(p => ({ ...p, x: p.x - currentPipeSpeed }))
          .filter(p => p.x + PIPE_WIDTH > 0);

        for (const pipe of nextPipes) {
          const birdRight = 50 + BIRD_WIDTH;
          const birdLeft = 50;
          const pipeRight = pipe.x + PIPE_WIDTH;
          const pipeLeft = pipe.x;

          if (birdRight > pipeLeft && birdLeft < pipeRight) {
            if (birdY < pipe.topHeight || birdY + BIRD_HEIGHT > pipe.topHeight + PIPE_GAP) {
              setIsGameOver(true);
            }
          }

          if (pipe.x + currentPipeSpeed >= 50 && pipe.x < 50) {
            setScore(s => {
              scoreRef.current = s + 1;
              return s + 1;
            });
          }
        }
        return nextPipes;
      });

      pipeSpawnTimerRef.current += 1;
      if (pipeSpawnTimerRef.current >= Math.max(60, 100 - level * 5)) {
        const minHeight = 80;
        const maxHeight = GAME_HEIGHT - PIPE_GAP - 80;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        setPipes(p => [...p, { id: Date.now(), x: GAME_WIDTH, topHeight }]);
        pipeSpawnTimerRef.current = 0;
      }

      gameLoopRef.current = requestAnimationFrame(update);
    };

    gameLoopRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [isStarted, isGameOver, birdVelocity, birdY, currentPipeSpeed, level]);

  // Build CSS filter string
  const getFilters = () => {
    const filters: string[] = [];
    if (isStarted) filters.push(`hue-rotate(${hueShift}deg)`);
    if (invertColors) filters.push('invert(1)');
    if (glitchActive) filters.push(`saturate(${1.5 + glitchIntensity * 3})`);
    if (score > 15) filters.push(`contrast(${1 + glitchIntensity * 0.5})`);
    return filters.length ? filters.join(' ') : 'none';
  };

  const gameOverGlitch = isGameOver && score > 10;

  return (
    <div className="game-wrapper">
      {/* Scanlines overlay — always visible */}
      <div className="scanlines" />

      {/* CRT vignette */}
      <div className="crt-vignette" />

      <div
        className={`game-viewport ${glitchActive ? 'glitching' : ''} ${gameOverGlitch ? 'death-glitch' : ''}`}
        style={{
          transform: `rotate(${rotation}deg) translate(${screenShake.x}px, ${screenShake.y}px)`,
          filter: getFilters(),
        }}
      >
        <div className="game-container" onClick={jump}>
          {/* Psychedelic background layer */}
          <div
            className="psychedelic-bg"
            style={{
              background: isStarted
                ? `linear-gradient(${hueShift}deg,
                    hsl(${hueShift}, 70%, 60%),
                    hsl(${(hueShift + 60) % 360}, 80%, 50%),
                    hsl(${(hueShift + 120) % 360}, 70%, 60%))`
                : undefined,
              opacity: isStarted ? 0.4 + glitchIntensity * 0.3 : 0,
            }}
          />

          {/* Static noise overlay */}
          {staticNoise && <div className="static-noise" />}

          {/* RGB channel shift layers */}
          {(channelShift.r !== 0 || channelShift.g !== 0) && (
            <>
              <div className="channel-shift channel-r" style={{ transform: `translate(${channelShift.r}px, ${channelShift.g}px)` }} />
              <div className="channel-shift channel-b" style={{ transform: `translate(${channelShift.b}px, ${-channelShift.r}px)` }} />
            </>
          )}

          {/* Score */}
          <div className={`score ${glitchActive ? 'score-glitch' : ''}`}>
            {glitchActive && score > 5 ? String(score).split('').sort(() => Math.random() - 0.5).join('') : score}
          </div>
          <div className="level-badge">LEVEL {level}</div>

          {/* Glitch message */}
          {showMessage && (
            <div
              className="glitch-message"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${10 + Math.random() * 30}%`,
                transform: `rotate(${(Math.random() - 0.5) * 30}deg)`,
              }}
            >
              {glitchMessage}
            </div>
          )}

          {/* Start / Game Over overlay */}
          {(!isStarted || isGameOver) && (
            <div className={`overlay ${isGameOver ? 'overlay-death' : ''}`}>
              <h1 className={isGameOver && score > 10 ? 'title-corrupted' : ''}>
                {isGameOver
                  ? (score > 20 ? 'G̷̛A̸M̵E̷ ̶O̸V̵E̸R̶' : 'GAME OVER')
                  : 'GLITCH BIRD'}
              </h1>
              {isGameOver && <h2>Score: {score}</h2>}
              {isGameOver && score > 15 && (
                <p className="death-message">THE BIRD REMEMBERS...</p>
              )}
              <button
                className="btn-start"
                onClick={(e) => {
                  e.stopPropagation();
                  isGameOver ? resetGame() : jump();
                }}
              >
                {isGameOver ? 'TRY AGAIN' : 'START GAME'}
              </button>
              {!isGameOver && (
                <>
                  <p style={{ marginTop: '20px', color: '#aaa' }}>Press Space or Click</p>
                  <p className="subtitle-warning">⚠ UNSTABLE BUILD ⚠</p>
                </>
              )}
            </div>
          )}

          {/* Bird */}
          <div
            className={`bird ${glitchActive ? 'bird-glitch' : ''}`}
            style={{
              top: birdY,
              transform: `rotate(${Math.min(birdVelocity * 3, 45)}deg)`,
            }}
          >
            <div className="bird-wing"></div>
            <div className="bird-beak"></div>
          </div>

          {/* Pipes */}
          {pipes.map(pipe => (
            <div
              key={pipe.id}
              className={`pipe-container ${glitchActive ? 'pipe-glitch' : ''}`}
              style={{ left: pipe.x }}
            >
              <div className="pipe-top" style={{ height: pipe.topHeight }}>
                <div className="pipe-cap"></div>
              </div>
              <div className="pipe-bottom" style={{ height: GAME_HEIGHT - pipe.topHeight - PIPE_GAP }}>
                <div className="pipe-cap"></div>
              </div>
            </div>
          ))}

          {/* Horizontal glitch bars */}
          {glitchActive && (
            <div className="glitch-bars">
              {Array.from({ length: 3 + Math.floor(Math.random() * 5) }).map((_, i) => (
                <div
                  key={i}
                  className="glitch-bar"
                  style={{
                    top: `${Math.random() * 100}%`,
                    height: `${2 + Math.random() * 8}px`,
                    transform: `translateX(${(Math.random() - 0.5) * 30}px)`,
                    opacity: 0.3 + Math.random() * 0.7,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
