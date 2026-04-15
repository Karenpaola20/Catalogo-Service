resource "aws_dynamodb_table" "payment_table" {
  name         = "payment-table"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "traceId"

  attribute {
    name = "traceId"
    type = "S"
  }
}