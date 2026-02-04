const form = document.querySelector(".survey");
const button = document.querySelector("button[type='submit']");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  button.textContent = "Thanks for your feedback!";
  button.disabled = true;
});
