import { register } from "node:module";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK, tracing } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { createAddHookMessageChannel } from "import-in-the-middle";
import { env } from "$env/dynamic/public";

const { registerOptions } = createAddHookMessageChannel();
register("import-in-the-middle/hook.mjs", import.meta.url, registerOptions);

const OTEL_ENABLED = process.env.OTEL_ENABLED !== "false";
const OTEL_SERVICE_NAME = process.env.OTEL_SERVICE_NAME || "website";
const OTEL_EXPORTER_OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const ENVIRONMENT = env.PUBLIC_ENVIRONMENT;

function createTraceExporter() {
  if (!OTEL_ENABLED) {
    return new tracing.NoopSpanProcessor();
  }

  if (ENVIRONMENT === "development" || !OTEL_EXPORTER_OTLP_ENDPOINT) {
    return new tracing.SimpleSpanProcessor(new tracing.ConsoleSpanExporter());
  }

  return new tracing.BatchSpanProcessor(
    new OTLPTraceExporter({
      url: OTEL_EXPORTER_OTLP_ENDPOINT,
    }),
  );
}

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: OTEL_SERVICE_NAME,
});

const sdk = new NodeSDK({
  resource,
  spanProcessor: createTraceExporter(),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": {
        enabled: false,
      },
    }),
    new PinoInstrumentation(),
  ],
});

if (OTEL_ENABLED) {
  sdk.start();
}

export { sdk };
