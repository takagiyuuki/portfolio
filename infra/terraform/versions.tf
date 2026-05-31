terraform {
  required_version = ">= 1.6"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }

  # R2 (S3-compatible) backend.
  # endpoint is supplied at `terraform init` time via -backend-config.

  backend "s3" {
    bucket = "tfstate-yukit-dev"
    key    = "yukit-dev.tfstate"
    region = "auto"

    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
    use_path_style              = true
  }
}
