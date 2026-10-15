import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(90);
Config.setOverwriteOutput(true);
Config.setCodec("h264");
Config.setCrf(18);
Config.setEntryPoint("src/index.ts");
Config.setChromiumOpenGlRenderer("angle"); // 3D (Three.js) funciona sem placa de vídeo
