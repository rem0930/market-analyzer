namespace App.Tests;

public class GreeterTests
{
    [Fact]
    public void Greet_WithName_ReturnsGreeting()
    {
        var result = Greeter.Greet("World");
        Assert.Equal("Hello, World!", result);
    }

    [Fact]
    public void Greet_WithEmptyName_ReturnsGreeting()
    {
        var result = Greeter.Greet("");
        Assert.Equal("Hello, !", result);
    }
}
