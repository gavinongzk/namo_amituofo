import { ImageResponse } from 'next/og'

export const size = [
  { width: 57, height: 57 },
  { width: 72, height: 72 },
  { width: 76, height: 76 },
  { width: 114, height: 114 },
  { width: 120, height: 120 },
  { width: 144, height: 144 },
  { width: 152, height: 152 },
  { width: 180, height: 180 },
]
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 24,
        background: 'red',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
      }}
    >
      A
    </div>,
    { width: 144, height: 144 }
  )
}