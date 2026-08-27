variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID (supplied via TF_VAR_cloudflare_account_id)"
}

resource "cloudflare_workers_custom_domain" "apex" {
  account_id  = var.cloudflare_account_id
  zone_id     = data.cloudflare_zone.yukit_dev.id
  hostname    = "yukit.dev"
  service     = "portfolio"
  environment = "production"
}

