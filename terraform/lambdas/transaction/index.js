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

      const cardResult = await dynamo.query({
        TableName: "card-table",
        KeyConditionExpression: "#uuid = :uuid",
        ExpressionAttributeNames: {
          "#uuid": "uuid"
        },
        ExpressionAttributeValues: {
          ":uuid": payment.cardId
        }
      }).promise();

      const card = cardResult.Items[0];

      if (!card) {
        console.error("Card not found:", payment.cardId);
        continue;
      }

      const newBalance = card.balance - amount;

      if (newBalance < 0) {
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
            ":error": "Saldo insuficiente"
          }
        }).promise();

        console.log("Payment failed (negative balance):", traceId);
        continue;
      }

      console.log("Processing payment:", {
        traceId,
        amount,
        oldBalance: card.balance,
        newBalance
      });

      await dynamo.update({
        TableName: "card-table",
        Key: {
          uuid: card.uuid,
          createdAt: card.createdAt
        },
        UpdateExpression: "set balance = :b",
        ExpressionAttributeValues: {
          ":b": newBalance
        }
      }).promise();

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
      body: JSON.stringify({
        message: "Transaction processed"
      })
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