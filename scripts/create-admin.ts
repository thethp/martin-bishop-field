// Usage: npx tsx scripts/create-admin.ts <username> <password>
// Outputs the SQL to insert an admin user

const [username, password] = process.argv.slice(2);

if (!username || !password) {
  console.error('Usage: npx tsx scripts/create-admin.ts <username> <password>');
  process.exit(1);
}

async function hashPassword(pw: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256,
  );
  const hash = new Uint8Array(bits);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

hashPassword(password).then(hash => {
  console.log(`INSERT INTO admins (username, password_hash) VALUES ('${username}', '${hash}');`);
});
