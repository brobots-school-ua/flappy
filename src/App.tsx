import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

const GRAVITY = 0.5;
const JUMP_STRENGTH = -7;
const INITIAL_PIPE_SPEED = 3;
const PIPE_GAP = 180;
const PIPE_WIDTH = 70;
const BIRD_WIDTH = 45;
const BIRD_HEIGHT = 35;

interface PipeData {
  id: number;
  x: number;
  topHeight: number;
}

// Glitch messages — look like real system errors
const GLITCH_MESSAGES = [
  "ERROR 404: REALITY NOT FOUND",
  "SYSTEM FAILURE",
  "GPU DRIVER CRASHED",
  "OUT OF MEMORY",
  "DISPLAY DRIVER STOPPED RESPONDING",
  "CRITICAL PROCESS DIED",
  "KERNEL PANIC",
  "SEGMENTATION FAULT",
  "FATAL ERROR 0xDEAD",
  "VIDEO TDR FAILURE",
  "BAD_SYSTEM_CONFIG_INFO",
  "IRQL_NOT_LESS_OR_EQUAL",
  "̷̧̛̤̈́E̸̟̊R̵̭̈́R̸̰̋O̷̧̔R̵̫̈",
  "YOUR GPU IS OVERHEATING",
  "DRIVER_IRQL_NOT_LESS_OR_EQUAL",
  "CRITICAL_STRUCTURE_CORRUPTION",
];

function App() {
  // Game state — use refs for game loop, state for rendering
  const [birdY, setBirdY] = useState(0);
  const [pipes, setPipes] = useState<PipeData[]>([]);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  // Screen dimensions
  const [screenW, setScreenW] = useState(window.innerWidth);
  const [screenH, setScreenH] = useState(window.innerHeight);

  // Glitch state
  const [rotation, setRotation] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);
  const [hueShift, setHueShift] = useState(0);
  const [glitchMessage, setGlitchMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0 });
  const [invertColors, setInvertColors] = useState(false);
  const [staticNoise, setStaticNoise] = useState(false);
  const [channelShift, setChannelShift] = useState({ r: 0, g: 0, b: 0 });
  const [freezeFrame, setFreezeFrame] = useState(false);
  const [blueScreen, setBlueScreen] = useState(false);
  const [screenTear, setScreenTear] = useState(false);

  // Refs for game loop (avoids dependency issues)
  const gameLoopRef = useRef<number>(0);
  const birdYRef = useRef(0);
  const birdVelRef = useRef(0);
  const pipesRef = useRef<PipeData[]>([]);
  const scoreRef = useRef(0);
  const pipeSpawnTimerRef = useRef(0);
  const isGameOverRef = useRef(false);
  const freezeRef = useRef(false);
  const lastRotationScore = useRef(0);
  const screenWRef = useRef(window.innerWidth);
  const screenHRef = useRef(window.innerHeight);
  const firstPipePassed = useRef(false);

  const glitchIntervalRef = useRef<number>(0);
  const psychedelicRef = useRef<number>(0);

  // Bird X position (center-ish, 30% from left)
  const birdX = Math.floor(screenW * 0.3);

  // Difficulty
  const level = Math.floor(score / 10) + 1;
  const glitchIntensity = Math.min(score / 30, 1);

  // Sync refs with state
  useEffect(() => { freezeRef.current = freezeFrame; }, [freezeFrame]);
  useEffect(() => {
    screenWRef.current = screenW;
    screenHRef.current = screenH;
  }, [screenW, screenH]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setScreenW(window.innerWidth);
      setScreenH(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Init bird at center
  useEffect(() => {
    const centerY = Math.floor(window.innerHeight / 2);
    setBirdY(centerY);
    birdYRef.current = centerY;
  }, []);

  const jump = useCallback(() => {
    if (isGameOverRef.current) return;
    birdVelRef.current = JUMP_STRENGTH;
  }, []);

  const startGame = useCallback(() => {
    if (isGameOverRef.current) return;
    setIsStarted(true);
    birdVelRef.current = JUMP_STRENGTH;
  }, []);

  const resetGame = useCallback(() => {
    const centerY = Math.floor(screenHRef.current / 2);
    birdYRef.current = centerY;
    birdVelRef.current = 0;
    pipesRef.current = [];
    scoreRef.current = 0;
    isGameOverRef.current = false;
    firstPipePassed.current = false;
    pipeSpawnTimerRef.current = 0;
    lastRotationScore.current = 0;

    setBirdY(centerY);
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
    setFreezeFrame(false);
    setBlueScreen(false);
    setScreenTear(false);
  }, []);

  // Fullscreen on start
  useEffect(() => {
    if (isStarted && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, [isStarted]);

  // ROTATION: every 10 score, rotate 25-30 degrees
  useEffect(() => {
    if (score > 0 && score % 10 === 0 && score !== lastRotationScore.current) {
      lastRotationScore.current = score;
      const angle = 25 + Math.random() * 5;
      const direction = Math.random() > 0.5 ? 1 : -1;
      setRotation(prev => prev + angle * direction);
    }
  }, [score]);

  // GLITCH EFFECTS
  useEffect(() => {
    if (!isStarted || isGameOver) return;

    const triggerGlitch = () => {
      const maxType = Math.min(6 + Math.floor(scoreRef.current / 10), 12);
      const type = Math.floor(Math.random() * maxType);
      const intensity = Math.min(scoreRef.current / 30, 1);
      setGlitchActive(true);

      switch (type) {
        case 0:
        case 1: {
          const amt = 8 + intensity * 25;
          setScreenShake({
            x: (Math.random() - 0.5) * amt,
            y: (Math.random() - 0.5) * amt,
          });
          setTimeout(() => setScreenShake({ x: 0, y: 0 }), 150);
          break;
        }
        case 2:
          setInvertColors(true);
          setTimeout(() => setInvertColors(false), 80 + Math.random() * 250);
          break;
        case 3:
        case 4:
          setStaticNoise(true);
          setTimeout(() => setStaticNoise(false), 100 + Math.random() * 400);
          break;
        case 5:
          setChannelShift({
            r: (Math.random() - 0.5) * 15,
            g: (Math.random() - 0.5) * 15,
            b: (Math.random() - 0.5) * 15,
          });
          setTimeout(() => setChannelShift({ r: 0, g: 0, b: 0 }), 200);
          break;
        case 6:
        case 7:
          setGlitchMessage(GLITCH_MESSAGES[Math.floor(Math.random() * GLITCH_MESSAGES.length)]);
          setShowMessage(true);
          setTimeout(() => setShowMessage(false), 800 + Math.random() * 1500);
          break;
        case 8:
          setFreezeFrame(true);
          setTimeout(() => setFreezeFrame(false), 300 + Math.random() * 500);
          break;
        case 9:
          setBlueScreen(true);
          setTimeout(() => setBlueScreen(false), 200 + Math.random() * 400);
          break;
        case 10:
        case 11:
          setScreenTear(true);
          setTimeout(() => setScreenTear(false), 150 + Math.random() * 300);
          break;
      }

      setTimeout(() => setGlitchActive(false), 100 + Math.random() * 150);
    };

    const baseInterval = Math.max(600, 1500 - scoreRef.current * 20);
    const interval = baseInterval + Math.random() * 1000;
    glitchIntervalRef.current = window.setInterval(triggerGlitch, interval);

    return () => clearInterval(glitchIntervalRef.current);
  }, [isStarted, isGameOver]);

  // Psychedelic hue rotation
  useEffect(() => {
    if (!isStarted || isGameOver) return;
    const animate = () => {
      setHueShift(prev => (prev + 1.5) % 360);
      psychedelicRef.current = requestAnimationFrame(animate);
    };
    psychedelicRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(psychedelicRef.current);
  }, [isStarted, isGameOver]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isStarted) startGame();
        else jump();
      }
      if (e.code === 'Enter') {
        e.preventDefault();
        if (isGameOver) resetGame();
        else if (!isStarted) startGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump, startGame, resetGame, isGameOver, isStarted]);

  // MAIN GAME LOOP — runs on refs, updates state for rendering
  useEffect(() => {
    if (!isStarted || isGameOver) return;

    const currentPipeSpeed = () => INITIAL_PIPE_SPEED + Math.floor(scoreRef.current / 10) * 0.5;
    const currentLevel = () => Math.floor(scoreRef.current / 10) + 1;
    const birdXPos = Math.floor(screenWRef.current * 0.3);

    const update = () => {
      if (isGameOverRef.current) return;

      // Skip updates during freeze (but keep loop running)
      if (freezeRef.current) {
        gameLoopRef.current = requestAnimationFrame(update);
        return;
      }

      const sH = screenHRef.current;
      const sW = screenWRef.current;
      const speed = currentPipeSpeed();

      // Update bird physics
      birdVelRef.current += GRAVITY;
      birdYRef.current += birdVelRef.current;

      // Floor/ceiling collision
      if (birdYRef.current <= 0 || birdYRef.current + BIRD_HEIGHT >= sH) {
        birdYRef.current = Math.max(0, Math.min(birdYRef.current, sH - BIRD_HEIGHT));
        isGameOverRef.current = true;
        setIsGameOver(true);
        setBirdY(birdYRef.current);
        return;
      }

      // Move pipes
      pipesRef.current = pipesRef.current
        .map(p => ({ ...p, x: p.x - speed }))
        .filter(p => p.x + PIPE_WIDTH > 0);

      // Collision detection (skip if first pipe not reached yet = invincible)
      for (const pipe of pipesRef.current) {
        const birdRight = birdXPos + BIRD_WIDTH;
        const birdLeft = birdXPos;

        if (birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH) {
          // Only check collision after first pipe is passed
          if (firstPipePassed.current) {
            if (birdYRef.current < pipe.topHeight || birdYRef.current + BIRD_HEIGHT > pipe.topHeight + PIPE_GAP) {
              isGameOverRef.current = true;
              setIsGameOver(true);
              setBirdY(birdYRef.current);
              setPipes([...pipesRef.current]);
              return;
            }
          }
        }

        // Score — pipe passed bird
        if (pipe.x + speed >= birdXPos && pipe.x < birdXPos) {
          scoreRef.current += 1;
          firstPipePassed.current = true;
          setScore(scoreRef.current);
        }
      }

      // Spawn pipes
      pipeSpawnTimerRef.current += 1;
      const spawnRate = Math.max(60, 100 - currentLevel() * 5);
      if (pipeSpawnTimerRef.current >= spawnRate) {
        const minHeight = 80;
        const maxHeight = sH - PIPE_GAP - 80;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        pipesRef.current.push({ id: Date.now(), x: sW, topHeight });
        pipeSpawnTimerRef.current = 0;
      }

      // Sync to React state for rendering
      setBirdY(birdYRef.current);
      setPipes([...pipesRef.current]);

      gameLoopRef.current = requestAnimationFrame(update);
    };

    gameLoopRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [isStarted, isGameOver]);

  // CSS filters
  const getFilters = () => {
    const filters: string[] = [];
    if (isStarted) filters.push(`hue-rotate(${hueShift}deg)`);
    if (invertColors) filters.push('invert(1)');
    if (glitchActive) filters.push(`saturate(${1.5 + glitchIntensity * 3})`);
    if (score > 15) filters.push(`contrast(${1 + glitchIntensity * 0.5})`);
    return filters.length ? filters.join(' ') : 'none';
  };

  const handleClick = () => {
    if (isGameOver) resetGame();
    else if (!isStarted) startGame();
    else jump();
  };

  return (
    <div className={`fullscreen-wrapper ${(!isStarted || isGameOver) ? 'cursor-visible' : 'cursor-hidden'}`} onClick={handleClick}>
      {/* Psychedelic TV background */}
      <div
        className="tv-background"
        style={{
          opacity: isStarted ? 0.35 + glitchIntensity * 0.35 : 0.15,
          filter: `hue-rotate(${hueShift}deg)`,
          animationDuration: `${Math.max(2, 8 - glitchIntensity * 6)}s`,
        }}
      />

      {/* Scanlines */}
      <div className="scanlines" />
      <div className="crt-vignette" />

      {/* Blue screen flash */}
      {blueScreen && (
        <div className="bsod">
          <p className="bsod-face">:(</p>
          <p>Your PC ran into a problem and needs to restart.</p>
          <p className="bsod-code">Stop code: FLAPPY_BIRD_EXCEPTION</p>
        </div>
      )}

      {/* Fake system error */}
      {showMessage && (
        <div
          className="system-error"
          style={{
            top: `${10 + Math.random() * 70}%`,
            left: `${5 + Math.random() * 60}%`,
          }}
        >
          <div className="error-titlebar">
            <span>⚠ System Error</span>
            <span className="error-close">✕</span>
          </div>
          <div className="error-body">
            <p>{glitchMessage}</p>
            <button className="error-btn">OK</button>
          </div>
        </div>
      )}

      {/* Screen tear */}
      {screenTear && (
        <div className="screen-tear">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="tear-slice"
              style={{
                top: `${i * 20}%`,
                height: '20%',
                transform: `translateX(${(Math.random() - 0.5) * 40}px)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main game area */}
      <div
        className={`game-area ${glitchActive ? 'glitching' : ''}`}
        style={{
          transform: `rotate(${rotation}deg) translate(${screenShake.x}px, ${screenShake.y}px)`,
          filter: getFilters(),
        }}
      >
        {staticNoise && <div className="static-noise" />}

        {(channelShift.r !== 0 || channelShift.g !== 0) && (
          <>
            <div className="channel-shift channel-r" style={{ transform: `translate(${channelShift.r}px, ${channelShift.g}px)` }} />
            <div className="channel-shift channel-b" style={{ transform: `translate(${channelShift.b}px, ${-channelShift.r}px)` }} />
          </>
        )}

        {/* Score */}
        <div className={`score ${glitchActive ? 'score-glitch' : ''}`}>
          {glitchActive && score > 5
            ? String(score).split('').sort(() => Math.random() - 0.5).join('')
            : score}
        </div>
        {score > 0 && <div className="level-badge">LVL {level}</div>}

        {/* Invincibility indicator */}
        {isStarted && !isGameOver && !firstPipePassed.current && (
          <div className="invincible-hint">SHIELD ACTIVE</div>
        )}

        {/* Start / Game Over */}
        {(!isStarted || isGameOver) && (
          <div className={`overlay ${isGameOver ? 'overlay-death' : ''}`}>
            <h1 className={isGameOver && score > 10 ? 'title-corrupted' : ''}>
              {isGameOver
                ? (score > 20 ? 'G̷̛A̸M̵E̷ ̶O̸V̵E̸R̶' : 'GAME OVER')
                : 'GLITCH BIRD'}
            </h1>
            {isGameOver && <h2 className="final-score">Score: {score}</h2>}
            {isGameOver && score > 15 && (
              <p className="death-message">THE BIRD REMEMBERS...</p>
            )}
            <button
              className="btn-start"
              onClick={(e) => {
                e.stopPropagation();
                isGameOver ? resetGame() : startGame();
              }}
            >
              {isGameOver ? 'TRY AGAIN' : 'START GAME'}
            </button>
            {isGameOver && (
              <p className="hint-text">Press Enter or Click to continue</p>
            )}
            {!isGameOver && (
              <>
                <p className="hint-text">Press Space or Tap to start</p>
                <p className="subtitle-warning">⚠ UNSTABLE BUILD v0.̷6̵.̸6̷ ⚠</p>
              </>
            )}
          </div>
        )}

        {/* Bird */}
        <div
          className={`bird ${glitchActive ? 'bird-glitch' : ''}`}
          style={{
            top: birdY,
            left: birdX,
            transform: `rotate(${Math.min(Math.max(birdVelRef.current * 3, -30), 45)}deg)`,
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
            style={{ left: pipe.x, height: screenH }}
          >
            <div className="pipe-top" style={{ height: pipe.topHeight }}>
              <div className="pipe-cap"></div>
            </div>
            <div className="pipe-bottom" style={{ height: screenH - pipe.topHeight - PIPE_GAP }}>
              <div className="pipe-cap"></div>
            </div>
          </div>
        ))}

        {/* Glitch bars */}
        {glitchActive && (
          <div className="glitch-bars">
            {Array.from({ length: 3 + Math.floor(Math.random() * 5) }).map((_, i) => (
              <div
                key={i}
                className="glitch-bar"
                style={{
                  top: `${Math.random() * 100}%`,
                  height: `${2 + Math.random() * 8}px`,
                  transform: `translateX(${(Math.random() - 0.5) * 50}px)`,
                  opacity: 0.3 + Math.random() * 0.7,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
