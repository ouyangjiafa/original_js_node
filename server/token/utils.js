// const { createHmac } = require('crytop')
// const hash = createHmac('sha256', 'a secret key')
// .update('some data to hash')
// .digest('hex')
const { resolve } = require('path')
const { accessSync, constants, mkdirSync, rmdirSync, readFileSync, writeFileSync } = require('fs')
const { generateKeyPairSync } = require('crypto')
class GenerateSecretKey {
  constructor(type = 'rsa', options = {}) {
    const opt = {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: 'abc'
      }
    }
    this.type = type
    this.options = Object.assign(opt, options)
  }
  generateKey() {
    // return generateKeyPairSync(this.type,this.options);
    try {
      accessSync(resolve(__dirname, 'pem'), constants.R_OK | constants.W_OK)
      accessSync(resolve(__dirname, 'pem', 'publicKey.pem'), constants.R_OK | constants.W_OK)
      accessSync(resolve(__dirname, 'pem', 'privateKey.pem'), constants.R_OK | constants.W_OK)
      const publicKey = readFileSync(resolve(__dirname, 'pem', 'publicKey.pem'))
      const privateKey = readFileSync(resolve(__dirname, 'pem', 'privateKey.pem'))
      return { publicKey, privateKey }
    } catch (error) {
      const { publicKey, privateKey } = generateKeyPairSync(this.type, this.options)
      try {
        accessSync(resolve(__dirname, 'pem'), constants.R_OK | constants.W_OK)
      } catch (error) {
        mkdirSync(resolve(__dirname, 'pem')) 
      }
      writeFileSync(resolve(__dirname, 'pem', 'publicKey.pem'), publicKey)
      writeFileSync(resolve(__dirname, 'pem', 'privateKey.pem'), privateKey)
      return { publicKey, privateKey }
    }
  }
}
module.exports = {
  GenerateSecretKey
}