const stringify = function(obj) {
  return JSON.stringify(obj)
}
const checkName = function (result, name) {
  return result.some(item => {
    return item.name === name
  })
}
module.exports = {
  stringify,
  checkName
}