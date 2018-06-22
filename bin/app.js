const express = require('express')
const app = express()

function App(config) {
  this.handler = null
  app.set('view engine', 'ejs')

  app.use(express.static(`${__dirname}/../public`))
  app.get('/*', (req, res) => {
    res.render('index', {config : config})
  })

  app.use((error, req, res, next) => {
    res.status(500).render('error', {error})
  })
}

App.prototype.start = function (port) {
  return new Promise((resolve) => {
    this.handler = app.listen(port, () => {
      resolve()
    })
  })
}

App.prototype.close = function() {
  if(this.handler) {
    this.handler.close()
    this.handler = null
  } else {
    console.error('App handler does\'nt handle anything : can\'t stop')
  }
}

module.exports = App