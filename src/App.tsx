import { AppShell } from './components/layout/AppShell'
import { PagesProvider } from './context/PagesContext'

function App() {
  return (
    <PagesProvider>
      <AppShell />
    </PagesProvider>
  )
}

export default App
