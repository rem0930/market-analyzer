/**
 * Hello World API
 * This is a minimal example to verify the stack is working.
 */

export function greet(name: string): string {
  return `Hello, ${name}!`;
}

// Entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(greet('World'));
}
