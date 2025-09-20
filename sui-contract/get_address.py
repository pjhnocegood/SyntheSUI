#!/usr/bin/env python3
import base64
import hashlib
from nacl.signing import SigningKey
from nacl.encoding import RawEncoder

# The private key in base64 format (with flag)
private_key_base64 = "ALFrivwzu1VznLTkYmrX7TK8v9JLlzXTgByj/qz6phSQ"

# Decode from base64
private_key_bytes = base64.b64decode(private_key_base64)

# Remove the flag byte (first byte)
private_key_raw = private_key_bytes[1:]

# Create signing key
signing_key = SigningKey(private_key_raw)
public_key = signing_key.verify_key

# Get public key bytes
public_key_bytes = bytes(public_key)

# Create Sui address (Blake2b hash of flag + public key)
flag = b'\x00'  # ED25519 flag
data = flag + public_key_bytes

# Blake2b-256 hash
address_hash = hashlib.blake2b(data, digest_size=32).digest()

# The address is the hash with 0x prefix
address = "0x" + address_hash.hex()

print(f"Private Key (base64): {private_key_base64}")
print(f"Public Key (hex): {public_key_bytes.hex()}")
print(f"Sui Address: {address}")