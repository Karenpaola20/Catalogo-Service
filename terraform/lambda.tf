resource "aws_lambda_function" "catalog_update" {
  function_name = "catalog-update"

  filename          = "${path.module}/lambdas/updateCata-service/update.zip"
  source_code_hash  = filebase64sha256("${path.module}/lambdas/updateCata-service/update.zip")
  handler           = "index.handler"
  runtime           = "nodejs18.x"
  role              = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      REDIS_HOST = aws_elasticache_cluster.redis.cache_nodes[0].address
    }
  }

  vpc_config {
    subnet_ids         = data.aws_subnets.default.ids
    security_group_ids = [aws_security_group.redis_sg.id]
  }
}

resource "aws_lambda_function" "catalog_get" {
  function_name = "catalog-get"

  filename          = "${path.module}/lambdas/get-catalog-service/catalog.zip"
  source_code_hash  = filebase64sha256("${path.module}/lambdas/get-catalog-service/catalog.zip")
  handler           = "index.handler"
  runtime           = "nodejs18.x"
  role              = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      REDIS_HOST = aws_elasticache_cluster.redis.cache_nodes[0].address
    }
  }

  vpc_config {
    subnet_ids         = data.aws_subnets.default.ids
    security_group_ids = [aws_security_group.redis_sg.id]
  }
}