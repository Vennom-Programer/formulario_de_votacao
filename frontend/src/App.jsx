import { useEffect, useState } from 'react'
import './App.css'

const scores = Array.from({ length: 11 }, (_, index) => index)
const API_URL = import.meta.env.VITE_API_URL || ''

function AuthScreen({ onAuthenticated, initialMessage }) {
  const [mode, setMode] = useState('login')
  const [profileType, setProfileType] = useState('visitante')
  const [identifier, setIdentifier] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [status, setStatus] = useState({
    type: initialMessage ? 'error' : '',
    message: initialMessage || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isRegistering = mode === 'cadastro'

  function changeMode(nextMode) {
    setMode(nextMode)
    setStatus({ type: '', message: '' })
    setPassword('')
    setPasswordConfirmation('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: '', message: '' })

    const body = {
      tipo: profileType,
      senha: password,
      ...(profileType === 'visitante' ? { cpf: identifier } : { matricula: identifier }),
      ...(isRegistering
        ? { nome: name, email, confirmarSenha: passwordConfirmation }
        : {}),
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/${isRegistering ? 'cadastro' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.mensagem || 'Não foi possível concluir a operação.')
      }

      if (isRegistering) {
        setMode('login')
        setPassword('')
        setPasswordConfirmation('')
        setStatus({ type: 'success', message: result.mensagem })
      } else {
        if (typeof result.token !== 'string' || !result.token) {
          throw new Error('O servidor não retornou uma sessão válida.')
        }
        onAuthenticated(result.token)
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Não foi possível conectar ao servidor.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Voto aberto, início">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>voto<span className="brand-light">aberto</span></span>
        </a>
        <div className="event-label"><span className="live-dot" /> Acesso à votação</div>
      </header>

      <section className="auth-workspace">
        <aside className="auth-intro">
          <div className="eyebrow"><span>01</span> IDENTIFICAÇÃO SEGURA</div>
          <h1>{isRegistering ? <>Faça parte da <em>votação.</em></> : <>Suas ideias<br />merecem ser <em>ouvidas.</em></>}</h1>
          <p className="intro-copy">
            {isRegistering
              ? 'Crie seu acesso para participar da avaliação dos projetos.'
              : 'Entre para avaliar os projetos e contribuir com a comunidade.'}
          </p>
          <div className="scale-note auth-note">
            <span className="scale-icon" aria-hidden="true">↗</span>
            <p>
              <strong>Acesso seguro.</strong><br />
              Seus dados identificam sua participação na votação.
            </p>
          </div>
        </aside>

        <section className="form-panel auth-panel" aria-labelledby="auth-title">
          <div className="form-heading">
            <div>
              <div className="form-kicker">{isRegistering ? 'NOVO CADASTRO' : 'ÁREA DO PARTICIPANTE'}</div>
              <h2 id="auth-title">{isRegistering ? 'Criar conta' : 'Acessar votação'}</h2>
            </div>
            <span className="required-note"><span>*</span> Obrigatório</span>
          </div>

          <form onSubmit={handleSubmit}>
            <fieldset className="auth-types">
              <legend>Você é:</legend>
              <label className={profileType === 'visitante' ? 'auth-type selected' : 'auth-type'}>
                <input
                  checked={profileType === 'visitante'}
                  name="tipo"
                  onChange={() => { setProfileType('visitante'); setIdentifier('') }}
                  type="radio"
                  value="visitante"
                />
                <span>Visitante</span>
              </label>
              <label className={profileType === 'aluno' ? 'auth-type selected' : 'auth-type'}>
                <input
                  checked={profileType === 'aluno'}
                  name="tipo"
                  onChange={() => { setProfileType('aluno'); setIdentifier('') }}
                  type="radio"
                  value="aluno"
                />
                <span>Aluno</span>
              </label>
            </fieldset>

            <div className="auth-fields">
              <label className="field">
                <span>{profileType === 'visitante' ? 'CPF' : 'Matrícula'} <span className="required-star">*</span></span>
                <input
                  autoComplete="username"
                  inputMode="numeric"
                  maxLength={profileType === 'visitante' ? 14 : 10}
                  name={profileType === 'visitante' ? 'cpf' : 'matricula'}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder={profileType === 'visitante' ? '000.000.000-00' : 'Digite sua matrícula'}
                  required
                  value={identifier}
                />
              </label>

              {isRegistering && (
                <>
                  <label className="field">
                    <span>Nome completo <span className="required-star">*</span></span>
                    <input
                      autoComplete="name"
                      maxLength={120}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Seu nome"
                      required
                      value={name}
                    />
                  </label>
                  <label className="field">
                    <span>E-mail <span className="required-star">*</span></span>
                    <input
                      autoComplete="email"
                      maxLength={254}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="voce@exemplo.com"
                      required
                      type="email"
                      value={email}
                    />
                  </label>
                </>
              )}

              <label className="field">
                <span>Senha <span className="required-star">*</span></span>
                <input
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isRegistering ? 'Mínimo de 8 caracteres' : 'Digite sua senha'}
                  required
                  type="password"
                  value={password}
                />
              </label>

              {isRegistering && (
                <label className="field">
                  <span>Confirme sua senha <span className="required-star">*</span></span>
                  <input
                    autoComplete="new-password"
                    minLength={8}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    placeholder="Digite a senha novamente"
                    required
                    type="password"
                    value={passwordConfirmation}
                  />
                </label>
              )}
            </div>

            {status.message && (
              <div className={`auth-feedback ${status.type}`} role="status">{status.message}</div>
            )}

            <button className="submit-button auth-submit" disabled={isSubmitting} type="submit">
              {isSubmitting
                ? 'Aguarde...'
                : isRegistering
                  ? 'Criar cadastro'
                  : 'Entrar'}
              <span aria-hidden="true">↗</span>
            </button>
          </form>

          <p className="auth-switch">
            {isRegistering ? 'Já tem cadastro?' : 'Ainda não tem cadastro?'}
            {' '}
            <button
              onClick={() => changeMode(isRegistering ? 'login' : 'cadastro')}
              type="button"
            >
              {isRegistering ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
        </section>
      </section>

      <footer className="page-footer">
        <span>VOTO ABERTO <span className="footer-separator">/</span> AVALIAÇÃO DE PROJETOS</span>
        <span>Acesso protegido.</span>
      </footer>
    </main>
  )
}

function VotingPage({ token, onLogout }) {
  const [criteria, setCriteria] = useState([])
  const [projects, setProjects] = useState([])
  const [code, setCode] = useState('')
  const [projectId, setProjectId] = useState('')
  const [ratings, setRatings] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(true)
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)

  const completedRatings = Object.keys(ratings).length

  useEffect(() => {
    let active = true

    async function loadCriteria() {
      try {
        const response = await fetch(`${API_URL}/api/avaliacoes/criterios`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.mensagem || 'Não foi possível carregar os critérios.')
        }

        if (
          !Array.isArray(result.criterios) ||
          result.criterios.length !== 6 ||
          result.criterios.some((criterion) => (
            !Number.isInteger(criterion.id_criterio) ||
            typeof criterion.nome !== 'string' ||
            !criterion.nome.trim()
          ))
        ) {
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

  useEffect(() => {
    let active = true

    async function loadProjects() {
      try {
        const response = await fetch(`${API_URL}/api/projetos`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.mensagem || 'Não foi possível carregar os projetos.')
        }

        if (
          !Array.isArray(result.projetos) ||
          result.projetos.some((project) => (
            !Number.isInteger(Number(project.id_projeto)) ||
            typeof project.nome !== 'string' ||
            !project.nome.trim()
          ))
        ) {
          throw new Error('A lista de projetos recebida é inválida.')
        }

        if (active) setProjects(result.projetos)
      } catch (error) {
        if (active) {
          setStatus({
            type: 'error',
            message: error.message || 'Não foi possível carregar os projetos.',
          })
        }
      } finally {
        if (active) setIsLoadingProjects(false)
      }
    }

    loadProjects()
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
      const response = await fetch(`${API_URL}/api/avaliacoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          codigo: code.trim(),
          id_projeto: Number(projectId),
          notas: criteria.map((criterion) => ({
            id_criterio: criterion.id_criterio,
            valor: ratings[criterion.id_criterio],
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
        <button className="logout-button" onClick={onLogout} type="button">Sair</button>
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
                <span>Projeto <span className="required-star">*</span></span>
                <select
                  name="projeto"
                  onChange={(event) => setProjectId(event.target.value)}
                  required
                  value={projectId}
                  disabled={isLoadingProjects || projects.length === 0}
                >
                  <option value="">
                    {isLoadingProjects ? 'Carregando projetos...' : 'Selecione um projeto'}
                  </option>
                  {projects.map((project) => (
                    <option key={project.id_projeto} value={project.id_projeto}>
                      {project.nome}
                    </option>
                  ))}
                </select>
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
              {criteria.map((criterion, index) => (
                <fieldset className="criterion-row" key={criterion.id_criterio}>
                  <legend>
                    <span className="criterion-number">{String(index + 1).padStart(2, '0')}</span>
                    <span>{criterion.nome}</span>
                  </legend>
                  <div className="rating-options" role="radiogroup" aria-label={`Nota para ${criterion.nome}`}>
                    {scores.map((score) => (
                      <label className="rating-option" key={score}>
                        <input
                          checked={ratings[criterion.id_criterio] === score}
                          name={`criterio-${criterion.id_criterio}`}
                          onChange={() => updateRating(criterion.id_criterio, score)}
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
              <button className="submit-button" disabled={isSubmitting || isLoadingCriteria || isLoadingProjects || criteria.length !== 6 || projects.length === 0} type="submit">
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

function App() {
  const [session, setSession] = useState(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [sessionMessage, setSessionMessage] = useState('')

  useEffect(() => {
    let active = true
    const token = sessionStorage.getItem('voto-token')

    if (!token) {
      setIsCheckingSession(false)
      return () => { active = false }
    }

    async function validarSessao() {
      try {
        const response = await fetch(`${API_URL}/api/auth/sessao`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const result = await response.json()

        if (!response.ok) {
          sessionStorage.removeItem('voto-token')
          throw new Error(result.mensagem || 'Sua sessão expirou. Entre novamente.')
        }

        if (active) setSession({ token })
      } catch (error) {
        if (active) {
          setSessionMessage(error.message || 'Não foi possível validar sua sessão.')
        }
      } finally {
        if (active) setIsCheckingSession(false)
      }
    }

    validarSessao()
    return () => { active = false }
  }, [])

  function handleAuthenticated(token) {
    sessionStorage.setItem('voto-token', token)
    setSession({ token })
    setSessionMessage('')
  }

  function handleLogout() {
    sessionStorage.removeItem('voto-token')
    setSession(null)
  }

  if (isCheckingSession) {
    return (
      <main className="auth-shell auth-loading" aria-live="polite">
        <div className="live-dot" />
        <p>Verificando acesso...</p>
      </main>
    )
  }

  if (!session) {
    return <AuthScreen onAuthenticated={handleAuthenticated} initialMessage={sessionMessage} />
  }

  return <VotingPage token={session.token} onLogout={handleLogout} />
}

export default App
