import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  // Use React.StrictMode with caution when handling sockets; 
  // it mounts/unmounts twice in dev causing double socket connections.
  // Using fragment instead to avoid dev double-join issues
  <>
    <App />
  </>
)
