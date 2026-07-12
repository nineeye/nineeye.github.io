import { AVIF_JPG_DEFINITION } from "./converter.definition.js";
import { verifyJpeg } from "../../assets/js/image-platform/core/ImageEngine.js";
import { createImageConverterApplication } from "../../assets/js/image-platform/ImageConverterApp.js?v=1.22.0";

const app = createImageConverterApplication({
  converterDefinition: AVIF_JPG_DEFINITION,
  verifyOutput: verifyJpeg,
});

export const start = app.start;
