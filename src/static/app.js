document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Participants section HTML (sin viñetas y con ícono de eliminar)
        const participantsHTML =
          details.participants && details.participants.length > 0
            ? `<div class="participants-section">
                <strong>Participants:</strong>
                <ul class="participants-list" style="list-style: none; padding-left: 0;">
                  ${details.participants.map(email => `
                    <li style="display: flex; align-items: center; gap: 0.5em;">
                      <span>${email}</span>
                      <span class="delete-participant" title="Eliminar" data-activity="${name}" data-email="${email}" style="cursor:pointer;color:#c00;font-size:1.1em;">&#128465;</span>
                    </li>`).join("")}
                </ul>
              </div>`
            : `<div class="participants-section">
                <strong>Participants:</strong>
                <p class="no-participants">No participants yet.</p>
              </div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;


        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
    // Delegar eventos de eliminar participante
    activitiesList.addEventListener("click", async (event) => {
      const target = event.target;
      if (target.classList.contains("delete-participant")) {
        const activity = target.getAttribute("data-activity");
        const email = target.getAttribute("data-email");
        if (confirm(`¿Eliminar a ${email} de ${activity}?`)) {
          try {
            const res = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
              method: "DELETE"
            });
            if (!res.ok) {
              const data = await res.json();
              alert(data.detail || "Error al eliminar participante");
            } else {
              fetchActivities(); // Recargar lista
            }
          } catch (err) {
            alert("Error de red al eliminar participante");
          }
        }
      }
    });
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Actualizar lista de actividades automáticamente
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
