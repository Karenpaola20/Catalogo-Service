const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const { getRedis } = require("./redis");

exports.handler = async (event) => {
  let redis;

  try {
    const body = JSON.parse(event.body || "{}");

    if (!body.file) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "File is required" })
      };
    }

    const fileBuffer = Buffer.from(body.file, "base64");
    const fileContent = fileBuffer.toString("utf-8");

    const fileKey = `catalog-${Date.now()}.csv`;

    await s3.putObject({
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
      Body: fileContent
    }).promise();

    const lines = fileContent.split("\n").filter(l => l.trim() !== "");

    if (lines.length < 2) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "CSV vacío o inválido" })
      };
    }

    const headers = lines[0].split(",");

    const results = lines.slice(1).map(line => {
      const values = line.split(",");
      const obj = {};

      headers.forEach((h, i) => {
        obj[h.trim()] = values[i]?.trim();
      });

      obj.id = Number(obj.id);
      obj.precio_mensual = Number(obj.precio_mensual);

      return obj;
    });

    redis = getRedis();

    if (!redis) {
      throw new Error("Redis not configured");
    }

    await redis.set("catalog", JSON.stringify(results));

    console.log("Catálogo actualizado en Redis:", results.length);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*"
      },
      body: JSON.stringify({
        message: "Catalog updated successfully",
        total: results.length,
        file: fileKey
      })
    };

  } catch (error) {
    console.error("Error:", error);

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
  } finally {
    if (redis && redis.status === "ready") {
      await redis.quit();
    }
  }
};