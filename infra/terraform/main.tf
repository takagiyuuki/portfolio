# Provider reads CLOUDFLARE_API_TOKEN from environment.
provider "cloudflare" {}

# Auth probe: looks up the yukit.dev zone via the Cloudflare API.
# Verifies that the token has Zone:Read permission on the zone.

data "cloudflare_zone" "yukit_dev" {
  filter = {
    name = "yukit.dev"
  }
}

output "zone_id" {
  description = "Zone ID for yukit.dev"
  value       = data.cloudflare_zone.yukit_dev.id
}

output "zone_name" {
  description = "Zone name (sanity check)"
  value       = data.cloudflare_zone.yukit_dev.name
}
