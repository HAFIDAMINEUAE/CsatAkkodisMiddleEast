const form = document.querySelector(".survey");
const button = document.querySelector("button[type='submit']");
const status = document.querySelector(".submission-status");

const defaultEndpoint = "/api/csat-responses";

const collectResponses = () => {
  const rows = [];
  const timestamp = new Date().toISOString();
  const emailInput = form.querySelector("input[name='respondent-email']");
  const emailValue = emailInput?.value.trim();

  rows.push(["Submitted at", timestamp]);
  rows.push(["Respondent email", emailValue || "Not provided"]);
  rows.push([]);

  const ratings = [];

  form.querySelectorAll(".question").forEach((fieldset) => {
    const legend = fieldset.querySelector("legend")?.textContent?.trim() || "";
    const selected = fieldset.querySelector("input[type='radio']:checked");
    rows.push([legend, selected ? selected.value : "No response"]);
    ratings.push({
      question: legend,
      score: selected ? Number(selected.value) : null,
    });
  });

  const comments = [];

  form.querySelectorAll(".text-question").forEach((label) => {
    const prompt = label.querySelector("span")?.textContent?.trim() || "";
    const textarea = label.querySelector("textarea");
    if (prompt && textarea) {
      const text = textarea.value.trim();
      rows.push([prompt, text || "No response"]);
      comments.push({ prompt, response: text || null });
    }
  });

  return {
    timestamp,
    respondentEmail: emailValue || null,
    ratings,
    comments,
    csvRows: rows,
  };
};

const buildCsv = (rows) =>
  rows
    .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

const downloadCsv = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  downloadLink.href = url;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
};

const buildMailtoLink = (recipient, fileName) => {
  const subject = encodeURIComponent("Akkodis Middle East CSAT Responses");
  const body = encodeURIComponent(
    `Hi,\n\nAttached is the CSAT responses export.\nFile name: ${fileName}\n\nThanks,`
  );
  return `mailto:${recipient}?subject=${subject}&body=${body}`;
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  button.disabled = true;
  button.textContent = "Submitting...";
  status.textContent = "Sending responses to the database...";

  const payload = collectResponses();
  const endpoint = form.dataset.endpoint || defaultEndpoint;
  const safeDate = payload.timestamp.replace(/[:.]/g, "-");
  const fileName = `csat-feedback-${safeDate}.csv`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const csvContent = buildCsv(payload.csvRows);
    downloadCsv(csvContent, fileName);

    const recipient = payload.respondentEmail || "";
    const mailtoHref = buildMailtoLink(recipient, fileName);
    status.innerHTML = `Responses saved successfully. CSV export downloaded. <a href="${mailtoHref}">Open an email draft</a> and attach the file.`;
    button.textContent = "Submitted ✔";
  } catch (error) {
    console.error("Unable to send responses", error);
    status.textContent =
      "We couldn't send the responses right now. Please try again or contact the support team.";
    button.textContent = "Submit responses";
  } finally {
    button.disabled = false;
  }
});
