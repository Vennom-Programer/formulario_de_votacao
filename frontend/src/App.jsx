import { useEffect, useState } from 'react'
import './App.css'

const scores = Array.from({ length: 11 }, (_, index) => index)

function App() {
  const [criteria, setCriteria] = useState([])
  const [code, setCode] = useState('')
  const [projectId, setProjectId] = useState('')
  const [ratings, setRatings] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(true)

  const completedRatings = Object.keys(ratings).length

  useEffect(() => {
    let active = true

    async function loadCriteria() {
      try {
        const response = await fetch('/api/avaliacoes/criterios')
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.mensagem || 'Não foi possível carregar os critérios.')
        }

        if (!Array.isArray(result.criterios) || result.criterios.length !== 6) {
          throw new Error('A votação precisa ter seis critérios cadastrados.')
        }

        if (active) setCriteria(result.criterios)
      } catch (error) {
        if (active) {
          setStatus({
            type: 'error',
            message: error.message || 'Não foi possível carregar os critérios.',
          })
        }
      } finally {
        if (active) setIsLoadingCriteria(false)
      }
    }

    loadCriteria()
    return () => { active = false }
  }, [])

  function updateRating(criterionId, value) {
    setRatings((currentRatings) => ({
      ...currentRatings,
      [criterionId]: value,
    }))
    setStatus({ type: '', message: '' })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (completedRatings !== criteria.length) {
      setStatus({
        type: 'error',
        message: 'Escolha uma nota para cada um dos seis critérios.',
      })
      return
    }

    setIsSubmitting(true)
    setStatus({ type: '', message: '' })

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api/avaliacoes'
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: code.trim(),
          id_projeto: Number(projectId),
          notas: criteria.map((id) => ({
            id_criterio: id,
            valor: ratings[id],
          })),
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.mensagem || 'Não foi possível registrar seu voto.')
      }

      setStatus({
        type: 'success',
        message: result.mensagem || 'Seu voto foi registrado com sucesso.',
      })
      setCode('')
      setProjectId('')
      setRatings({})
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Não foi possível conectar à votação.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Voto aberto, início">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>voto<span className="brand-light">aberto</span></span>
        </a>
        <div className="event-label"><span className="live-dot" /> Votação em andamento</div>
      </header>

      <section className="workspace" id="inicio">
        <aside className="intro-panel">
          <div className="eyebrow"><span>01</span> ESCOLHA COM INTENÇÃO</div>
          <h1>Um bom projeto merece ser <em>visto.</em></h1>
          <p className="intro-copy">
            Sua avaliação ajuda a reconhecer ideias que fazem a diferença.
            Reserve um momento e vote com atenção.
          </p>

          <div className="progress-block" aria-live="polite">
            <div className="progress-copy">
              <span>Seu voto</span>
              <span>{String(completedRatings).padStart(2, '0')} <span className="muted">/ 06</span></span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Critérios avaliados"
              aria-valuenow={completedRatings}
              aria-valuemin={0}
              aria-valuemax={criteria.length}
            >
              <span style={{ width: `${(completedRatings / criteria.length) * 100}%` }} />
            </div>
            <p>{completedRatings === criteria.length ? 'Tudo pronto para enviar.' : 'Critérios avaliados'}</p>
          </div>

          <div className="scale-note">
            <span className="scale-icon" aria-hidden="true">↗</span>
            <p><strong>Uma escala simples.</strong><br />0 é a menor nota. 10 é a maior.</p>
          </div>
          <div className="orbit-art" aria-hidden="true">
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <span className="orbit-core">V</span>
            <span className="orbit-point" />
          </div>
        </aside>

        <section className="form-panel" aria-labelledby="form-title">
          <div className="form-heading">
            <div>
              <div className="form-kicker">FORMULÁRIO DE VOTAÇÃO</div>
              <h2 id="form-title">Registre sua avaliação</h2>
            </div>
            <span className="required-note"><span>*</span> Obrigatório</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="identity-fields">
              <label className="field">
                <span>Código de votação <span className="required-star">*</span></span>
                <input
                  autoComplete="off"
                  name="codigo"
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Digite seu código"
                  required
                  value={code}
                />
              </label>
              <label className="field field-project">
                <span>Número do projeto <span className="required-star">*</span></span>
                <input
                  inputMode="numeric"
                  min="1"
                  name="projeto"
                  onChange={(event) => setProjectId(event.target.value)}
                  placeholder="Ex.: 12"
                  required
                  step="1"
                  type="number"
                  value={projectId}
                />
              </label>
            </div>

            <div className="criteria-heading">
              <div>
                <h3>Sua avaliação</h3>
                <p>{isLoadingCriteria ? 'Carregando critérios cadastrados...' : 'Selecione uma nota para cada critério.'}</p>
              </div>
              <span className="scale-range">0 <span>ATÉ</span> 10</span>
            </div>

            <div className="criteria-list">
              {criteria.map((criterionId, index) => (
                <fieldset className="criterion-row" key={criterionId}>
                  <legend>
                    <span className="criterion-number">{String(index + 1).padStart(2, '0')}</span>
                    <span>Critério {index + 1}</span>
                  </legend>
                  <div className="rating-options" role="radiogroup" aria-label={`Nota para o critério ${index + 1}`}>
                    {scores.map((score) => (
                      <label className="rating-option" key={score}>
                        <input
                          checked={ratings[criterionId] === score}
                          name={`criterio-${criterionId}`}
                          onChange={() => updateRating(criterionId, score)}
                          type="radio"
                          value={score}
                        />
                        <span>{score}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>

            {status.message && (
              <div className={`form-message ${status.type}`} role="status">
                <span aria-hidden="true">{status.type === 'success' ? '✓' : '!'}</span>
                {status.message}
              </div>
            )}

            <div className="form-footer">
              <p>Confira suas notas antes de confirmar.<br /><span>Não é possível alterar o voto depois do envio.</span></p>
              <button className="submit-button" disabled={isSubmitting || isLoadingCriteria || criteria.length !== 6} type="submit">
                {isSubmitting ? 'Enviando...' : 'Confirmar voto'}
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          </form>
        </section>
      </section>

      <footer className="page-footer">
        <span>VOTO ABERTO <span className="footer-separator">/</span> AVALIAÇÃO DE PROJETOS</span>
        <span>Um voto de cada vez.</span>
      </footer>
    </main>
  )
}

export default App
