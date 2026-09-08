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
    in
    {
      devShells.default = pkgs.mkShell {
        packages =
          (with pkgs; [
            biome
            bun
            gnumake
            nodejs
            otel-desktop-viewer
            pkg-config
            python3
            turso-cli
          ])
          ++ websiteLibs;

        LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath websiteLibs;
      };
    };
}
