let DB
const MongodbClient = require('mongodb').MongoClient
// 创建数据库
const connectDB = function() {
  return new Promise((resolve, reject) => {
    MongodbClient.connect('mongodb://127.0.0.1:27017/', {useUnifiedTopology: true}, (err, db) => {
      if (err) return reject({code: 1, err})
      DB = db
      resolve(db)
    })
  })
}
const CLOSEDB = function() {
  DB.close()
}
// 连接集合   与MySQL不同的是MongoDB会自动创建数据库和集合,所以使用前我们不需要手动去创建并且创建的集合需要插入文档才会存在
const connectCollection = function (db, dbName = 'desc', collectionName = 'desc') {
  return db.db(dbName).collection(collectionName)
}
const getCollections = function (db, dbName = 'desc') {
  return new Promise((resolve, reject) => {
    db.db(dbName).listCollections().toArray((err, list) => {
      if(err) {
        reject({ code: 1, msg: err.message })
      } else {
        console.log('list', list)
        resolve(list)
      }
    })
  })
} 
const insertOne = function (collection, document) {
  return new Promise((resolve, reject) => {
    collection.insertOne(document, (err, result) => {
      if (err) {
        reject({code: 1, err})
      } else {
        resolve(result)
      }
      // CLOSEDB()
    })
  })
}
const find = function (collection, whereStr = {}) {
  return new Promise((resolve, reject) => {
    collection.find(whereStr).toArray((err, result) => {
      // console.log('whereStr', whereStr, err, '\n', result)
      if (err) {
        reject({code: 1, err})
      } else {
        resolve(result)
      }
      // CLOSEDB()
    })
  })
}
const updateOne = function (collection, whereStr, updateStr) {
  return new Promise((resolve, reject) => {
    // console.log(whereStr, updateStr)
    collection.updateOne(whereStr, updateStr, (err, result) => {
      if (err) {
        reject({code: 1, err})
      } else {
        resolve(result)
      }
    })
  })
}
const deleteOne = function (collection, whereStr = {}) {
  return new Promise((resolve, reject) => {
    collection.deleteOne(whereStr, (err, result) => {
      if(err) {
        reject({code: 1, err})
      } else {
       resolve(result)
      }
      // CLOSEDB()
    })
  })
}
module.exports = {
  connectDB,
  connectCollection,
  insertOne,
  find,
  updateOne,
  deleteOne,
  getCollections
}
