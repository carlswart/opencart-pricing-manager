# Secure Database Connection Guide

This guide explains how to properly secure the connections between your application and remote OpenCart database servers.

## 1. SSL/TLS Certificate Setup

### Obtaining CA Certificates

To use SSL/TLS with your MySQL connections, you'll need:

1. **CA Certificate**: The certificate authority that signed your database server's certificate
2. **Client Certificate** (optional): For mutual TLS authentication
3. **Client Key** (optional): Private key for the client certificate

You can obtain these from:
- Your database hosting provider
- Your IT department if the database is self-hosted

### Certificate Placement

Place certificates in this directory (`ssl/`) with these names:
- `ca-cert.pem`: Certificate Authority certificate
- `client-cert.pem`: Client certificate (if using mutual TLS)
- `client-key.pem`: Client private key (if using mutual TLS)

## 2. Environment Configuration

Enable SSL connections by setting in your environment:

```
USE_SSL=true
```

## 3. Connection Security Levels

Our system supports different security levels for database connections:

1. **Basic Security**: Password-based authentication over TLS
   - Protects against network sniffing
   - Setup: Only provide CA certificate

2. **Advanced Security**: Mutual TLS authentication with client certificates
   - Protects against unauthorized access even if passwords are compromised
   - Setup: Provide CA certificate, client certificate, and client key

## 4. MySQL Server Configuration

Ensure your MySQL server:
- Has SSL/TLS enabled
- Has a valid certificate installed
- Accepts encrypted connections

You can check this on the server with:
```sql
SHOW VARIABLES LIKE '%ssl%';
```

## 5. Testing Secure Connections

You can test if your connection is using SSL/TLS by:

1. Using the "Test Connection" button in Database Settings
2. Checking the server logs which will indicate if SSL is being used
3. Directly querying the server:
   ```sql
   SELECT ssl_cipher, ssl_version FROM status WHERE ssl_cipher IS NOT NULL;
   ```

## 6. Connection Pooling

Our application implements connection pooling, which:
- Reuses connections for better performance
- Reduces connection overhead
- Maintains a configurable number of connections

## 7. Troubleshooting

Common issues:
- **Certificate verification failure**: Ensure your CA certificate is correct
- **Connection timeouts**: Check firewall settings and network connectivity
- **Permission issues**: Make sure your database user has proper SSL permissions

For detailed logs, check the application's error logs.

## 8. Additional Security Measures

Beyond SSL/TLS, we've implemented:
- Parameterized queries to prevent SQL injection
- Connection timeouts to prevent hanging connections
- Proper error handling and logging
- Transaction support for data integrity