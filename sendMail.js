const nodemailer = require('nodemailer')
let transporter = nodemailer.createTransport({
  service: 'qq',
  port: 465,
  secureConnection:true,
  auth: {
    user: 'wangzifeng2008@qq.com',
    pass: 'w920z307f016'
  }
})

function sendMail(message) {
  let mailOptions = {
    from: '"wangzifeng2008" <wangzifeng2008@qq.com>',
    to: 'wangzifeng2008@qq.com',
    subject: '部署通知',
    html: message
  }
  transporter.sendMail(mailoptions, (error, info) => {
    if (error) {
      return console.log(error)
    }
    console.log('message sent: %s', info.messageId)
  })
}
module.exports = sendMail