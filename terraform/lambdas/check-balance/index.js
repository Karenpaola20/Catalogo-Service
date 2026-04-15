const AWS = require("aws-sdk");

const dynamo = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

exports.handler = async (event) => {
  try {
    for (const record of event.Records) {
      const body = JSON.parse(record.body);
      const { traceId } = body;

      await new Promise(resolve => setTimeout(resolve, 5000));

      const result = await dynamo.get({
        TableName: "payment-table",
        Key: { traceId }
      }).promise();

      const payment = result.Item;

      if (!payment) {
        console.error("Payment not found:", traceId);
        continue;
      }

      const hasBalance = Math.random() > 0.3; // 70% éxito

      if (!hasBalance) {
        await dynamo.update({
          TableName: "payment-table",
          Key: { traceId },
          UpdateExpression: "set #status = :status, #error = :error",
          ExpressionAttributeNames: {
            "#status": "status",
            "#error": "error"
          },
          ExpressionAttributeValues: {
            ":status": "FAILED",
            ":error": "No tiene saldo disponible"
          }
        }).promise();

        console.log("Payment failed:", traceId);
        continue;
      }

      await sqs.sendMessage({
        QueueUrl: process.env.TRANSACTION_QUEUE_URL,
        MessageBody: JSON.stringify({
          traceId
        })
      }).promise();

      console.log("Balance OK, sent to transaction:", traceId);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Check balance processed" })
    };

  } catch (error) {
    console.error("Error in check-balance:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error processing check-balance",
        details: error.message
      })
    };
  }
};