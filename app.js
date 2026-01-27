const API = "https://bend-tb-bceefzh4azg3buba.eastasia-01.azurewebsites.net";

/* ===== USER FUNCTIONS ===== */
function getUser() {
  return JSON.parse(localStorage.getItem("user"));
}

function logout() {
  localStorage.clear();
  location.href = "login.html";
}

/* ================= LOGIN ================= */

function login(e) {
  e.preventDefault();

  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;
  const error = document.getElementById("errorMsg");

  error?.classList.add("hidden");

  fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) {
        error.textContent = data.message || "Login failed";
        error.classList.remove("hidden");
        return;
      }

      // ✅ Store ONLY user object
      localStorage.setItem("user", JSON.stringify(data.user));
      location.href = "dashboard.html";
    })
    .catch(() => {
      error.textContent = "Server error";
      error.classList.remove("hidden");
    });
}

/* ================= REGISTER ================= */

function register(e) {
  e.preventDefault();

  const name = document.getElementById("name")?.value;
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;
  const error = document.getElementById("errorMsg");

  error?.classList.add("hidden");

  fetch(API + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  })
    .then((res) => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(() => (location.href = "login.html"))
    .catch(() => error?.classList.remove("hidden"));
}

/* ================= SERVICES ================= */

function addService(event) {
  event.preventDefault();   

  const u = getUser();
  if (!u) {
    alert("Please login first");
    return;
  }

  fetch(API + "/service", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: u.id,
      user_name: u.name,
      title: document.getElementById("title")?.value,
      description: document.getElementById("description")?.value,
      hours: document.getElementById("hours")?.value || 1,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert("Service Added");
        location.href = "my-services.html";
      } else {
        alert("Failed to add service");
      }
    })
    .catch(() => alert("Error adding service"));
}


/* ================= CONTACT ================= */

function sendMessage() {
  const u = getUser();
  if (!u) {
    alert("Please login first");
    return;
  }

  const name = document.getElementById("name")?.value.trim();
  const phone = document.getElementById("phone")?.value.trim();
  const subject = document.getElementById("subject")?.value.trim();
  const message = document.getElementById("message")?.value.trim();

  if (!name || !phone || !subject || !message) {
    alert("Please fill all fields");
    return;
  }

  fetch(API + "/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: u.id,
      name,
      phone,
      subject,
      message,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message || "Message sent");
      ["name", "phone", "subject", "message"].forEach(
        (id) => (document.getElementById(id).value = "")
      );
    })
    .catch((err) => alert("Error: " + err));
}

/* ================= BROWSE SKILLS ================= */

const skillsList = document.getElementById("skillsList");
const searchInput = document.getElementById("search");

let services = [];
let resources = [];

/* FETCH SERVICES ONLY IF skillsList EXISTS */
if (skillsList) {
  fetch(API + "/services")
    .then((res) => res.json())
    .then((data) => {
      services = data;
      renderServices(services);
    })
    .catch(() => {
      skillsList.innerHTML = `
        <div class="col-span-full text-center text-red-500 bg-white p-6 rounded shadow">
          Failed to load services
        </div>`;
    });

  /* FETCH RESOURCES ONLY ON THIS PAGE */
  fetch(API + "/resources")
    .then((res) => res.json())
    .then((data) => {
      resources = data;
    })
    .catch(() => {
      resources = [];
    });
}

/* ================= RENDER SERVICES ================= */

function renderServices(data) {
  if (!skillsList) return;

  if (!data || data.length === 0) {
    skillsList.innerHTML = `
      <div class="col-span-full text-center text-gray-500 bg-white p-6 rounded shadow">
        No skills available yet.
      </div>`;
    return;
  }

  skillsList.innerHTML = data
    .map((s) => {
      const relatedResources = resources.filter((r) => r.user_id === s.user_id);

      return `
      <div class="bg-white rounded-xl shadow hover:shadow-xl transition p-5 flex flex-col justify-between">

        <div>
          <h3 class="text-xl font-semibold text-gray-800">${s.title}</h3>

          <p class="text-sm text-gray-600 mt-2 line-clamp-3">
            ${s.description}
          </p>

          <div class="mt-4">
            <span class="inline-block bg-indigo-100 text-indigo-700 text-sm px-3 py-1 rounded-full">
              ⏱ ${s.hours} Hours
            </span>
          </div>

          <div class="mt-4">
            <h4 class="font-semibold text-gray-700 mb-2">Resources</h4>

            ${
              relatedResources.length === 0
                ? `<p class="text-sm text-gray-500">No resources uploaded</p>`
                : relatedResources
                    .map(
                      (r) => `
                    <div class="flex items-center justify-between bg-gray-50 p-2 rounded mb-2">
                      <span class="text-sm">
                        ${
                          r.file_type === "video"
                            ? "🎥"
                            : r.file_type === "pdf"
                            ? "📄"
                            : "📝"
                        }
                        ${r.title}
                      </span>
                      <a
                        href="${API}/uploads/${r.file_path}"
                        target="_blank"
                        class="text-indigo-600 text-sm font-semibold hover:underline">
                        View
                      </a>
                    </div>
                  `
                    )
                    .join("")
            }
          </div>
        </div>

        <p class="text-xs text-gray-400 mt-4">
          Shared by <b>${s.user_name || "Unknown User"}</b>
        </p>

      </div>
    `;
    })
    .join("");
}

/* ================= SEARCH ================= */

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase();

    const filtered = services.filter(
      (s) =>
        s.title.toLowerCase().includes(value) ||
        s.description.toLowerCase().includes(value)
    );

    renderServices(filtered);
  });
}
