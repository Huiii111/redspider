# DEV ONLY. Stands in for TerraGoat so `npm run benchmark:fake` works offline.
# The real benchmark must use a pinned clone of https://github.com/bridgecrewio/terragoat
resource "aws_ebs_volume" "goat" {
  availability_zone = "us-west-2a"
  size              = 1
  encrypted         = false
}

resource "aws_db_instance" "goat" {
  engine              = "mysql"
  instance_class      = "db.t3.micro"
  publicly_accessible = true
  storage_encrypted   = false
}
