import { useEffect } from 'react'
import MathGame from './components/MathGame'
import { trackPageView } from './analytics'
import { LanguageProvider } from './contexts/LanguageContext'

function App() {
  useEffect(() => {
    // Track initial page view
    trackPageView('/')
  }, [])

  return (
    <LanguageProvider>
      <main className="container mx-auto p-4">
        <MathGame />
      </main>
    </LanguageProvider>
  )
}

export default App
