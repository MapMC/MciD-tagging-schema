{
  description = "id-tagging-schema fork with custom presets";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      packages = forAllSystems (system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          id-schema-dist = pkgs.buildNpmPackage {
            pname = "id-schema-dist";
            version = (builtins.fromJSON (builtins.readFile ./package.json)).version;

            src = self;

            npmDeps = pkgs.fetchNpmDeps {
              src = self;
              hash = "sha256-OdMGqef0lkhMbuHf9RfwNB1YCWv1ZD3YgtNRXXDda64=";
              makeCacheWritable = true;
            };

            makeCacheWritable = true;

            npmFlags = [ "--force" ];

            buildPhase = ''
              runHook preBuild
              npm run dist --offline
              runHook postBuild
            '';

            installPhase = ''
              runHook preInstall
              mkdir -p $out/dist
              cp package.json $out/
              cp dist/presets.min.json dist/fields.min.json \
                 dist/preset_categories.min.json dist/preset_defaults.min.json \
                 dist/deprecated.min.json dist/discarded.min.json \
                 $out/dist/
              runHook postInstall
            '';
          };
        });
    };
}
