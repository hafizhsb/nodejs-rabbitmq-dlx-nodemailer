
const nodemailer = require("nodemailer")
const ejs = require('ejs')
const dotenv = require('dotenv')
dotenv.config()

class EmailService {
  getTransporter() {
    return new Promise(async resolve => {
      resolve(nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        secureConnection: false, // TLS requires secureConnection to be false
        port: process.env.SMTP_PORT, // port for secure SMTP
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      }));
    });
  }

  async send(to, subject, content) {
    try {
      // const renderedContent = await this.renderTemplate(content) 
      const mailData = {
        from: '"Hafiz" <hafiz@microblog.dev>',
        to,
        subject,
        html: content
      }
      const transporter = await this.getTransporter()
      const info = await transporter.sendMail(mailData)
      return info.messageId
    } catch (err) {
      console.log(err)
      return false
    }
  }

  renderTemplate(content) {
    return new Promise((resolve) => {
      ejs.renderFile(
        './template/general.ejs',
        { content }, {},
        (err, html) => {
          resolve(html)
        }
      )
    })
  }

}

module.exports = EmailService