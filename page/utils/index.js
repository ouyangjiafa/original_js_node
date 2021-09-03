
// 消息弹框
class AlertMsg {
  constructor(msg, type = 'success', delay = 2000) {
    this.msg = msg
    this.type = type
    this.delay = delay
    this.msgBox = null
    this.$el = this
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
    return this.$el
  }
  destroy() {
    setTimeout(() => {
      document.body.removeChild(this.msgBox)
      this.$el = null
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

// 加载提示
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
    this.list = []
    this.loadObj = null
    this.value = ''
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
    this.closeLoad()
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
      if(INFO.name === name) return
      const li = document.createElement('li')
      const img = document.createElement('img')
      const span = document.createElement('span')
      // li.addEventListener('click', this.clickItem.bind(item))
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
    div.setAttribute('class', 'wrap load scroll_bar')
    this.wrapNode.appendChild(div)
    this.loadObj = new Loading({ fullscreen:false, modalClose:false, wrapNode: div })
  }
  clickIcon(e) {
    this.iconNode.style.display = 'none'
    this.renderInput()
  }
  // clickItem(e) {
  //   const { _id: id, name, age, image } = this
  //   const { code, msg, data } = await fetchRequest('api/auth/wechat/add', {id, name, aga, image}, 'POST')
  //   if(code === 0) {
  //     this.list.splice()
  //   }
  // }
  async clickUl(e) {
    console.log(e.target.getAttribute('data-name'))
    const itemName = e.target.getAttribute('data-name')
    let params = null, index = ''
    this.list.some((item, i) => {
      if (item.name === itemName) {
        params = item
        index = i
        return true
      }
    })
    if(!params) return
    this.loadObj || this.renderLoad()
    const { _id: id, name, age, image } = params
    try {
      const { code, msg } = await fetchRequest('api/auth/wechat/add', {id, name, age, image}, 'POST')
      if(code === 0) {
        new AlertMsg('添加好友成功')
        this.list.splice(index, 1)
        this.renderUl()
      } else {
        new AlertMsg(msg, 'error')
      } 
    } catch (error) {
      console.error('error', error)
    }
  }
  async change(e) {
    this.value = e.target.value
    this.loadObj || this.renderLoad()
    if(this.type === 'add') {
      try {
        const {code, msg, data} = await fetchRequest('api/auth/wechat/search', {name: this.value})
        if(code === 0) {
          this.list = data.list
          this.renderUl()
        } else {
          this.closeLoad()
          new AlertMsg(msg, 'error')
        }
      } catch (error) {
        console.error('error', error)
      }
    } else {

    }
  }
  closeLoad() {
    const { loadObj, wrapNode } = this
    if(loadObj) {
      loadObj.wrapNode && wrapNode && wrapNode.removeChild(loadObj.wrapNode)
      loadObj.close()
      this.loadObj = null
    }
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

// 好友列表
class friendList {
  constructor(wrapNode, list = []) {
    this.wrapNode = wrapNode
    this.list = list
  }
  renderul() {
    const ul = createNode('ul')
    const lis = this.renderli()
    if(lis.length) {
      ul.appendChild()
    } else {
      const emptyNode = createNode('div', { 'class': 'emtpy_tip' }, 'nothing friend info')
      ul.appendChild(emptyNode)
    }
  }
  renderli() {
    const { list } = this
    const fragment = document.createDocumentFragment()
    const names = ['li', 'img', 'span', 'span', 'span', 'div', 'div', 'div', ]
    const attrs = [{'class': 'item'}, {'class': 'avater'}, {'class': 'name'}, {'class': 'chat'}, {'class': 'date'}]
    list.map(item => {
      const { name, image, chat, date } = item
      const texts = ['', '', name, chat, date]
      attrs[1].src = image
      const [ li, img, spanName, spanChat, spanDate, divLeft, divCenter, divRight ] = createNode(names, attrs, texts)
      divLeft.appendChild(img)
      divLeft.appendChild(spanName)
      divCenter.appendChild(spanChat)
      divRight.appendChild(spanDate)
      li.appendChild(divLeft)
      li.appendChild(divCenter)
      li.appendChild(divRight)
      fragment.appendChild(li)
    })
    return fragment
  }
  render() {
    const content = this.renderul()
   this.wrapNode.appendChild(content)
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
  url.includes('/auth/') && (options.headers['Authorization'] = localStorage.getItem('_TOKEN'))
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
      console.error('page-err', error)
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
const createNode = function(names = 'div', attrs = {}, texts = '') {
  try {
    const node = null
    const nodeList = []
    if(Array.isArray(names) && Array.isArray(attrs) && Array.isArray(texts)) {
      names.map((name, index) => {
        node = document.createElement(name)
        node.innerText = texts[index] || ''
        const attr = attrs[index]
        if (attr) {
          for (const key in attr) {
            node.setAttribute(key, attr[key])
          }
        }
        nodeList.push(node)
      })
    } else if (typeof names === 'string' && typeof attrs === 'object' && typeof texts === 'string')  {
      node = document.createElement(names)
      node.innerText = texts
      for (const key in attrs) {
        node.setAttribute(key, attrs[key])
      }
      nodeList.push(node)
    } else {
      throw new Error('argument require to [Array, Array, Array] or [String, Object, String]')
    }
    return nodeList
  } catch (error) {
    throw new Error(error)
  }
}
const $ = document.querySelector.bind(document)
const $All = document.querySelectorAll.bind(document)
const INFO = JSON.parse(localStorage.getItem('_INFO'))