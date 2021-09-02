const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')
const ObjectId = require('mongodb').ObjectId
const { stringify } = require('./utils')
const websocket = require('./websocket')
const { requestNews } = require('../request')
const { connectDB, connectCollection, insertOne, find, updateOne, deleteOne } = require('../DB')
const { JWT } = require('./token')
  http.createServer( async (req, res) => {
    res.setHeader('content-type', 'text/html;charset=utf-8')
    let pathObj =  url.parse(req.url, true)
    let result = null
    let DB = null, COLLECTION = null
    const {pathname, query} = pathObj
    // console.log('p', pathObj)
    if (pathname === '/favicon.ico') {
      return
    }
    try {
      DB = await connectDB() 
    } catch (error) {
      console.log('error', error)
    }
    COLLECTION = connectCollection(DB)
    if (pathname === '/') {
      fs.readFile(path.resolve(__dirname, '../page/index.html'), 'utf-8', (err, data) => {
        if(err) {
          console.log('err,', err)
          res.end()
        } else {
          res.writeHead(200, {'Content-Type': 'text/html'})
          res.end(data)
        }
      })
    }else if (~pathname.indexOf('/style')) {
      fs.readFile(path.resolve(__dirname, `../page${pathname}`), 'utf-8', (err, data) => {
        if(err) {
          console.log('err,', err)
          res.end()
        } else {
          res.writeHead(200, {'Content-Type': `text/css`})
          res.end(data)
        }
      })
    }else if (~pathname.indexOf('/utils')) {
      fs.readFile(path.resolve(__dirname, `../page${pathname}.js`), 'utf-8', (err, data) => {
        if(err) {
          console.log('err,', err)
          res.end()
        } else {
          res.writeHead(200, { 'Content-Type': 'application/javascript' })
          res.end(data)
        } 
      })
    } else if (~pathname.indexOf('/static/image')) {
      console.log(path.resolve(__dirname, `../page${pathname}`))
      fs.readFile(path.resolve(__dirname, `../page${pathname}`), 'binary', (err, data) => {
        if(err) {
          console.log('err', err)
          res.end()
        } else {
          res.writeHead(200, { 'Content-Type': 'image/png' })
          res.write(data, 'binary')
          res.end()
        }
      })
    } else if (~pathname.indexOf('/api/login')) {
      let payload = ''
      req.on('data', chuck => {
        payload += chuck
      })
      req.on('end', async () => {
        payload = JSON.parse(decodeURI(payload.toString()))
        const { account: name } = payload
        try {
          result = await find(COLLECTION, { name })
          if(result.code) {
            res.end({ code: result.code, msg: result.err.message, data: {} })
          } else {
            console.log('result', result.length)
            if(!result.length) {
              res.end(stringify({code: 2, msg: '账号密码错误', data: {}}))
            }else {
              const token = new JWT(name).generateToken()
              console.log(new JWT(token).verifyToken())
              res.end(stringify({ code: 0, msg: '', data: { token } }))
            }
          }
        } catch (error) {
          console.log('error2', error)
        }
      })
    }else if (pathname === '/api/list') {
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
    }else if (~['/api/add', '/api/update'].indexOf(pathname)) {
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
            const type = ~pathname.indexOf('add') ? 'add' : 'update'
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
    }else if(pathname === '/api/delete') {
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
    }else if(pathname === '/api/news') {
      result = await requestNews('https://news.baidu.com/')
      res.end(stringify(result))
    }else if(pathname === '/api/wechat/search') {
      try {
        const { name } = query
        const reg = new RegExp(name)
        const whereStr = {name: { $regex: reg }}
        result = await find(COLLECTION, whereStr)
        console.log('www-', whereStr)
      } catch(error) {
        console.log('error', error)
      }
      if(result.code) {
        res.end(stringify({ code: result.code, msg: result.err.message, data: {} }))
      } else {
        res.end(stringify({ code: 0, msg: '', data: { list: result } }))
      }
    }
  }).listen(3000)

function checkName(result, name) {
  return result.some(item => {
    return item.name === name
  })
}