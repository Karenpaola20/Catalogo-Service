const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const dynamo = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : event;

    const { cardId, service } = body;

    const cardResult = await dynamo.query({
      TableName: "card-table",
      KeyConditionExpression: "#uuid = :uuid",
      ExpressionAttributeNames: {
        "#uuid": "uuid"
      },
      ExpressionAttributeValues: {
        ":uuid": cardId
      }
    }).promise();

    const card = cardResult.Items[0];

    if (!card) {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ error: "Card not found" })
      };
    }

    if (card.status !== "ACTIVATED") {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ error: "Card not activated" })
      };
    }

    const userId = card.user_id;
    const traceId = uuidv4();
    const timestamp = Date.now();

    await dynamo.put({
      TableName: "payment-table",
      Item: {
        traceId,
        userId,
        cardId,
        service,
        status: "INITIAL",
        timestamp
      }
    }).promise();

    await sqs.sendMessage({
      QueueUrl: process.env.START_PAYMENT_QUEUE_URL,
      MessageBody: JSON.stringify({
        userId,
        cardId,
        service,
        traceId,
        status: "INITIAL",
        timestamp
      })
    }).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*"
      },
      body: JSON.stringify({
        traceId,
        message: "Payment started",
        userId
      })
    };

  } catch (error) {
    return {
      statusCode: 404,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Internal Error" })
    };
  }
};