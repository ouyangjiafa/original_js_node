// 消息弹框
class AlertMsg {
  constructor(msg, type = 'success', delay = 2000) {
    this.msg = msg
    this.type = type
    this.delay = delay
    this.msgBox = null
    this.render()
  }
  render() {
    const colorOpt = {
      'error': ['#f56c6c', '#f0f9eb'],
      'warning': ['#e6a23c', '#fdf6ec'],
      'info': ['#909399', '#f4f4f5'],
      'success': ['#67c23a', '#f0f9eb']
    }
    const msgBox = document.createElement('div')
    const colorItem = colorOpt[this.type]
    msgBox.setAttribute('class', 'message_box')
    msgBox.setAttribute('style', `color:${colorItem[0]}; background-color:${colorItem[1]}`)
    msgBox.innerText = this.msg
    this.msgBox = msgBox
    document.body.appendChild(msgBox)
    this.destroy()
    console.log('destr')
  }
  destroy() {
    setTimeout(() => {
      document.body.removeChild(this.msgBox)
    }, this.delay)
  }
}

// 图层蒙版
class Mask {
  constructor(opt = {fullscreen:true, modalClose:true, wrapNode: null}) {
    const { fullscreen, modalClose, wrapNode } = opt
    this.wrapNode = wrapNode
    this.mask = null
    this.modalClose = modalClose
    this.fullscreen = fullscreen
    this.renderMask()
  }
  renderMask() {
    const content = document.createElement('div')
    content.setAttribute('class', 'preview_content')
    this.mask = document.createElement('div')
    // const closeBtn = doucment.createElement('')
    this.mask.addEventListener('click', this.close.bind(this))
    this.mask.setAttribute('class', `preview_wrap ${this.fullscreen?'mask_fullscreen':''}`)
    this.mask.appendChild(content)
    // this.mask.innerHTML = '<div class="preview_content"></div>'
  }
  close(e) {
    if(e && this.modalClose) {
      ~e.srcElement.className.indexOf('preview_wrap') && document.body.removeChild(this.mask)
    } else if (this.wrapNode) {
      this.wrapNode && this.wrapNode.removeChild(this.mask)
    } else {
      console.log('this', this)
      document.body.removeChild(this.mask)
    }
  }
  render() {
    this.wrapNode ? this.wrapNode.appendChild(this.mask) : document.body.appendChild(this.mask)
  }
}

// 加载
class Loading extends Mask {
  constructor(opt = {}) {
    const { fullscreen = true, modalClose = true, wrapNode = null } = opt
    super({ fullscreen, modalClose, wrapNode })
    this.render()
  }
  render() {
    const div = document.createElement('div')
    div.setAttribute('class', 'loading_box')
    div.innerHTML = '<span class="blue"></span><span class="green"></span><span class="red"></span>'
    this.mask.innerHTML = ''
    this.mask.appendChild(div)
    super.render()
  }
  close() {
    super.close()
  }
}

// 图片预览
class RenderImgPreview extends Mask{
  constructor({ src }) {
    super()
    this.src = src
    // this.previewWrap = null
  }
  render() {
    this.mask.childNodes[0].innerHTML = `<img src='${this.src}'/>`
    super.render()
  }
}

// 信息预览
class RenderInfoPreview extends Mask {
  constructor({ id, name, age, src, node}) {
    super()
    this.id = id
    this.name = name
    this.age = age
    this.src = src
    this.node = node
  }
  render() {
    const { name, age, src, node, getNode } = this
    this.nameNode = getNode.call(node, '.name', 'input')
    this.ageNode = getNode.call(node, '.age', 'input')
    this.previewNode = getNode.call(node, '.image', '.preview')
    this.uploadNode = getNode.call(node, '.upload', 'input')
    const cancleNode = getNode.call(node, '.btn', '.reset')
    const confirmNode = getNode.call(node, '.btn', '.submit')
    this.nameNode.value = name
    this.ageNode.value = age
    _descData = {
      name,
      age,
      image: src
    }
    this.uploadNode.parentNode.style.display = 'none'
    this.previewNode.style.cssText = `background-image: url(${src}); display: inline-block`
    confirmNode.onclick = null
    cancleNode.onclick = null
    confirmNode.addEventListener('click', handlerSubmit.bind(this))
    cancleNode.addEventListener('click', (e) => this.cancel(e))
    this.mask.childNodes[0].appendChild(node)
    super.render()
  }
  getNode(className, nodeName) {
    return this.querySelector(className).querySelector(nodeName)
  }
  cancel(e) {
    super.close()
  }
}

// 搜索
class Searcher {
  constructor(wrapNode, type) {
    this.list = null
    this.loadObj = null
    this.wrapNode = wrapNode
    this.type = type
    this.render()
  }
  render() {
    const icon = document.createElement('icon')
    icon.setAttribute('class', `icon_${this.type} iconfont`)
    icon.addEventListener('click', (e) => this.clickIcon(e))
    this.iconNode = icon
    this.wrapNode.appendChild(icon)
  }
  renderInput() {
    if(this.inputNode) {
      this.inputNode.style.display = 'inline-block'
      this.cancelNode.style.display = 'inline-block'
      return
    }
    const input = document.createElement('input')
    const cancel = document.createElement('button')
    input.setAttribute('class', `input_${this.type}`)
    cancel.setAttribute('class', 'button_cancel')
    cancel.innerText = 'cancel'
    input.addEventListener('input', debounce(this.change.bind(this)))
    cancel.addEventListener('click', (e) => this.close(e))
    this.inputNode = input
    this.cancelNode = cancel
    this.wrapNode.appendChild(cancel)
    this.wrapNode.appendChild(input)
  }
  renderUl() {
    const { loadObj, wrapNode, ulNode } = this
    loadObj && loadObj.wrapNode && wrapNode && wrapNode.removeChild(loadObj.wrapNode)
    if(ulNode) {
      wrapNode.removeChild(ulNode)
    }
    const ul = document.createElement('ul')
    const lis = this.renderLis()
    ul.setAttribute('class', 'wrap list scroll_bar')
    ul.addEventListener('click', (e) => this.clickUl(e))
    if(lis.childNodes.length) {
      ul.appendChild(lis)
    } else {
      const empty = document.createElement('div')
      empty.setAttribute('class', 'empty_tip')
      empty.innerText = 'no searcher anything'
      ul.appendChild(empty)
    }
    this.ulNode = ul
    this.wrapNode.appendChild(ul)
  }
  renderLis() {
    const fragment = document.createDocumentFragment()
    this.list.map(item => {
      const { name, image, age } = item
      const li = document.createElement('li')
      const img = document.createElement('img')
      const span = document.createElement('span')
      li.setAttribute('class', 'item public_cursor')
      li.setAttribute('data-name', `${name}`)
      img.setAttribute('src', `data:image/png;base64,${image}`)
      span.innerText = name
      li.appendChild(img)
      li.appendChild(span)
      fragment.appendChild(li)
    })
    return fragment
  }
  renderLoad() {
    const div = document.createElement('div')
    div.setAttribute('class', 'wrap load')
    this.wrapNode.appendChild(div)
    this.loadObj = new Loading({ fullscreen:false, modalClose:false, wrapNode: div })
  }
  clickIcon(e) {
    this.iconNode.style.display = 'none'
    this.renderInput()
  }
  clickUl(e) {
    console.log(e.target.getAttribute('data-name'))
  }
  async change(e) {
    this.renderLoad()
    if(this.type === 'add') {
      const {code, msg, data} = await fetchRequest('api/wechat/search', {name: e.target.value})
      if(code === 0) {
        this.list = data.list
        this.renderUl()
      } else {
        new AlertMsg(msg)
      }
    } else {

    }
  }
  async request() {
    return fetchRequest('api/wechat/search', {name: this.target.value})
  }
  close() {
    const { inputNode, cancelNode, iconNode, ulNode } = this
    this.list = null
    inputNode && (inputNode.value = '')
    inputNode && (inputNode.style.display = 'none')
    cancelNode && (cancelNode.style.display = 'none')
    iconNode && (iconNode.style.display = 'inline-block')
    ulNode && (ulNode.style.display = 'none')
  }
}

// ajax
const fetchRequest = async function(url='', data = {}, type = 'GET') {
  let options = {
    credentials: 'include', // 自动发送cookie
    method: type,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    mode: 'cors', // 请求模式
    cache: 'force-cache'
  }
  if (type.toUpperCase() === 'GET') {
    let dataStr = `time=${Date.now()}&`
    Object.keys(data).map(key => {
      dataStr += `${key}=${data[key]}&`
    })
    if (dataStr !== '') {
      dataStr = dataStr.replace(/&$/, '')
      url = `http://localhost:3000/${url}?${dataStr}`
    }    
  } else if (type.toUpperCase() === 'POST') {
    try {
      Object.defineProperty(options, 'body', {
      value: JSON.stringify(data)
    })
    } catch (error) {
      console.log('page-err', error)
    }
  }
  try{
    const response = await fetch(url, options)
    const responseJson = await response.json()
    return responseJson
  }catch(error) {
    throw new Error(error)
  }
}

// 防抖
const debounce = function(fn, delay = 500) {
  let timer = null
  return function() {
    if(timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn.apply(this, arguments)
    }, delay)
  }
}

// 节流
const throttle = function(fn, delay) {}

const $ = document.querySelector.bind(document)
const $All = document.querySelectorAll.bind(document)