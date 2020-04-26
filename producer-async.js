const amqp = require('amqplib')
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

function openConnection() {
  return amqp.connect()
}

function createChannel(conn) {
  return conn.createChannel()
}

function assertExchanges(channel) {
  return Promise.all(
    [
      channel.assertExchange(EMAIL_EXCHANGE_TTL, 'direct', {durable: true}),
      channel.assertExchange(EMAIL_EXCHANGE_DLX, 'fanout', {durable: true})
    ]
  )
}

function assertQueues(channel) {
  return Promise.all(
    [
      channel.assertQueue(EMAIL_QUEUE, {
        durable: true
      }),
      channel.assertQueue(EMAIL_QUEUE_RETRY_1, {
        durable: true, 
        deadLetterExchange: EMAIL_EXCHANGE_DLX,
        messageTtl: 10000
      }),
      channel.assertQueue(EMAIL_QUEUE_RETRY_2, {
        durable: true,
        deadLetterExchange: EMAIL_EXCHANGE_DLX,
        messageTtl: parseInt(process.env.TTL_RETRY_2)
      }),
      channel.assertQueue(EMAIL_QUEUE_RETRY_3, {
        durable: true,
        deadLetterExchange: EMAIL_EXCHANGE_DLX,
        messageTtl: parseInt(process.env.TTL_RETRY_3)
      })
    ]
  )
}

function bindExchangesToQueues(channel) {
  return Promise.all(
    [
      channel.bindQueue(EMAIL_QUEUE, EMAIL_EXCHANGE_DLX),
      channel.bindQueue(EMAIL_QUEUE_RETRY_1, EMAIL_EXCHANGE_TTL, 'retry-1'),
      channel.bindQueue(EMAIL_QUEUE_RETRY_2, EMAIL_EXCHANGE_TTL, 'retry-2'),
      channel.bindQueue(EMAIL_QUEUE_RETRY_3, EMAIL_EXCHANGE_TTL, 'retry-3')
    ]
  )
}

async function init(channel) {
  try {
    const assertExchange = await assertExchanges(channel)
    const assertQueue = await assertQueues(channel)
    const bindExchangeToQueue = await bindExchangesToQueues(channel)
  } catch(err) {
    console.log(err)
    process.exit(1)
  }
}

// Main Program
async function main() {
  try {
    const conn = await openConnection()
    const channel = await createChannel(conn)
    
    init(channel)

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
  } catch(err) {
    console.log(err)
  }
  
}

main()