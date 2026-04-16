const AWS = require("aws-sdk");
const XLSX = require("xlsx");
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

    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const results = XLSX.utils.sheet_to_json(sheet, {
      defval: null
    });

    const mappedResults = results.map(row => ({
      id: row.ID ? Number(row.ID) : null,
      categoria: row["Categoría"],
      proveedor: row.Proveedor,
      servicio: row.Servicio,
      plan: row.Plan,
      precio_mensual: row["Precio Mensual"]
        ? Number(row["Precio Mensual"])
        : null,
      detalles: row["Velocidad/Detalles"],
      estado: row.Estado
    }));

    await s3.putObject({
      Bucket: process.env.BUCKET_NAME,
      Key: `catalog-${Date.now()}.xlsx`,
      Body: fileBuffer,
      ContentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }).promise();

    redis = getRedis();

    await new Promise((resolve, reject) => {
      if (redis.status === "ready") return resolve();
      redis.once("ready", resolve);
      redis.once("error", reject);
    });

    await redis.set("catalog", JSON.stringify(mappedResults));

    console.log("Catalog saved in Redis:", mappedResults.length);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        message: "Catalog updated",
        total: mappedResults.length
      })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};