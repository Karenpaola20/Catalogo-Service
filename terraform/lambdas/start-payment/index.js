const AWS = require("aws-sdk");

const dynamo = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

exports.handler = async (event) => {
  try {
    for (const record of event.Records) {
      const body = JSON.parse(record.body);

      const {
        userId,
        cardId,
        service,
        traceId,
        timestamp
      } = body;

      await new Promise(resolve => setTimeout(resolve, 5000));

      await dynamo.put({
        TableName: "payment-table",
        Item: {
          traceId,
          userId,
          cardId,
          service,
          status: "IN_PROGRESS",
          timestamp
        }
      }).promise();

      await sqs.sendMessage({
        QueueUrl: process.env.CHECK_BALANCE_QUEUE_URL,
        MessageBody: JSON.stringify({
          traceId
        })
      }).promise();
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Start payment processed" })
    };

  } catch (error) {
    console.error("Error in start-payment:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error processing start-payment",
        details: error.message
      })
    };
  }
};