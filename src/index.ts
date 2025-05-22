import { Hono } from 'hono'
import { logger } from 'hono/logger'
import Jimp from 'jimp'
import { totp } from 'otplib'
import QrCode from 'qrcode-reader'

const app = new Hono()

app.use('*', logger())


app.onError((err, c) => {
  console.error(`Global error handler: ${err.message}`, err.stack)
  return c.json({ error: 'An unexpected error occurred', message: err.message }, 500)
})

// Validate if the secret is a valid base32 string
function isValidBase32(secret: string): boolean {
  const base32Regex = /^[A-Z2-7]+=*$/
  return base32Regex.test(secret)
}


app.post('/otp', async (c) => {
  let body: { secret: string } | undefined
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const secret = body?.secret
  if (typeof secret !== 'string' || !secret.trim()) {
    return c.json({ error: 'Missing or invalid secret' }, 400)
  }

  if (!isValidBase32(secret)) {
    return c.json({ error: 'Invalid secret format. Must be a valid base32 string.' }, 400)
  }

  try {
    const code = totp.generate(secret)
    return c.json({ code, expiresIn: totp.timeRemaining() })
  } catch (error) {
    console.error('OTP generation error:', error)
    return c.json({ error: 'Failed to generate OTP. Secret may be invalid.' }, 422)
  }
})

app.post('/qr-secret', async (c) => {
  const contentType = c.req.header('content-type') || ''
  if (!contentType.startsWith('multipart/form-data')) {
    return c.json({ error: 'Content-Type must be multipart/form-data' }, 400)
  }

  const formData = await c.req.formData()
  const file = formData.get('image')
  if (!file || typeof file === 'string' || !('arrayBuffer' in file)) {
    return c.json({ error: 'Missing image file' }, 400)
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())

  
    const image = await Jimp.read(buffer)
    const qr = new QrCode()

    const result: string = await new Promise((resolve, reject) => {
      qr.callback = (err: Error | null, result: { result: string } | null) => {
        if (err) {
          reject(err)
        } else {
          resolve(result?.result ?? '')
        }
      }
      qr.decode(image.bitmap)
    })

    if (!result) {
      return c.json({ error: 'No QR code found or QR code is empty' }, 422)
    }

    let secret = result
    try {
      if (result.startsWith('otpauth://')) {
        const url = new URL(result)
        const params = new URLSearchParams(url.search)
        const extractedSecret = params.get('secret')
        if (extractedSecret) {
          secret = extractedSecret
        }
      }
    } catch (e) {
      console.error('Error parsing otpauth URI:', e)
    }

    return c.json({ secret, originalData: result })
  } catch (e) {
    console.error('QR processing error:', e)
    return c.json({ error: 'Failed to read or decode QR code' }, 422)
  }
})

export default app