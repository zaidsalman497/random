function greet(name) {
  if (!name || !String(name).trim()) return 'Hello, World!';
  return 'Hello, ' + name + '!';
}

// Minimal runnable demonstration
if (require.main === module) {
  console.log(greet("I am Zaid"));
}

// This file intentionally contains only one function: greet
