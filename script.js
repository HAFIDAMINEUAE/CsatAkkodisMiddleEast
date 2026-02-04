const form = document.querySelector(".survey");
const button = document.querySelector("button[type='submit']");
const status = document.querySelector(".submission-status");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const rows = [];
  const timestamp = new Date().toISOString();
  const emailInput = form.querySelector("input[name='respondent-email']");
  const emailValue = emailInput?.value.trim();

  rows.push(["Submitted at", timestamp]);
  rows.push(["Respondent email", emailValue || "Not provided"]);
  rows.push([]);

  form.querySelectorAll(".question").forEach((fieldset) => {
    const legend = fieldset.querySelector("legend")?.textContent?.trim() || "";
    const selected = fieldset.querySelector("input[type='radio']:checked");
    rows.push([legend, selected ? selected.value : "No response"]);
  });

  form.querySelectorAll(".text-question").forEach((label) => {
    const prompt = label.querySelector("span")?.textContent?.trim() || "";
    const textarea = label.querySelector("textarea");
    if (prompt && textarea) {
      const text = textarea.value.trim();
      rows.push([prompt, text || "No response"]);
    }
  });

  const csvContent = rows
    .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  const safeDate = timestamp.replace(/[:.]/g, "-");
  const fileName = `csat-feedback-${safeDate}.csv`;

  downloadLink.href = url;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);

  const subject = encodeURIComponent("Akkodis Middle East CSAT Responses");
  const body = encodeURIComponent(
    `Hi,\n\nAttached is the CSAT responses export.\nFile name: ${fileName}\n\nThanks,`
  );
  const recipient = emailValue || "";
  const mailtoHref = `mailto:${recipient}?subject=${subject}&body=${body}`;

  status.innerHTML = `CSV export downloaded. <a href="${mailtoHref}">Open an email draft</a> and attach the file.`;
  button.textContent = "Exported ✔";
});
