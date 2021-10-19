// useCallback: custom hooks
// http://localhost:3000/isolated/exercise/02.js

import * as React from 'react'
import {
  fetchPokemon,
  PokemonForm,
  PokemonDataView,
  PokemonInfoFallback,
  PokemonErrorBoundary,
} from '../pokemon'

function asyncReducer(state, action) {
  switch (action.type) {
    case 'pending': {
      return {status: 'pending', data: null, error: null}
    }
    case 'resolved': {
      return {status: 'resolved', data: action.data, error: null}
    }
    case 'rejected': {
      return {status: 'rejected', data: null, error: action.error}
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

function PokemonInfo({pokemonName}) {
  function useAsync() {
    const [state, dispatch] = React.useReducer(asyncReducer, {
      status: 'idle',
      data: null,
      error: null,
    })

    const run = React.useCallback(promise => {
      if (!promise) {
        return
      }
      promise.then(
        data => {
          console.log('all gud')
          dispatch({type: 'resolved', data})
        },
        error => {
          if (error.name !== 'AbortError') {
            dispatch({type: 'rejected', error})
          }
        },
      )
    }, [])

    return {...state, run}
  }

  const {data, status, error, run} = useAsync()

  React.useEffect(() => {
    if (!pokemonName) {
      return
    }

    const pokemonPromise = fetchPokemon(pokemonName, 1500, signal)

    run(pokemonPromise)
  }, [pokemonName, run])

  switch (status) {
    case 'idle':
      return <span>Submit a pokemon</span>
    case 'pending':
      return <PokemonInfoFallback name={pokemonName} />
    case 'rejected':
      throw error
    case 'resolved':
      return <PokemonDataView pokemon={data} />
    default:
      throw new Error('This should be impossible')
  }
}

function App() {
  const [pokemonName, setPokemonName] = React.useState('')

  function handleSubmit(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  function handleReset() {
    setPokemonName('')
  }

  return (
    <div className="pokemon-info-app">
      <PokemonForm pokemonName={pokemonName} onSubmit={handleSubmit} />
      <hr />
      <div className="pokemon-info">
        <PokemonErrorBoundary onReset={handleReset} resetKeys={[pokemonName]}>
          <PokemonInfo pokemonName={pokemonName} />
        </PokemonErrorBoundary>
      </div>
    </div>
  )
}
let controller = new AbortController()
let signal = controller.signal

function AppWithUnmountCheckbox() {
  const [mountApp, setMountApp] = React.useState(true)
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={mountApp}
          onChange={e => {
            if (mountApp) {
              console.log('will abort')
              controller.abort()
            } else {
              controller = new AbortController()
              signal = controller.signal
            }
            setMountApp(e.target.checked)
          }}
        />{' '}
        Mount Component
      </label>
      <hr />
      {mountApp ? <App /> : null}
    </div>
  )
}

export default AppWithUnmountCheckbox
