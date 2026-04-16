resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "catalog_bucket" {
  bucket = "catalog-bucket-${random_id.suffix.hex}"
}