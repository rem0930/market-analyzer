package app;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class GreeterTest {

    @Test
    void greetWithName() {
        assertEquals("Hello, World!", Greeter.greet("World"));
    }

    @Test
    void greetWithEmptyName() {
        assertEquals("Hello, !", Greeter.greet(""));
    }
}
