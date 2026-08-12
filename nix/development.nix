{ inputs, ... }:
{
  systems = [
    "aarch64-darwin"
    "aarch64-linux"
    "x86_64-linux"
  ];

  perSystem =
    {
      pkgs,
      system,
      ...
    }:
    let
      websiteLibs = import ./_website-libs.nix { inherit pkgs; };
      wrangler = inputs.dendritic-config.packages.${system}.wrangler;
    in
    {
      packages.wrangler = wrangler;

      devShells.default = pkgs.mkShell {
        packages = [
          wrangler
        ]
        ++ (with pkgs; [
          biome
          bun
          gnumake
          nodejs
          otel-desktop-viewer
          pkg-config
          pnpm
          python3
          turso-cli
        ])
        ++ websiteLibs;

        LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath websiteLibs;
      };
    };
}
