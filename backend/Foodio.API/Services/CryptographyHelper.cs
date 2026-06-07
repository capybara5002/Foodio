using System.Security.Cryptography;
using System.Text;

namespace Foodio.API.Services;

public static class CryptographyHelper
{
    private static readonly byte[] Key;
    private static readonly byte[] Iv;

    static CryptographyHelper()
    {
        const string secret = "FoodioCraveMapSecretSecurityPassphraseKey2026!";
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(secret));
        
        Key = new byte[32]; // AES-256
        Iv = new byte[16];  // AES block size
        
        Array.Copy(hash, 0, Key, 0, 32);
        Array.Copy(hash, 0, Iv, 0, 16);
    }

    public static string Encrypt(string plainText)
    {
        using var aes = Aes.Create();
        aes.Key = Key;
        aes.IV = Iv;

        var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);

        using var ms = new MemoryStream();
        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        {
            using (var sw = new StreamWriter(cs))
            {
                sw.Write(plainText);
            }
        }

        return Convert.ToBase64String(ms.ToArray())
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }

    public static string Decrypt(string cipherText)
    {
        var incoming = cipherText
            .Replace('-', '+')
            .Replace('_', '/');
        
        var padding = (4 - incoming.Length % 4) % 4;
        incoming += new string('=', padding);
        
        var buffer = Convert.FromBase64String(incoming);

        using var aes = Aes.Create();
        aes.Key = Key;
        aes.IV = Iv;

        var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);

        using var ms = new MemoryStream(buffer);
        using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
        using var sr = new StreamReader(cs);
        
        return sr.ReadToEnd();
    }
}
