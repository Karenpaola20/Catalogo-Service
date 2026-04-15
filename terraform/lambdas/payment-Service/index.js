const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const dynamo = new AWS.DynamoDB.DocumentClient();

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
        body: JSON.stringify({ error: "Card not found" })
      };
    }


    //Validando el estado
    if (card.status !== "ACTIVATED") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Card not active" })
      };
    }

    //Obtenemos el userId
    const userId = card.user_id;

    // 🆔 Generar traceId
    const traceId = uuidv4();

    // 🔥 (Luego aquí irá SQS)

    return {
      statusCode: 200,
      body: JSON.stringify({
        traceId,
        message: "Payment started",
        userId
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal error",
        details: error.message
      })
    };
  }
};