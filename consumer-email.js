const amqp = require('amqplib/callback_api')
const {
  EMAIL_QUEUE,
  EMAIL_EXCHANGE_TTL
} = require('./constants')
const EmailService = require('./mail-service')
const emailService = new EmailService()

amqp.connect('amqp://localhost', (error0, connection) => {
  if (error0) {
    throw error0;
  }

  connection.createChannel((error1, channel) => {
    if (error1) {
      throw error1;
    }

    channel.consume(EMAIL_QUEUE, async (msg) => {
      channel.ack(msg)
      const data = JSON.parse(msg.content.toString())
      const {to, subject, message} = data

      const sendEmail = await emailService.send(to, subject, message)
      if (sendEmail) {
        console.log(sendEmail)
      } else {
        const {attempt, content} = getAttemptAndUpdateContent(msg)
        if (attempt <= 3) {
          console.log(`publish to retry-${attempt}`)
          channel.publish(EMAIL_EXCHANGE_TTL, `retry-${attempt}`, Buffer.from(content));
        }
      }
    })

  })
})

function getAttemptAndUpdateContent(msg) {
  const data = JSON.parse(msg.content.toString())
  data.tryAttempt = ++data.tryAttempt
  const attempt = data.tryAttempt
  const content = Buffer.from(JSON.stringify(data))
  return {attempt, content}
}