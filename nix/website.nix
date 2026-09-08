{ ... }:
{
  perSystem =
    { pkgs, ... }:
    let
      websiteLibs = import ./_website-libs.nix { inherit pkgs; };
      ldLibraryPath = pkgs.lib.makeLibraryPath websiteLibs;

      website = pkgs.writeShellApplication {
        name = "website";

        runtimeInputs =
          (with pkgs; [
            bun
            coreutils
            gnumake
            nodejs
            pkg-config
            python3
          ])
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
        meta.description = "Build and run the stores4u website";
      };
    in
    {
      apps = {
        default = websiteApp;
        website = websiteApp;
      };

      packages = {
        default = website;
        website = website;
      };
    };
}
