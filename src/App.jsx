import { useEffect } from 'react'
import MathGame from './components/MathGame'
import { trackPageView } from './analytics'

function App() {
  useEffect(() => {
    // Track initial page view
    trackPageView('/')
  }, [])

  return (
    <main className="container mx-auto p-4">
      <MathGame />
    </main>
  )
}

export default App
