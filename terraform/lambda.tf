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

resource "aws_lambda_function" "payment" {
  function_name = "payment"

  filename         = "${path.module}/lambdas/payment-service/payment.zip"
  source_code_hash = filebase64sha256("${path.module}/lambdas/payment-service/payment.zip")

  handler = "index.handler"
  runtime = "nodejs18.x"
  role    = aws_iam_role.lambda_role.arn

  environment {
    variables = {
      START_PAYMENT_QUEUE_URL = aws_sqs_queue.start_payment_queue.id
    }
  }
}

resource "aws_lambda_permission" "apigw_payment" {
  statement_id  = "AllowAPIGatewayInvokePayment"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

//Start Payment
resource "aws_lambda_function" "start_payment" {
  function_name = "start-payment"

  filename         = "${path.module}/lambdas/start-payment/start-payment.zip"
  source_code_hash = filebase64sha256("${path.module}/lambdas/start-payment/start-payment.zip")

  handler = "index.handler"
  runtime = "nodejs18.x"
  role    = aws_iam_role.lambda_role.arn

  timeout = 10

  environment {
    variables = {
      CHECK_BALANCE_QUEUE_URL = aws_sqs_queue.check_balance_queue.id
    }
  }
}

resource "aws_lambda_event_source_mapping" "start_payment_trigger" {
  event_source_arn = aws_sqs_queue.start_payment_queue.arn
  function_name    = aws_lambda_function.start_payment.arn
}

//Check
resource "aws_lambda_function" "check_balance" {
  function_name = "check-balance"

  filename         = "${path.module}/lambdas/check-balance/check-balance.zip"
  source_code_hash = filebase64sha256("${path.module}/lambdas/check-balance/check-balance.zip")

  handler = "index.handler"
  runtime = "nodejs18.x"
  role    = aws_iam_role.lambda_role.arn

  timeout = 10

  environment {
    variables = {
      TRANSACTION_QUEUE_URL = aws_sqs_queue.transaction_queue.id
    }
  }
}

resource "aws_lambda_event_source_mapping" "check_balance_trigger" {
  event_source_arn = aws_sqs_queue.check_balance_queue.arn
  function_name    = aws_lambda_function.check_balance.arn
}

//Transaction
resource "aws_lambda_function" "transaction" {
  function_name = "transaction"

  filename         = "${path.module}/lambdas/transaction/transaction.zip"
  source_code_hash = filebase64sha256("${path.module}/lambdas/transaction/transaction.zip")

  handler = "index.handler"
  runtime = "nodejs18.x"
  role    = aws_iam_role.lambda_role.arn

  timeout = 10
}

resource "aws_lambda_event_source_mapping" "transaction_trigger" {
  event_source_arn = aws_sqs_queue.transaction_queue.arn
  function_name    = aws_lambda_function.transaction.arn
}

//Get Transaction
resource "aws_lambda_function" "payment_get" {
  function_name = "payment-get"

  filename         = "${path.module}/lambdas/get-payment/payment-get.zip"
  source_code_hash = filebase64sha256("${path.module}/lambdas/get-payment/payment-get.zip")

  handler = "index.handler"
  runtime = "nodejs18.x"
  role    = aws_iam_role.lambda_role.arn
}