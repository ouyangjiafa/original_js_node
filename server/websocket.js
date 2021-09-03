const net = require('net')
const crypto = require('crypto')
const websocket = net.createServer((socket) => {
  socket.once('data', (buffer) => {
    const headers = {}
    let buffArr = buffer.toString().split('\r\n')
    buffArr.shift()
    buffArr.map(item => {
      if (item) {
        const [key, value] = item.split(':')
        headers[key] = value.trim()
      }
    })
    if (headers['Upgrade'] !== 'websocket') {
      console.warn('no websocket connection')
      socket.end()
    } else if(headers['Sec-WebSocket-Version'] !== '13') {
      console.warn('webaocket version in not 13')
      socket.end()
    } else {
      const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
      const key = headers['Sec-WebSocket-Key']
      const hash = crypto.createHash('sha1')
      hash.update(`${key}${GUID}`)
      const base64 = hash.digest('base64')
      const header = `HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-Websocket-Accept: ${base64}\r\n\r\n`
      socket.write(header)
    }
  })
  socket.on('end', () => {
    console.log('end')
  })
})
websocket.listen('3001', (a, b, c) => {
  console.log('abc')
})
websocket.on('error', err => {
  console.error('err-', err)
})
module.exports = {
  websocket
}