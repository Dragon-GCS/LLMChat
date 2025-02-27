const ALGORITHM = 'AES-GCM'

export async function encryptData(data: string, key: string): Promise<string> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    ALGORITHM,
    false,
    ['encrypt']
  )
  
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    cryptoKey,
    encoder.encode(data)
  )
  
  return `${Array.from(iv).join('.')}.${btoa(String.fromCharCode(...new Uint8Array(encrypted)))}`
}

export async function decryptData(encryptedData: string, key: string): Promise<string> {
  const [ivPart, dataPart] = encryptedData.split('.')
  const iv = new Uint8Array(ivPart.split('.').map(Number))
  const data = new Uint8Array(atob(dataPart).split('').map(c => c.charCodeAt(0)))
  
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    ALGORITHM,
    false,
    ['decrypt']
  )
  
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    cryptoKey,
    data
  )
  
  return new TextDecoder().decode(decrypted)
}