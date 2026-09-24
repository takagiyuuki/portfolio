{
  description = "yukit.dev portfolio site development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      nixpkgs,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_24
            pnpm
            act
            actionlint
            # Icon generation: SVG -> PNG (librsvg), PNG -> ICO (imagemagick)
            librsvg
            imagemagick
          ];

          shellHook = ''
            echo "yukit.dev dev env — node $(node --version), pnpm $(pnpm --version)"
          '';
        };
      }
    );
}
