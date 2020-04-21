const amqp = require('amqplib/callback_api')
const dotenv = require('dotenv')
dotenv.config()

const {
  EMAIL_EXCHANGE_TTL, 
  EMAIL_EXCHANGE_DLX, 
  EMAIL_QUEUE, 
  EMAIL_QUEUE_RETRY_1,
  EMAIL_QUEUE_RETRY_2,
  EMAIL_QUEUE_RETRY_3
} = require('./constants')

// connect to RabbitMQ server
amqp.connect('amqp://localhost', (error0, connection) => {
  if (error0) {
    throw error0
  }

  // create channel
  connection.createChannel((error1, channel) => {
    if (error1) {
      throw error1
    }

    // create exchange (https://www.rabbitmq.com/tutorials/amqp-concepts.html)
    assertExchanges(channel)

    // create queue
    assertQueues(channel)

    // Bind exchange to queue
    bindExchangesToQueues(channel)

    // send message
    const data = {
      to: 'hafiztrizer@gmail.com',
      subject:'Hello World',
      message: 'Lorem ipsum sit dolor amet',
      tryAttempt: 0
    }
    
    for (let i = 1; i <= 1; i++) {
      channel.sendToQueue(EMAIL_QUEUE, Buffer.from(JSON.stringify(data)))
      console.log(`message ${i}`)
    }
    
  })
})


function assertExchanges(channel) {
  channel.assertExchange(EMAIL_EXCHANGE_TTL, 'direct', {durable: true})
  channel.assertExchange(EMAIL_EXCHANGE_DLX, 'fanout', {durable: true})
}

function assertQueues(channel) {
  // email queue
  channel.assertQueue(EMAIL_QUEUE, {
    durable: true
  })

  // retry after 1 minute (60000ms)
  channel.assertQueue(EMAIL_QUEUE_RETRY_1, {
    durable: true,
    deadLetterExchange: EMAIL_EXCHANGE_DLX,
    messageTtl: parseInt(process.env.TTL_RETRY_1)
  })

  // retry after 1 hour (3600000)
  channel.assertQueue(EMAIL_QUEUE_RETRY_2, {
    durable: true,
    deadLetterExchange: EMAIL_EXCHANGE_DLX,
    messageTtl: parseInt(process.env.TTL_RETRY_2)
  })

  // retry after 24 hours
  channel.assertQueue(EMAIL_QUEUE_RETRY_3, {
    durable: true,
    deadLetterExchange: EMAIL_EXCHANGE_DLX,
    messageTtl: parseInt(process.env.TTL_RETRY_3)
  })
}

function bindExchangesToQueues(channel) {
  channel.bindQueue(EMAIL_QUEUE, EMAIL_EXCHANGE_DLX)
  channel.bindQueue(EMAIL_QUEUE_RETRY_1, EMAIL_EXCHANGE_TTL, 'retry-1')
  channel.bindQueue(EMAIL_QUEUE_RETRY_2, EMAIL_EXCHANGE_TTL, 'retry-2')
  channel.bindQueue(EMAIL_QUEUE_RETRY_3, EMAIL_EXCHANGE_TTL, 'retry-3')
}