import { useState, useEffect, useRef } from 'react'

const THEMES = {
  Animaux: ['🐰', '🦊', '🐸', '🐢', '🦉', '🐝', '🐠', '🦋'],
  Nature: ['🌸', '🌻', '🍄', '🌿', '🌵', '🍁', '🌳', '🌷'],
}

const LEVELS = {
  Débutant: 4,
  Intermédiaire: 6,
  Avancé: 8,
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildDeck(theme, pairs) {
  const picked = THEMES[theme].slice(0, pairs)
  const cards = picked.flatMap((emoji, i) => [
    { id: i + '-a', emoji, pairId: i },
    { id: i + '-b', emoji, pairId: i },
  ])
  return shuffle(cards)
}

export default function App() {
  const [screen, setScreen] = useState('home') // home | play | end
  const [theme, setTheme] = useState('Animaux')
  const [level, setLevel] = useState('Débutant')

  const [deck, setDeck] = useState([])
  const [flipped, setFlipped] = useState([]) // index des cartes retournées
  const [matched, setMatched] = useState([]) // pairId trouvés
  const [wrong, setWrong] = useState([]) // index mauvaise paire (feedback)
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef(null)

  const pairs = LEVELS[level]

  function startGame() {
    setDeck(buildDeck(theme, pairs))
    setFlipped([])
    setMatched([])
    setWrong([])
    setMoves(0)
    setSeconds(0)
    setScreen('play')
  }

  // Timer
  useEffect(() => {
    if (screen === 'play') {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
      return () => clearInterval(timerRef.current)
    }
  }, [screen])

  // Détection des paires
  useEffect(() => {
    if (flipped.length !== 2) return
    const [i, j] = flipped
    setMoves((m) => m + 1)
    if (deck[i].pairId === deck[j].pairId) {
      setMatched((prev) => [...prev, deck[i].pairId])
      setFlipped([])
    } else {
      setWrong([i, j])
      const t = setTimeout(() => {
        setFlipped([])
        setWrong([])
      }, 800)
      return () => clearTimeout(t)
    }
  }, [flipped, deck])

  // Fin de partie
  useEffect(() => {
    if (deck.length > 0 && matched.length === pairs) {
      clearInterval(timerRef.current)
      const t = setTimeout(() => setScreen('end'), 600)
      return () => clearTimeout(t)
    }
  }, [matched, pairs, deck])

  function handleCard(index) {
    if (flipped.length === 2) return
    if (flipped.includes(index)) return
    if (matched.includes(deck[index].pairId)) return
    setFlipped((prev) => [...prev, index])
  }

  function fmtTime(s) {
    const m = String(Math.floor(s / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    return `${m}:${sec}`
  }

  const cols = pairs <= 4 ? 4 : pairs <= 6 ? 4 : 4

  return (
    <div className="app">
      {screen === 'home' && (
        <main className="card-panel home">
          <h1 className="title">🌿 MemoGarden</h1>
          <p className="subtitle">Testez votre mémoire dans un jardin de cartes.</p>

          <section className="config">
            <div className="config-group">
              <label className="config-label">Niveau</label>
              <div className="options">
                {Object.keys(LEVELS).map((l) => (
                  <button
                    key={l}
                    className={'chip' + (level === l ? ' chip-active' : '')}
                    onClick={() => setLevel(l)}
                  >
                    {l} <span className="chip-meta">{LEVELS[l]} paires</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="config-group">
              <label className="config-label">Thème</label>
              <div className="options">
                {Object.keys(THEMES).map((t) => (
                  <button
                    key={t}
                    className={'chip' + (theme === t ? ' chip-active' : '')}
                    onClick={() => setTheme(t)}
                  >
                    {t === 'Animaux' ? '🦊' : '🌸'} {t}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <button className="btn-primary" onClick={startGame}>
            Commencer
          </button>
        </main>
      )}

      {screen === 'play' && (
        <main className="play">
          <header className="hud">
            <div className="hud-item">
              <span className="hud-label">Temps</span>
              <span className="hud-value">{fmtTime(seconds)}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Coups</span>
              <span className="hud-value">{moves}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">Paires</span>
              <span className="hud-value">{matched.length}/{pairs}</span>
            </div>
          </header>

          <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {deck.map((card, index) => {
              const isUp =
                flipped.includes(index) || matched.includes(card.pairId)
              const isMatched = matched.includes(card.pairId)
              const isWrong = wrong.includes(index)
              return (
                <button
                  key={card.id}
                  className={
                    'tile' +
                    (isUp ? ' tile-up' : '') +
                    (isMatched ? ' tile-matched' : '') +
                    (isWrong ? ' tile-wrong' : '')
                  }
                  onClick={() => handleCard(index)}
                  aria-label={isUp ? card.emoji : 'carte cachée'}
                >
                  <span className="tile-inner">{isUp ? card.emoji : '❔'}</span>
                </button>
              )
            })}
          </div>

          <button className="btn-ghost" onClick={() => setScreen('home')}>
            Quitter
          </button>
        </main>
      )}

      {screen === 'end' && (
        <main className="card-panel end">
          <h1 className="title">Bravo ! 🎉</h1>
          <p className="subtitle">Jardin mémorisé avec succès.</p>
          <div className="score">
            <div className="score-row">
              <span>Temps</span>
              <strong>{fmtTime(seconds)}</strong>
            </div>
            <div className="score-row">
              <span>Coups</span>
              <strong>{moves}</strong>
            </div>
            <div className="score-row">
              <span>Paires</span>
              <strong>{pairs}</strong>
            </div>
          </div>
          <div className="end-actions">
            <button className="btn-primary" onClick={startGame}>
              Rejouer
            </button>
            <button className="btn-ghost" onClick={() => setScreen('home')}>
              Accueil
            </button>
          </div>
        </main>
      )}
    </div>
  )
}
