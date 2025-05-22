# OTP Worker

A serverless API for generating and verifying TOTP (Time-based One-Time Password) codes and extracting secrets from QR codes.

## Features

- Generate TOTP codes from a secret
- Extract TOTP secrets from QR code images

## Installation

To install dependencies:
```sh
bun install
```

## Development

To run in development mode:
```sh
bun run dev
```

The API will be available at http://localhost:8787

## Deployment

To deploy to Cloudflare Workers:
```sh
bun run deploy
```

## API Endpoints

### OTP Code Generation
```sh
curl -X POST http://localhost:8787/otp \
  -H "Content-Type: application/json" \
  -d '{"secret": "BASE32SECRET"}'
```

Response:
```json
{
  "code": "123456",
  "expiresIn": 30
}
```

### Secret Extraction from QR Code
```sh
curl -X POST http://localhost:8787/qr-secret \
  -F "image=@/path/to/qrcode.jpg"
```

Response:
```json
{
  "secret": "BASE32SECRET",
  "originalData": "otpauth://..."
}
```

