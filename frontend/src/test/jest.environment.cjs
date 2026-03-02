const JsdomEnvironment = require("jest-environment-jsdom").TestEnvironment;

const nodeFetch = globalThis.fetch;
const nodeHeaders = globalThis.Headers;
const nodeRequest = globalThis.Request;
const nodeResponse = globalThis.Response;
const nodeFormData = globalThis.FormData;
const nodeBlob = globalThis.Blob;
const nodeFile = globalThis.File;

class AppJsdomEnvironment extends JsdomEnvironment {
  async setup() {
    await super.setup();

    if (!this.global.fetch && nodeFetch) {
      this.global.fetch = nodeFetch;
    }
    if (!this.global.Headers && nodeHeaders) {
      this.global.Headers = nodeHeaders;
    }
    if (!this.global.Request && nodeRequest) {
      this.global.Request = nodeRequest;
    }
    if (!this.global.Response && nodeResponse) {
      this.global.Response = nodeResponse;
    }
    if (!this.global.FormData && nodeFormData) {
      this.global.FormData = nodeFormData;
    }
    if (!this.global.Blob && nodeBlob) {
      this.global.Blob = nodeBlob;
    }
    if (!this.global.File && nodeFile) {
      this.global.File = nodeFile;
    }
  }
}

module.exports = AppJsdomEnvironment;
