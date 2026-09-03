using System.Text.RegularExpressions;

namespace TigerApp.Api.Configuration;

public static partial class DotEnvLoader
{
    public static void LoadClosest(string startDirectory)
    {
        var directory = new DirectoryInfo(Path.GetFullPath(startDirectory));
        for (var depth = 0; directory is not null && depth < 4; depth++, directory = directory.Parent)
        {
            var path = Path.Combine(directory.FullName, ".env");
            if (!File.Exists(path))
                continue;

            Load(path);
            return;
        }
    }

    private static void Load(string path)
    {
        foreach (var rawLine in File.ReadLines(path))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#'))
                continue;

            if (line.StartsWith("export ", StringComparison.Ordinal))
                line = line[7..].TrimStart();

            var separator = line.IndexOf('=');
            if (separator <= 0)
                continue;

            var key = line[..separator].Trim();
            if (!IsValidKey(key) || Environment.GetEnvironmentVariable(key) is not null)
                continue;

            var value = Unquote(line[(separator + 1)..].Trim());
            value = VariablePattern().Replace(value, match =>
                Environment.GetEnvironmentVariable(match.Groups[1].Value) ?? match.Value);

            Environment.SetEnvironmentVariable(key, value);
        }
    }

    private static bool IsValidKey(string key)
    {
        if (key.Length == 0 || !(char.IsAsciiLetter(key[0]) || key[0] == '_'))
            return false;

        return key.All(character => char.IsAsciiLetterOrDigit(character) || character == '_');
    }

    private static string Unquote(string value)
    {
        if (value.Length >= 2 &&
            ((value[0] == '"' && value[^1] == '"') || (value[0] == '\'' && value[^1] == '\'')))
            return value[1..^1];

        return value;
    }

    [GeneratedRegex(@"\$\{([A-Za-z_][A-Za-z0-9_]*)\}", RegexOptions.CultureInvariant)]
    private static partial Regex VariablePattern();
}
