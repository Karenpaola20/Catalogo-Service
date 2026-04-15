const AWS = require("aws-sdk");

const dynamo = new AWS.DynamoDB.DocumentClient();

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

      const amount = payment.service?.precio_mensual || 0;

      console.log("Processing payment:", {
        traceId,
        amount,
        cardId: payment.cardId
      });

      console.log("Calling external bank API...");

      await dynamo.update({
        TableName: "payment-table",
        Key: { traceId },
        UpdateExpression: "set #status = :status",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":status": "FINISH"
        }
      }).promise();

      console.log("Payment completed:", traceId);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Transaction processed" })
    };

  } catch (error) {
    console.error("Error in transaction:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error processing transaction",
        details: error.message
      })
    };
  }
};