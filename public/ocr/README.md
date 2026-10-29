# On-device OCR assets

Tesseract.js 7.0.0 (Apache-2.0) and its WebAssembly core, plus the English "fast" model from
tesseract-ocr/tessdata_fast (Apache-2.0), served from this site so an InBody photo is read in the
member's own browser and never uploaded. Update together with the `tesseract.js` dependency:

- `worker.min.js` ← node_modules/tesseract.js/dist/worker.min.js
- `tesseract-core-simd-lstm.wasm.js`, `tesseract-core-simd-lstm.wasm` ← tesseract.js-core
- `eng.traineddata.gz` ← https://github.com/tesseract-ocr/tessdata_fast (gzip -9)
