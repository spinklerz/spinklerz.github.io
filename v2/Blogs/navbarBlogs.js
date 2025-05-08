// include-navbar.js
document.addEventListener("DOMContentLoaded", () => {
    fetch('navbarBlogs.html')
      .then(res => res.text())
      .then(data => {
        document.getElementById("navbar-container").innerHTML = data;
      })
      .then(() => {
        const script = document.createElement('script');
        script.src = 'navbarBlogs.js';
        document.body.appendChild(script);
      });
  });
  