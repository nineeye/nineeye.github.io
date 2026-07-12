import { JPG_PNG_DEFINITION } from "./converter.definition.js";
import { verifyPng } from "../../assets/js/image-platform/core/ImageEngine.js";
import { createImageConverterApplication } from "../../assets/js/image-platform/ImageConverterApp.js?v=1.12.0";

const app = createImageConverterApplication({
  converterDefinition: JPG_PNG_DEFINITION,
  verifyOutput: verifyPng,
});

export const start = app.start;
