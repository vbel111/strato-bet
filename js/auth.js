// Authentication functions
function showLogin() {
  document.getElementById("loginModal").classList.remove("hidden")
  document.getElementById("loginModal").classList.add("flex")
}

function hideLogin() {
  document.getElementById("loginModal").classList.add("hidden")
  document.getElementById("loginModal").classList.remove("flex")
}

function showSignup() {
  document.getElementById("signupModal").classList.remove("hidden")
  document.getElementById("signupModal").classList.add("flex")
}

function hideSignup() {
  document.getElementById("signupModal").classList.add("hidden")
  document.getElementById("signupModal").classList.remove("flex")
}

function handleLogin(event) {
  event.preventDefault()
  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  // Simulate login - in real app, this would call an API
  if (email && password) {
    localStorage.setItem("user", JSON.stringify({ email }))
    window.location.href = "dashboard.html"
  }
}

function handleSignup(event) {
  event.preventDefault()
  const email = document.getElementById("signupEmail").value
  const password = document.getElementById("signupPassword").value
  const confirmPassword = document.getElementById("signupConfirmPassword").value

  if (password !== confirmPassword) {
    alert("Passwords do not match")
    return
  }

  // Simulate signup - in real app, this would call an API
  if (email && password) {
    localStorage.setItem("user", JSON.stringify({ email }))
    window.location.href = "dashboard.html"
  }
}

function showDashboard() {
  const user = localStorage.getItem("user")
  if (user) {
    window.location.href = "dashboard.html"
  } else {
    showLogin()
  }
}

function logout() {
  localStorage.removeItem("user")
  window.location.href = "index.html"
}

// Check if user is logged in on dashboard
function checkAuth() {
  const user = localStorage.getItem("user")
  if (!user && window.location.pathname.includes("dashboard.html")) {
    window.location.href = "index.html"
  } else if (user && window.location.pathname.includes("dashboard.html")) {
    const userData = JSON.parse(user)
    const userEmailElement = document.getElementById("userEmail")
    if (userEmailElement) {
      userEmailElement.textContent = userData.email
    }
  }
}

// Run auth check on page load
document.addEventListener("DOMContentLoaded", checkAuth)
