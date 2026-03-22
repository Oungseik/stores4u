{
  description = "Stores For You - SvelteKit POS monorepo";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachSystem [ "x86_64-linux" ] (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        website =
          let
            srcFiles = builtins.path {
              name = "stores4u-src";
              path = ./.;
              filter =
                path: type:
                let
                  name = baseNameOf path;

                  isGit = name == ".git";
                  isNix = name == "nix" && type == "directory";
                  isFlake = name == "flake.nix" || name == "flake.lock";
                  isNodeModules = name == "node_modules";
                  isSvelteKit = name == ".svelte-kit";
                  isBuildArtifact = name == "dist" || name == ".turbo";
                in
                !(isGit || isNix || isFlake || isNodeModules || isSvelteKit || isBuildArtifact);
            };

            pnpmDeps = pkgs.pnpm.fetchDeps {
              pname = "stores4u-website-deps";
              version = "0.0.1";
              src = srcFiles;
              hash = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
              fetcherVersion = 1;
            };
          in
          pkgs.stdenv.mkDerivation {
            pname = "stores4u-website";
            version = "0.0.1";

            src = srcFiles;

            inherit pnpmDeps;

            nativeBuildInputs = with pkgs; [
              pnpm
              bun
              nodejs
              cacert
              makeWrapper
            ];

            configurePhase = ''
              runHook preConfigure

              export HOME=$(mktemp -d)

              pnpm config set manage-package-manager-versions false

              runHook postConfigure
            '';

            buildPhase = ''
              runHook preBuild

              pnpm install --offline --frozen-lockfile --ignore-scripts

              pnpm --filter website build

              runHook postBuild
            '';

            installPhase = ''
              runHook preInstall

              mkdir -p $out/lib/website $out/bin

              cp -r apps/website/.svelte-kit/adapter-bun/* $out/lib/website/

              makeWrapper ${pkgs.bun}/bin/bun $out/bin/website \
                --add-flags "run" \
                --add-flags "$out/lib/website/index.js" \
                --set-default PORT 3000

              runHook postInstall
            '';
          };
      in
      {
        packages = {
          inherit website;
          default = self.packages.${system}.website;
        };

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bun
            pnpm
            nodejs
            biome
          ];

          LD_LIBRARY_PATH = "${pkgs.stdenv.cc.cc.lib}/lib";
        };
      }
    );
}
