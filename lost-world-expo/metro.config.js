// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Character models prepared by tools/prepare-models.mjs: glTF binaries and compressed raw textures.
config.resolver.assetExts.push('glb', 'lwtex');

// '@lostworld/models' resolves to the prepared models when they exist (assets/models is git-ignored),
// otherwise to a stub so the game falls back to its built-in characters.
const modelsIndex = path.resolve(__dirname, 'assets/models/index.js');
const noModels = path.resolve(__dirname, 'src/models/none.ts');
const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@lostworld/models') {
    return { type: 'sourceFile', filePath: fs.existsSync(modelsIndex) ? modelsIndex : noModels };
  }
  return (upstream ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
