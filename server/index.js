const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')
const ObjectId = require('mongodb').ObjectId
const { stringify, checkName } = require('./utils')
const websocket = require('./websocket')
const { requestNews } = require('../request')
const {
  connectDB,
  connectCollection,
  insertOne,
  find,
  updateOne,
  deleteOne,
  getCollections
} = require('../DB')
const { JWT } = require('./token')
  http.createServer( async (req, res) => {
    res.setHeader('content-type', 'text/html;charset=utf-8')
    let pathObj =  url.parse(req.url, true)
    let NAME = '', payload = '', result = null, DB = null, COLLECTION = null
    const {pathname, query} = pathObj
    // console.log('p', pathname, query)
    // auth 接口校验 
    if(pathname.includes('/auth/')) {
      const verifyResult = new JWT(req.headers.authorization).verifyToken()
      if(verifyResult.code) {
        return res.end(stringify( verifyResult ))
      }
      NAME = verifyResult.data
    }
    if (pathname === '/favicon.ico') {
      res.end('')
    }
    try {
      DB = await connectDB() 
    } catch (error) {
      console.error('error', error)
    }
    COLLECTION = connectCollection(DB)
    if (pathname === '/') {
      fs.readFile(path.resolve(__dirname, '../page/index.html'), 'utf-8', (err, data) => {
        if(err) {
          console.error('err,', err)
          res.end()
        } else {
          res.writeHead(200, {'Content-Type': 'text/html'})
          res.end(data)
        }
      })
    }else if (~pathname.indexOf('/style')) {
      fs.readFile(path.resolve(__dirname, `../page${pathname}`), 'utf-8', (err, data) => {
        if(err) {
          console.error('err,', err)
          res.end()
        } else {
          res.writeHead(200, {'Content-Type': `text/css`})
          res.end(data)
        }
      })
    }else if (~pathname.indexOf('/utils')) {
      fs.readFile(path.resolve(__dirname, `../page${pathname}.js`), 'utf-8', (err, data) => {
        if(err) {
          console.error('err,', err)
          res.end()
        } else {
          res.writeHead(200, { 'Content-Type': 'application/javascript' })
          res.end(data)
        } 
      })
    } else if (~pathname.indexOf('/static/image')) {
      fs.readFile(path.resolve(__dirname, `../page${pathname}`), 'binary', (err, data) => {
        if(err) {
          console.error('err', err)
          res.end()
        } else {
          res.writeHead(200, { 'Content-Type': 'image/png' })
          res.write(data, 'binary')
          res.end()
        }
      })
    } else if (~pathname.indexOf('/api/login')) {
      payload = ''
      req.on('data', chuck => {
        payload += chuck
      })
      req.on('end', async () => {
        payload = JSON.parse(decodeURI(payload.toString()))
        const { account } = payload
        try {
          result = await find(COLLECTION, { name: account })
          if(result.code) {
            return res.end({ code: result.code, msg: result.err.message, data: {} })
          }
          if(!result.length) {
            return res.end(stringify({code: 2, msg: '账号密码错误', data: {}}))
          }
          let friendList = []
          const collectons = await getCollections(DB, 'wechat')
          const collect = await connectCollection(DB, 'wechat', account)
          if(!checkName(collectons, account)) {
            const { _id: id, name, age, image } = result[0]
            insertOne(collect, { id, name, age, image, friendList, chatCollectionName: '', })
          } else {
            const findRes = await find(collect, { name: account })
            if(findRes.code) {
              return res.end(stringify({code: 1, msg: findRes.error.message, data: {}}))
            }
            friendList = findRes[0].friendList || []
          }
          const token = new JWT(account).generateToken()
          res.end(stringify({ code: 0, msg: '', data: { info: {name: account, friendList}, token } }))
        } catch (error) {
          console.error('error', error)
        }
      })
    }else if (pathname === '/api/list') {
      try {
        result = await find(COLLECTION) 
      } catch (error) {
        console.error('error', error)
      }
      if (result.code) {
        res.end(stringify({code: result.code, msg: result.err.message}))
      } else {
        res.end(stringify({code: 0, msg: '', data: {list: result} }))
      }
    }else if (~['/api/add', '/api/update'].indexOf(pathname)) {
      payload = ''
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
                res.end(stringify({ code: result.code, msg: result.err.message, data: {} }))
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
            console.error('addError:', error)
          }
        }
      })
    }else if(pathname === '/api/delete') {
      payload = ''
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
          console.error('error', error)
        }
      })
    }else if(pathname === '/api/news') {
      result = await requestNews('https://news.baidu.com/')
      res.end(stringify(result))
    }else if(pathname === '/api/auth/wechat/search') {
      try {
        const { name } = query
        const reg = new RegExp(name)
        const whereStr = {name: { $regex: reg }}
        result = await find(COLLECTION, whereStr)
        if(result.code) {
          return res.end(stringify({ code: result.code, msg: result.err.message, data: {} }))
        }
        const collect = connectCollection(DB, 'wechat', NAME)
        const findRes = await find(collect, { name: NAME })
        if(findRes.code === 0) {
          return res.end(stringify({ code: findRes.code, msg: findRes.err.message, data: {} }))
        }
        const { friendList = [] } = findRes[0]
        const nameList = friendList.map( item => item.name )
        result = result.filter(item => nameList.indexOf(item.name))
        res.end(stringify({ code: 0, msg: '', data: { list: result } }))
      } catch(error) {
        console.error('error', error)
      }
    }else if(pathname === '/api/auth/wechat/add') {
      payload = ''
      req.on('data', chuck => {
        payload += chuck
      })
      req.on('end', async () => {
        payload = JSON.parse(decodeURI(payload.toString()))
        const { id, name, age, image } = payload
        const collect = connectCollection(DB, 'wechat', NAME)
        try {
          const findRes = await find(collect, { name: NAME })
          if(findRes.code) {
            return res.end(stringify({ code: findRes.code, msg: findRes.error.message, data: {} }))
          }
          let { friendList = [] } = findRes[0]
          friendList = [...friendList, {id, name, age, image}]
          result = await updateOne(collect, { name: NAME }, { $set: { friendList } })
          if(result.code) {
           return res.end(stringify({ code: result.code, msg: result.error.message, data: {} }))
          }
          res.end(stringify({code: 0, msg: '', data: {}}))
        } catch (error) {
          console.error('error', error)
        }
      })
    }
  }).listen(3000)