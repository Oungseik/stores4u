{
  description = "Stores For You Nix entrypoints";

  inputs = {
    dendritic-config = {
      url = "github:Oungseik/dentritic-nix-config";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      dendritic-config,
      nixpkgs,
      utils,
    }:
    utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        lib = pkgs.lib;
        wrangler = dendritic-config.packages.${system}.wrangler;

        websiteLibs = with pkgs; [
          cairo
          fontconfig
          freetype
          giflib
          glib
          libjpeg
          libpng
          librsvg
          openssl
          pango
          pixman
          poppler-utils
          sqlite
          stdenv.cc.cc.lib
          zlib
        ];

        ldLibraryPath = lib.makeLibraryPath websiteLibs;

        website = pkgs.writeShellApplication {
          name = "website";

          runtimeInputs =
            with pkgs;
            [
              bun
              coreutils
              gnumake
              nodejs
              pkg-config
              pnpm
              python3
            ]
            ++ websiteLibs;

          text = ''
            if [ ! -f package.json ] || [ ! -f apps/website/package.json ]; then
              echo "Run \`nix run .#website\` from the repository root." >&2
              exit 1
            fi

            export LD_LIBRARY_PATH="${ldLibraryPath}:''${LD_LIBRARY_PATH:-}"
            export HOST="''${HOST:-0.0.0.0}"
            export PORT="''${PORT:-3000}"
            export NODE_ENV="''${NODE_ENV:-production}"

            cache_root="''${XDG_CACHE_HOME:-$PWD/.cache}"
            mkdir -p "$cache_root/bun/install"
            export BUN_INSTALL_CACHE_DIR="$cache_root/bun/install"
            export BUN_RUNTIME_TRANSPILER_CACHE_PATH="$cache_root/bun/transpiler"

            if [ ! -d node_modules ]; then
              bun install --frozen-lockfile
            fi

            bun run build
            exec bun run ./apps/website/build/index.js "$@"
          '';
        };

        websiteApp = {
          type = "app";
          program = "${website}/bin/website";
        };

        devShell = pkgs.mkShell {
          packages =
            [ wrangler ]
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

          LD_LIBRARY_PATH = ldLibraryPath;
        };
      in
      {
        apps.website = websiteApp;
        apps.default = websiteApp;

        packages.website = website;
        packages.wrangler = wrangler;
        packages.default = website;

        devShells.default = devShell;
        devShell = devShell;
      }
    );
}
