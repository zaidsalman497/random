function greet(name) {
  if (!name || !String(name).trim()) return 'Hello, World!';
  return 'Hello, ' + name + '!';
}

if (require.main === module) {
  console.log(greet("I am Zaid"));
}

