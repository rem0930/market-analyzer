namespace App;

/// <summary>
/// Provides greeting functionality.
/// </summary>
public static class Greeter
{
    /// <summary>
    /// Returns a greeting message for the given name.
    /// </summary>
    /// <param name="name">The name to greet.</param>
    /// <returns>A greeting message.</returns>
    public static string Greet(string name)
    {
        return $"Hello, {name}!";
    }
}
