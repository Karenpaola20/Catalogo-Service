const AWS = require("aws-sdk");
const s3 = new AWS.S3();

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const fileBuffer = Buffer.from(body.file, "base64");
    const fileContent = fileBuffer.toString("utf-8");

    await s3.putObject({
      Bucket: process.env.BUCKET_NAME,
      Key: `catalog-${Date.now()}.csv`,
      Body: fileContent
    }).promise();

    const lines = fileContent.split("\n").filter(l => l.trim() !== "");
    const headers = lines[0].split(",");

    const results = lines.slice(1).map(line => {
      const values = line.split(",");
      const obj = {};

      headers.forEach((h, i) => {
        obj[h.trim()] = values[i]?.trim();
      });

      obj.precio_mensual = Number(obj.precio_mensual);
      obj.id = Number(obj.id);

      return obj;
    });

    console.log("CSV procesado:", results.length);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*"
      },
      body: JSON.stringify({
        message: "Catalog updated",
        total: results.length
      })
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*"
      },
      body: JSON.stringify({
        error: "Error updating catalog",
        details: error.message
      })
    };
  }
};