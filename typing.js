document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('hero-headline-text');
  if (!container) return;

  const text1 = "Write Your ";
  const text2 = "Thoughts.";
  
  // Clear the static text so we can animate it
  container.innerHTML = '';
  
  let i = 0;
  let j = 0;
  let emElement = null;
  const speed = 80; // ms per character (typing speed)
  
  function type() {
    if (i < text1.length) {
      container.appendChild(document.createTextNode(text1.charAt(i)));
      i++;
      setTimeout(type, speed);
    } else if (j < text2.length) {
      if (!emElement) {
        emElement = document.createElement('em');
        container.appendChild(emElement);
      }
      emElement.appendChild(document.createTextNode(text2.charAt(j)));
      j++;
      setTimeout(type, speed);
    }
  }
  
  // Start the typing animation after a short delay
  setTimeout(type, 300);
});
