import './services/batzo-flow.js';
import "./core/batzo-primary-bridge.js";
import "./batzo-contest-flow.jsx";
import "./batzo-visible-flow.js";
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';

const root = document.getElementById('root');

function ErrorScreen({ error }) {
  return React.createElement(
    'div',
    {
      style: {
        minHeight: '100vh',
        background: '#080b12',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        fontFamily: 'Arial,sans-serif',
        textAlign: 'center'
      }
    },
    React.createElement(
      'div',
      {
        style: {
          fontSize: '34px',
          fontWeight: '800',
          marginBottom: '10px'
        }
      },
      'BATZO'
    ),
    React.createElement(
      'div',
      {
        style: {
          fontSize: '20px',
          fontWeight: '700',
          marginBottom: '16px'
        }
      },
      'App Runtime Error'
    ),
    React.createElement(
      'pre',
      {
        style: {
          width: '100%',
          maxWidth: '700px',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          background: '#151a24',
          borderRadius: '12px',
          padding: '16px',
          boxSizing: 'border-box',
          color: '#ffb4b4',
          textAlign: 'left'
        }
      },
      String(error?.stack || error?.message || error)
    )
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('BATZO_RUNTIME_ERROR', error, info);
  }

  render() {
    if (this.state.error) {
      return React.createElement(ErrorScreen, {
        error: this.state.error
      });
    }

    return this.props.children;
  }
}

window.addEventListener('error', (event) => {
  console.error('BATZO_WINDOW_ERROR', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('BATZO_PROMISE_ERROR', event.reason);
});

async function startBatzo() {
  try {
    const module = await import('./App.jsx');
    const App = module.default;

    if (!App) {
      throw new Error('App.jsx has no default export');
    }

    ReactDOM.createRoot(root).render(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(
          AppErrorBoundary,
          null,
          React.createElement(App)
        )
      )
    );
  } catch (error) {
    console.error('BATZO_STARTUP_ERROR', error);

    ReactDOM.createRoot(root).render(
      React.createElement(ErrorScreen, { error })
    );
  }
}

startBatzo();

import "./match-flow.js";

import "./batzo-home-premium.css";

import "./batzo-player-showcase.css";
