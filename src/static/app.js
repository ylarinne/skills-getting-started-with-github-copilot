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
      // Reset select options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-header"><strong>Participants:</strong></p>
            <div class="participants-container"></div>
          </div>
        `;

        const participantsContainer = activityCard.querySelector('.participants-container');
        if (details.participants.length > 0) {
          const ul = document.createElement('ul');
          ul.className = 'participants-list';
          details.participants.forEach(email => {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.textContent = email;
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'delete-btn';
            delBtn.textContent = '✖';
            delBtn.title = `Remove ${email}`;
            delBtn.addEventListener('click', async () => {
              if (!confirm(`Remove ${email} from ${name}?`)) return;
              try {
                const resp = await fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
                const result = await resp.json();
                if (resp.ok) {
                  messageDiv.textContent = result.message;
                  messageDiv.className = 'success';
                  messageDiv.classList.remove('hidden');
                  fetchActivities();
                } else {
                  messageDiv.textContent = result.detail || 'Failed to remove participant';
                  messageDiv.className = 'error';
                  messageDiv.classList.remove('hidden');
                }
                setTimeout(() => { messageDiv.classList.add('hidden'); }, 5000);
              } catch (err) {
                console.error('Error removing participant:', err);
                messageDiv.textContent = 'Error removing participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
                setTimeout(() => { messageDiv.classList.add('hidden'); }, 5000);
              }
            });
            li.appendChild(span);
            li.appendChild(delBtn);
            ul.appendChild(li);
          });
          participantsContainer.appendChild(ul);
        } else {
          const p = document.createElement('p');
          p.className = 'no-participants';
          p.textContent = 'No participants yet';
          participantsContainer.appendChild(p);
        }

        activitiesList.appendChild(activityCard);

        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
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
        // Refresh activities to show new participant without manual reload
        fetchActivities();
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
