let DB
const MongodbClient = require('mongodb').MongoClient
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
const connectCollection = function (db, dbName = 'desc', collectionName = 'desc') {
  return db.db(dbName).collection(collectionName)
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
const dom = function() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        a: {b: 1}
      })
    }, 500)
  })
}
module.exports = {
  connectDB,
  connectCollection,
  insertOne,
  find,
  updateOne,
  deleteOne
}
