const { stringify } = require('../utils')
const { connectDB, connectCollection, insertOne, find, updateOne, deleteOne } = require('../../DB')
const getList = async function (req, res) {
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
}
const addUpdate = function(req, res) {
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
}
module.exports = {
  getList,
  addUpdate
}