
const { GenerateSecretKey } = require('./utils')
const jwt = require('jsonwebtoken')
const { readFileSync } = require('fs')
const { resolve } = require('path')
// const { publicKey, privateKey } = new GenerateSecretKey().generateKey()
const { publicKey, privateKey } = new GenerateSecretKey().generateKey()
/**
 * algorithms使用指南 https://blog.csdn.net/qq_34441176/article/details/81454467
*/
class JWT {
  constructor(data) {
    this.data = data
  }
  generateToken() {
    const exp = Math.floor(Date.now()/1000) + (60 * 60 * 2)
    const token = jwt.sign({ exp, data: this.data}, privateKey, { algorithm: 'HS256'})
    return token
  }
  verifyToken() {
    let res
    try {
      res = jwt.verify(this.data, privateKey, { algorithms: ['HS256'] })
      const { exp = 0 } = res
      if(exp <= Math.floor(Date.now()/1000)) {
        res = {code: 401, msg: 'jwt expire', data: {}}
      }
    } catch (error) {
      // console.error('err', error)
      res = {code: 401, msg: error.message, data: {}}
    }
    return res
  }
}
module.exports = {
  JWT
}