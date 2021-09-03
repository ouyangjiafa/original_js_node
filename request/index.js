const request = require('https').request
const { URL } = require('url')
const cheerio = require('cheerio')
const requestNews = function(url) {
  return new Promise((resolve, reject) => {
    let options = new URL(url)
    // console.log('url--', options)
    let payload = ''
    const req = request(options, res => {
      res.on('data', chunk => {
        payload += chunk
      })
      res.on('end', () => {
        const $ = cheerio.load(payload)
        payload = payload.toString()
        resolve({ code: 0, msg: 'success', data: { source: $(payload) } })
      })
    })
    req.on('error', err => {
      console.error('err', err)
      reject({ code: 1, msg:`${err.message}`, data: { err } })
    })
    req.end()
  })
}

module.exports = {
  requestNews
}