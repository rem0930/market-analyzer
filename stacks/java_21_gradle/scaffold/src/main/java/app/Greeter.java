package app;

/**
 * Provides greeting functionality.
 */
public class Greeter {
    
    /**
     * Returns a greeting message for the given name.
     *
     * @param name the name to greet
     * @return a greeting message
     */
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }

    public static void main(String[] args) {
        System.out.println(greet("World"));
    }
}
