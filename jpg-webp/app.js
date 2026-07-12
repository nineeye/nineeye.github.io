import { JPG_WEBP_DEFINITION } from "./converter.definition.js";
import { verifyWebp } from "../../assets/js/image-platform/core/ImageEngine.js";
import { createImageConverterApplication } from "../../assets/js/image-platform/ImageConverterApp.js?v=1.12.0";

const app = createImageConverterApplication({
  converterDefinition: JPG_WEBP_DEFINITION,
  verifyOutput: verifyWebp,
});

export const start = app.start;
