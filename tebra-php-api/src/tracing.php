<?php
// tebra-php-api/src/tracing.php
// Lightweight OpenTelemetry bootstrap for the Cloud-Run PHP service.
//
// • Supports Jaeger (default) or OTLP exporter via env variable OTEL_EXPORTER.
// • Adds a simple IdGenerator that re-uses the X-Correlation-Id header as the traceId
//   when present (padded to 32-char hex) so that Node ⇄ PHP traces align.
// • Safe-no-op if OpenTelemetry libs are not installed or OTEL_EXPORTER is unset.

if (defined('TEBRA_TRACING_INITIALISED')) {
    return; // prevent double-init
}

define('TEBRA_TRACING_INITIALISED', true);

$exporterType = getenv('OTEL_EXPORTER') ?: null; // 'jaeger' | 'otlp'
if (!$exporterType) {
    return; // tracing disabled
}

// If the OpenTelemetry SDK is missing, silently skip to avoid fatal error
if (!class_exists(OpenTelemetry\API\Globals::class)) {
    error_log('[Tracing] OpenTelemetry SDK not installed – skipping');
    return;
}

use OpenTelemetry\SDK\Resource\ResourceInfoFactory;
use OpenTelemetry\SDK\Trace\TracerProvider;
use OpenTelemetry\SDK\Trace\SpanProcessor\SimpleSpanProcessor;
use OpenTelemetry\SDK\Trace\IdGeneratorInterface;
use OpenTelemetry\SDK\Trace\SpanExporter\JaegerExporter;
use OpenTelemetry\SDK\Trace\SpanExporter\OtlpHttpExporter;
use OpenTelemetry\API\Globals;

// -------------------------------------------------------------
// Custom ID generator that converts correlationId → traceId
// -------------------------------------------------------------
class CorrelationIdGenerator implements IdGeneratorInterface
{
    public function generateSpanId(): string
    {
        // 16 hex chars
        return bin2hex(random_bytes(8));
    }

    public function generateTraceId(): string
    {
        $corr = $this->getCorrelationId();
        if ($corr) {
            return substr(str_pad($corr, 32, '0'), 0, 32);
        }
        return bin2hex(random_bytes(16)); // 32 hex chars
    }

    private function getCorrelationId(): ?string
    {
        $hdr = $_SERVER['HTTP_X_CORRELATION_ID'] ?? null;
        if ($hdr && preg_match('/^[a-f0-9]{8,32}$/i', $hdr)) {
            return strtolower($hdr);
        }
        return null;
    }
}

$resource = ResourceInfoFactory::defaultResource()->merge(
    ResourceInfoFactory::create([
        'service.name' => getenv('OTEL_SERVICE_NAME') ?: 'workflow-bolt-php',
    ])
);

// Choose exporter
switch ($exporterType) {
    case 'otlp':
        $endpoint = getenv('OTEL_COLLECTOR_ENDPOINT') ?: 'http://localhost:4318/v1/traces';
        $exporter = new OtlpHttpExporter('default', $endpoint);
        break;
    case 'jaeger':
    default:
        $endpoint = getenv('OTEL_COLLECTOR_ENDPOINT') ?: 'http://localhost:14268/api/traces';
        $exporter = new JaegerExporter('workflow-bolt', $endpoint);
        break;
}

$tracerProvider = new TracerProvider(
    new SimpleSpanProcessor($exporter),
    $resource,
    new CorrelationIdGenerator()
);

Globals::setTracerProvider($tracerProvider);

autoloadTracingShutdown();

function autoloadTracingShutdown(): void
{
    register_shutdown_function(function () {
        try {
            $provider = Globals::tracerProvider();
            if (method_exists($provider, 'shutdown')) {
                $provider->shutdown();
            }
        } catch (\Throwable $e) {
            // silent
        }
    });
}
?> 