module.exports = {

  instantiateSQS: () => {
    var AWS = require('aws-sdk');
    AWS.config.update({
      // apiVersion: "2010-12-01",
      accessKeyId: process.env.AWS_KEY,
      accessSecretKey: process.env.AWS_SKEY,
      region: "ap-southeast-1",
    });

    return new AWS.SQS({
      apiVersion: '2012-11-05'
    });
  },

  popMessage: async (howMany) => {
    howMany = howMany || 1
    let data = []
    try {
      data = await module.exports.instantiateSQS().receiveMessage({
        AttributeNames: ['SentTimestamp'],
        MaxNumberOfMessages: howMany,
        MessageAttributeNames: ['All'],
        QueueUrl: process.env.SQS_URL,
        VisibilityTimeout: 0,
        WaitTimeSeconds: 0
      }).promise()
    } catch (error) {
      console.log(error)
    }
    return data.Messages || []
  },

  deleteMessages: async (messages) => {
    messages = messages || []
    messages.forEach(async message => {
      try {
        await module.exports.instantiateSQS().deleteMessage({
          QueueUrl: process.env.SQS_URL,
          ReceiptHandle: message.ReceiptHandle
        }).promise()
      } catch (error) {
        console.log(error)
      }
    });
    return true
  },

  pushMessage: async (message) => {
    try {
      await module.exports.instantiateSQS().sendMessage({
        MessageBody: message,
        QueueUrl: process.env.SQS_URL,
      }).promise()
    } catch (error) {
      console.log(error)
    }
    return {
      pushed: true,
      pushed_at: Date.now()
    }
  },

  getAllMessages: async () => {
    let data = []
    try {
      data = await module.exports.instantiateSQS().receiveMessage({
        AttributeNames: ['SentTimestamp'],
        MaxNumberOfMessages: 10,
        MessageAttributeNames: ['All'],
        QueueUrl: process.env.SQS_URL,
        VisibilityTimeout: 0,
        WaitTimeSeconds: 0
      }).promise()
    } catch (error) {
      console.log(error)
    }

    let messages = data.Messages || []
    if (!messages.length) {
      return messages
    }
    return module.exports.arrayUnique(messages.map(m => m.MessageId)).map(im => messages.find(m => m.MessageId == im))
  },

  arrayUnique: (a) => {
    return a.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  },
}