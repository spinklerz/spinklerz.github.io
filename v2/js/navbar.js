// include-navbar.js
document.addEventListener("DOMContentLoaded", () => {
    fetch('navbar.html')
      .then(res => res.text())
      .then(data => {
        document.getElementById("navbar-container").innerHTML = data;
      })
      .then(() => {
        const script = document.createElement('script');
        script.src = 'navbar.js';
        document.body.appendChild(script);
      });
  });
  