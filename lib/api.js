export async function getTools() {
  const response = await fetch("/api/tools", {
    method: "GET",
    cache: "no-store",
  });

  return response.json();
}

export async function createTool(data) {
  const response = await fetch("/api/tools", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

export async function updateTool(data) {
  const response = await fetch("/api/tools", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

export async function deleteTool(id) {
  const response = await fetch("/api/tools", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  return response.json();
}
