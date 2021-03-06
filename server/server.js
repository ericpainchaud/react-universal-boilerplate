/* eslint-disable no-console, no-use-before-define */

import path from 'path'
import express from 'express';
import qs from 'qs'

import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import webpackConfig from '../webpack.config'

import React from 'react'
import { renderToString } from 'react-dom/server'
import { Provider } from 'react-redux'

import configureStore from '../common/store/configureStore'
import App from '../common/containers/App'
import { fetchCounter } from '../common/api/counter'

const DEBUG = process.env.NODE_ENV !== 'production';
const PORT = 3000
const server = express()

if (DEBUG) {
  // Use this middleware to set up hot module reloading via webpack.
  const compiler = webpack(webpackConfig)
  server.use(webpackDevMiddleware(compiler, {
    historyApiFallback: true,
    hot: true,
    quiet: true,
    noInfo: true,
    publicPath: webpackConfig.output.publicPath
  }))
  server.use(webpackHotMiddleware(compiler))
}

// This is fired every time the server side receives a request
server.use(handleRender)

function handleRender(req, res) {
  // Query our mock API asynchronously
  fetchCounter(apiResult => {
    // Read the counter from the request, if provided
    const params = qs.parse(req.query)
    const counter = parseInt(params.counter, 10) || apiResult || 0

    // Compile an initial state
    const preloadedState = { counter }

    // Create a new Redux store instance
    const store = configureStore(preloadedState)

    // Render the component to a string
    const html = renderToString(
      <Provider store={store}>
        <App />
      </Provider>
    )

    // Grab the initial state from our Redux store
    const finalState = store.getState()

    // Send the rendered page back to the client
    res.send(renderFullPage(html, finalState))
  })
}

function renderFullPage(html, preloadedState) {
  return `
    <!doctype html>
    <html>
      <head>
        <title>Boilerplate for universal React applications.</title>
      </head>
      <body>
        <div id="root">${html}</div>
        <script>
          window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState)}
        </script>
        <script src="bundle.js"></script>
      </body>
    </html>
    `
}

server.use(express.static('static'));

server.listen(PORT, (error) => {
  if (error) {
    console.error(error)
  } else {
    console.info(`==> 🌎  Listening on port ${PORT}. Open up http://localhost:${PORT}/ in your browser.`)
  }
})
