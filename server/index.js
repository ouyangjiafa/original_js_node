const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')
const ObjectId = require('mongodb').ObjectId
const { stringify } = require('./utils')
const { connectDB, connectCollection, insertOne, find, updateOne, deleteOne } = require('../DB')
  http.createServer( async (req, res) => {
    res.setHeader('content-type', 'text/html;charset=utf-8')
    let pathObj =  url.parse(req.url, true)
    let result = null
    let DB = null, COLLECTION = null
    const pathName = pathObj.pathname
    if (pathName === '/favicon.ico') {
      return
    }
    try {
      DB = await connectDB() 
    } catch (error) {
      console.log('error', error)
    }
    COLLECTION = connectCollection(DB)
    if (pathName === '/') {
      fs.readFile(path.resolve(__dirname, '../page/index.html'), 'utf-8', (err, data) => {
        res.writeHead(200, {'Content-Type': 'text/html'})
        if (err) return console.log('err', err)
        res.end(data)
      })
    }else if (~pathName.indexOf('/public')) {
      fs.readFile(path.resolve(__dirname, `../page${pathName}`), 'utf-8', (err, data) => {
        res.writeHead(200, {'Content-Type': 'text/css'})
        if (err) return
        res.end(data)
      })
    }else if (pathName === '/utils') {
      fs.readFile(path.resolve(__dirname, '../page/utils.js'), 'utf-8', (err, data) => {
        res.writeHead(200, { 'Content-Type': 'application/javascript' })
        if(err) return
        res.end(data) 
      })
    }else if (pathName === '/api/list') {
      try {
        result = await find(COLLECTION) 
      } catch (error) {
        console.log('error', error)
      }
      if (result.code) {
        res.end(stringify({code: result.code, msg: result.err.message}))
      } else {
        res.end(stringify({code: 0, msg: '', data: {list: result} }))
      }
    }else if (~['/api/add', '/api/update'].indexOf(pathName)) {
      let payload = ''
      req.on('data', (chunk) => {
        payload += chunk
      })
      req.on('end', async () => {
        payload = JSON.parse(decodeURI(payload.toString()))
        const { id, name, age, image } = payload
        const imgPath = path.resolve(__dirname, `../image/${name}_${age}.png`)
        const base64 = image.replace(/^data:image\/\w+;base64,/, '')
        const base64Buff = Buffer.from(base64, 'base64')
        const document = { name, age, image: base64 }
        if (DB.code) {
          res.end(stringify({code: DB.code, data: {}}))
        } else {
          try {
            const type = ~pathName.indexOf('add') ? 'add' : 'update'
            if(type === 'add'){
              result = await find(COLLECTION)
              if (checkName(result, name)) {
                res.end(stringify({code: 2, data: {}, msg: `${name}已存在`}))
                return
              }
              // res.end(stringify({code: 0, result}))
              result = await insertOne(COLLECTION, document)
              if (result.code) {
                res.end(stringify({code: result.code, msg: result.err.message, data: {}}))
                return
              }
            } else {
              result = await updateOne(COLLECTION, {_id: ObjectId(id)}, {$set: document})
              if(result.code) {
                res.end(stringify({ code: result.code, msg: reult.err.message, data: {} }))
                return
              }
            }
            fs.writeFile(imgPath, base64Buff, err => {
              if (err) {
                res.end(err.toString())
                return
              }
              console.log('ok!')
              if (type === 'add') {
                const list = result.ops ? result.ops : []
                res.end(stringify({code: 0, msg: '', data: {list}}))
              } else {
                res.end(stringify({code: 0, msg: '', data: {}}))
              }
            })
          } catch (error) {
            console.log('addError:', error)
          }
        }
      })
    }else if(pathName === '/api/delete') {
      let payload = ''
      req.on('data', (chunk) => {
        payload += chunk
      })
      req.on('end', async () => {
        payload = JSON.parse(decodeURI(payload.toString()))
        try {
          result = await deleteOne(COLLECTION, payload)
          if (result.code) {
            res.end(stringify({ code: result.code, msg: `${result.err.message}`, data: {} }))
          } else {
            res.end(stringify({ code: 0, msg: 'delete success', data: {} }))
          }
        } catch (error) {
          console.log('error', error)
        }
      })
    }
  }).listen(3000)

function checkName(result, name) {
  return result.some(item => {
    return item.name === name
  })
}