resource "aws_vpc_endpoint" "s3" {
  vpc_id       = data.aws_vpc.default.id
  service_name = "com.amazonaws.us-east-1.s3"

  vpc_endpoint_type = "Gateway"

  route_table_ids = data.aws_route_tables.default.ids

  tags = {
    Name = "s3-vpc-endpoint"
  }
}

data "aws_route_tables" "default" {
  vpc_id = data.aws_vpc.default.id
}