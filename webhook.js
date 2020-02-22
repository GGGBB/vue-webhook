let http = require('http')
let crypto = require('crypto')
let {spawn} = require('child_process')
let SECRET = '123456'
let sendMail = require('./sendMail')
/**
* 扩展Date的Format函数
* 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
* 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
* @param {[type]} fmt [description]
*/
Date.prototype.Format = function(fmt) { //author: meizz 
   var o = {
       "M+": this.getMonth() + 1, //月份 
       "d+": this.getDate(), //日 
       "h+": this.getHours(), //小时 
       "m+": this.getMinutes(), //分 
       "s+": this.getSeconds(), //秒 
       "S": this.getMilliseconds() //毫秒 
   };
   if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
   for (var k in o)
       if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
   return fmt;
}

function sign(body){
  return 'sha1='+ crypto.createHmac('sha1', SECRET).update(body).digest('hex')
}
let server = http.createServer(function(req, res){
  console.log(req.method, req.url)
  if(req.method == 'POST' && req.url == '/webhook'){
    let buffers = []
    req.on('data', function(buffer){
      buffers.push(buffer)
    })
    req.on('end', function(buffer){
      let body = Buffer.concat(buffers)
      let event = req.headers['x-github-event']
      let signature = req.headers['x-hub-signature']
      if (signature !== sign(body)){
        return res.end('Not Allowed')
      }
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ok: true}))

      if(event == 'push'){
        let payload = JSON.parse(body)
        let child = spawn('sh', [`./${payload.repository.name}.sh`])
        let logs = []
        child.stdout.on('data', function(data){
          let log = (new Date()).Format("yyyy-MM-dd hh:mm:ss") + '--stdout---y--y--y--->' + data
          logs.push(log)
          console.log(log)
        })
        child.stderr.on('data', function(data){
          let log = (new Date()).Format("yyyy-MM-dd hh:mm:ss") + '--stderr---x--x--x--->' + data
          logs.push(log)
          console.log(log)
        })
        child.on('exit', function(data){
          let log = ((new Date()).Format("yyyy-MM-dd hh:mm:ss") + '--child process exited with code---------->' + data)
          logs.push(log)
          console.log(log)
          sendMail(`
            <h1>部署日期: ${(new Date()).Format("yyyy-MM-dd hh:mm:ss")}</h1>
            <h2>部署人: ${payload.pusher.name}</h2>
            <h2>部署邮箱: ${payload.pusher.email}</h2>
            <h2>提交信息: ${payload.head_commit&&payload.head_commit['message']}</h2>
            <h2>布署日志: ${logs.toString().replace(/,/g , '<br/>')}</h2>
          `)
        })
      }
    })
    
  }else{
    res.end('Not Found')
  }
})

server.listen(4000, () => {
  console.log('webhook服务已经在4000端口上启动')
})