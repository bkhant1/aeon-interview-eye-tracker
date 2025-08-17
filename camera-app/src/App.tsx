import { useState } from 'react'
import RecordTab from './components/RecordTab'
import PlaybackTab from './components/PlaybackTab'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<'record' | 'playback'>('record')

  return (
    <div className="App">
      <header className="App-header">
        <h1>Eye Tracking App</h1>
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'record' ? 'active' : ''}`}
            onClick={() => setActiveTab('record')}
          >
            📹 Record
          </button>
          <button 
            className={`tab-btn ${activeTab === 'playback' ? 'active' : ''}`}
            onClick={() => setActiveTab('playback')}
          >
            ▶️ Playback
          </button>
        </div>
      </header>
      
      <main className="App-main">
        {activeTab === 'record' && <RecordTab />}
        {activeTab === 'playback' && <PlaybackTab />}
      </main>
    </div>
  )
}

export default App
