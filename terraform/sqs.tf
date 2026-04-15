resource "aws_sqs_queue" "start_payment_queue" {
  name = "start-payment-queue"
}

resource "aws_sqs_queue" "check_balance_queue" {
  name = "check-balance-queue"
}

resource "aws_sqs_queue" "transaction_queue" {
  name = "transaction-queue"
}